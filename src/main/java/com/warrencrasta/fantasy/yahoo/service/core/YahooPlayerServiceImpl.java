package com.warrencrasta.fantasy.yahoo.service.core;

import com.warrencrasta.fantasy.yahoo.domain.player.Player;
import com.warrencrasta.fantasy.yahoo.dto.external.yahoo.DraftResultDTO;
import com.warrencrasta.fantasy.yahoo.dto.external.yahoo.FantasyContentDTO;
import com.warrencrasta.fantasy.yahoo.dto.external.yahoo.player.PlayerWrapperDTO;
import com.warrencrasta.fantasy.yahoo.mapper.PlayerMapper;
import com.warrencrasta.fantasy.yahoo.service.client.YahooClient;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Service
public class YahooPlayerServiceImpl implements PlayerService {

  private static final Logger logger = LoggerFactory.getLogger(YahooPlayerServiceImpl.class);
  private final YahooClient yahooClient;
  private final PlayerMapper playerMapper;

  public YahooPlayerServiceImpl(YahooClient yahooClient, PlayerMapper playerMapper) {
    this.yahooClient = yahooClient;
    this.playerMapper = playerMapper;
  }

  @Override
  public List<Player> getDraftablePlayers(String leagueId, String statSource) {
    List<Player> allPlayers = new ArrayList<>();
    int start = 0;
    final int count = 25;

    // Logic to determine if we can request projections.
    // Yahoo's game ID for the 2024-25 season is 466. Projections are generally only available for the current/upcoming season.
    String gameId = leagueId.substring(0, leagueId.indexOf('.'));
    String statsModifier = "stats"; // Default to last season's stats
    if ("projected".equalsIgnoreCase(statSource)) {
      // Only request projections if it's the current game year.
      // This is a simple heuristic; a more robust solution might fetch the game year from the API.
      if (Integer.parseInt(gameId) >= 466) {
        statsModifier = "stats;type=projections";
      } else {
        logger.warn(
            "Projections requested for a past season (league {}). Defaulting to actual stats.", leagueId);
      }
    }

    while (true) {
      Map<String, String> uriVariables = new HashMap<>();
      uriVariables.put("league_key", leagueId);
      // CORRECTED LINE: The "/" before %s was removed and replaced with ";".
      var resourceUriFragment = String.format("/league/{league_key}/players;sort=AR;status=A;start=%d;count=%d;%s", start, count, statsModifier);

      try {
        FantasyContentDTO fantasyContent = yahooClient.getFantasyContent(uriVariables, resourceUriFragment);

        if (fantasyContent.getLeague() == null || fantasyContent.getLeague().getPlayers() == null) {
          break;
        }

        List<PlayerWrapperDTO> playerWrapperDTOs = fantasyContent.getLeague().getPlayers();
        if (playerWrapperDTOs.isEmpty()) {
          break;
        }

        allPlayers.addAll(playerMapper.playerWrapperDTOsToPlayers(playerWrapperDTOs));
        start += count;

      } catch (WebClientResponseException ex) {
        logger.error("Error fetching draftable players for league {} at start {}: {}", leagueId, start, ex.getMessage());
        break;
      }
    }
    return allPlayers;
  }

  @Override
  public List<String> getDraftedPlayerIds(String leagueId) {
    Map<String, String> uriVariables = new HashMap<>();
    uriVariables.put("league_key", leagueId);
    var resourceUriFragment = "/league/{league_key}/draftresults";

    try {
      FantasyContentDTO fantasyContent = yahooClient.getFantasyContent(uriVariables, resourceUriFragment);

      if (fantasyContent.getLeague() == null || fantasyContent.getLeague().getDraftResults() == null) {
        return Collections.emptyList();
      }
      
      List<DraftResultDTO> draftResults = fantasyContent.getLeague().getDraftResults();
      if (draftResults.isEmpty()) {
        return Collections.emptyList();
      }

      List<String> draftedPlayerIds = new ArrayList<>();
      for (DraftResultDTO draftResult : draftResults) {
        if (draftResult == null) {
          continue;
        }
        String playerId = extractPlayerIdFromKey(draftResult.getPlayerKey());
        if (playerId != null && !playerId.isBlank()) {
          draftedPlayerIds.add(playerId);
        }
      }

      return draftedPlayerIds;
    } catch (WebClientResponseException ex) {
      logger.warn(
          "Could not fetch draft results for league {}. This is expected if the draft has not occurred. Error: {}",
          leagueId, ex.getMessage());
      return Collections.emptyList();
    }
  }

  private String extractPlayerIdFromKey(String playerKey) {
    if (playerKey == null) {
      return null;
    }
    int lastIndex = playerKey.lastIndexOf('.');
    if (lastIndex == -1 || lastIndex == playerKey.length() - 1) {
      return null;
    }
    return playerKey.substring(lastIndex + 1);
  }
}
