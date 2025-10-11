package com.warrencrasta.fantasy.yahoo.service.core;

import com.warrencrasta.fantasy.yahoo.domain.player.Player;
import java.util.List;

public interface PlayerService {

  List<Player> getDraftablePlayers(String leagueId);

  List<String> getDraftedPlayerIds(String leagueId);
}
