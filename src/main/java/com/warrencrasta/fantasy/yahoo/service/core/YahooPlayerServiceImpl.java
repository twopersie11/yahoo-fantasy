package com.warrencrasta.fantasy.yahoo.service.core;

import com.warrencrasta.fantasy.yahoo.domain.player.Player;
import com.warrencrasta.fantasy.yahoo.dto.external.yahoo.DraftResultDTO;
import com.warrencrasta.fantasy.yahoo.dto.external.yahoo.FantasyContentDTO;
import com.warrencrasta.fantasy.yahoo.dto.external.yahoo.player.PlayerWrapperDTO;
import com.warrencrasta.fantasy.yahoo.mapper.PlayerMapper;
import com.warrencrasta.fantasy.yahoo.service.client.YahooClient;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class YahooPlayerServiceImpl implements PlayerService {

  private final YahooClient yahooClient;
  private final PlayerMapper playerMapper;

  public YahooPlayerServiceImpl(YahooClient yahooClient, PlayerMapper playerMapper) {
    this.yahooClient = yahooClient;
    this.playerMapper = playerMapper;
  }

  @Override
  public List<Player> getDraftablePlayers(String leagueId) {
    Map<String, String> uriVariables = new HashMap<>();
    uriVariables.put("league_key", leagueId);
    var resourceUriFragment = "/league/{league_key}/players;sort=AR;status=A/stats";

    FantasyContentDTO fantasyContent = yahooClient.getFantasyContent(uriVariables, resourceUriFragment);

    if (fantasyContent.getLeague() == null
        || fantasyContent.getLeague().getPlayers() == null
        || fantasyContent.getLeague().getPlayers().getPlayers() == null) {
      return List.of();
    }

    List<PlayerWrapperDTO> playerWrapperDTOs = fantasyContent.getLeague().getPlayers().getPlayers();
    return playerMapper.playerWrapperDTOsToPlayers(playerWrapperDTOs);
  }

  @Override
  public List<String> getDraftedPlayerIds(String leagueId) {
    FantasyContentDTO fantasyContent = yahooClient.getFantasyContent("/draftresults/" + leagueId);

    if (fantasyContent.getLeague() == null
        || fantasyContent.getLeague().getDraftResults() == null
        || fantasyContent.getLeague().getDraftResults().getDraftResults() == null) {
      return List.of();
    }

    List<DraftResultDTO> draftResults = fantasyContent.getLeague().getDraftResults().getDraftResults();

    List<String> draftedPlayerIds = new ArrayList<>();
    for (DraftResultDTO draftResult : draftResults) {
      if (draftResult == null) {
        continue;
      }
      String playerId = draftResult.getPlayerId();
      if (playerId == null || playerId.isBlank()) {
        playerId = extractPlayerIdFromKey(draftResult.getPlayerKey());
      }
      if (playerId != null && !playerId.isBlank()) {
        draftedPlayerIds.add(playerId);
      }
    }

    return draftedPlayerIds;
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
