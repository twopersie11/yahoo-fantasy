package com.warrencrasta.fantasy.yahoo.mapper;

import com.warrencrasta.fantasy.yahoo.domain.player.Player;
import com.warrencrasta.fantasy.yahoo.dto.external.yahoo.player.EligiblePositionDTO;
import com.warrencrasta.fantasy.yahoo.dto.external.yahoo.player.PlayerStatWrapperDTO;
import com.warrencrasta.fantasy.yahoo.dto.external.yahoo.player.PlayerWrapperDTO;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PlayerMapper {

  @Mapping(source = "player.playerId", target = "playerId")
  @Mapping(source = "player.name.fullName", target = "name")
  @Mapping(source = "player.editorialTeamAbbr", target = "team")
  @Mapping(source = "player.eligiblePositions", target = "positions")
  @Mapping(source = "player.playerStats.stats", target = "stats")
  Player playerWrapperDTOToPlayer(PlayerWrapperDTO playerWrapperDTO);

  List<Player> playerWrapperDTOsToPlayers(List<PlayerWrapperDTO> playerWrapperDTOs);

  default List<String> mapEligiblePositions(List<EligiblePositionDTO> eligiblePositions) {
    List<String> positions = new ArrayList<>();
    if (eligiblePositions == null) {
      return positions;
    }
    for (EligiblePositionDTO eligiblePosition : eligiblePositions) {
      if (eligiblePosition.getPosition() != null) {
        positions.add(eligiblePosition.getPosition());
      }
    }
    return positions;
  }

  default Map<String, Double> mapStats(List<PlayerStatWrapperDTO> statWrapperDTOs) {
    Map<String, Double> stats = new HashMap<>();
    if (statWrapperDTOs == null) {
      return stats;
    }
    for (PlayerStatWrapperDTO statWrapperDTO : statWrapperDTOs) {
      if (statWrapperDTO.getStat() == null) {
        continue;
      }
      var stat = statWrapperDTO.getStat();
      if (stat.getStatId() == null) {
        continue;
      }
      double value = 0.0;
      if (stat.getValue() != null) {
        try {
          value = Double.parseDouble(stat.getValue());
        } catch (NumberFormatException ignored) {
          value = 0.0;
        }
      }
      stats.put(stat.getStatId(), value);
    }
    return stats;
  }
}
