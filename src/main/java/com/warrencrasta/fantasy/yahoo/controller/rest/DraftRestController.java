package com.warrencrasta.fantasy.yahoo.controller.rest;

import com.warrencrasta.fantasy.yahoo.domain.player.RankedPlayer;
import com.warrencrasta.fantasy.yahoo.service.core.PlayerRankingService;
import com.warrencrasta.fantasy.yahoo.service.core.PlayerService;
import java.util.List;
import javax.validation.constraints.NotBlank;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/leagues")
@Validated
public class DraftRestController {

  private final PlayerRankingService playerRankingService;
  private final PlayerService playerService;

  public DraftRestController(PlayerRankingService playerRankingService, PlayerService playerService) {
    this.playerRankingService = playerRankingService;
    this.playerService = playerService;
  }

  @GetMapping("/{leagueId}/draft-rankings")
  public List<RankedPlayer> getDraftRankings(
      @PathVariable @NotBlank String leagueId,
      @RequestParam(name = "statSource", defaultValue = "stats") String statSource) {
    return playerRankingService.getRankedPlayers(leagueId, statSource);
  }

  @GetMapping("/{leagueId}/draft-picks")
  public List<String> getDraftedPlayers(@PathVariable @NotBlank String leagueId) {
    return playerService.getDraftedPlayerIds(leagueId);
  }
}
