package com.warrencrasta.fantasy.yahoo.service.core;

import com.warrencrasta.fantasy.yahoo.domain.player.RankedPlayer;
import java.util.List;

public interface PlayerRankingService {

  List<RankedPlayer> getRankedPlayers(String leagueId);
}
