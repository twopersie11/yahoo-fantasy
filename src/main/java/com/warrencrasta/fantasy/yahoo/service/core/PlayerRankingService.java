package com.warrencrasta.fantasy.yahoo.service.core;

import com.warrencrasta.fantasy.yahoo.domain.player.RankedPlayer;
import java.util.List;

public interface PlayerRankingService {

  default List<RankedPlayer> getRankedPlayers(String leagueId) {
    return getRankedPlayers(leagueId, "stats");
  }

  List<RankedPlayer> getRankedPlayers(String leagueId, String statSource);
}
