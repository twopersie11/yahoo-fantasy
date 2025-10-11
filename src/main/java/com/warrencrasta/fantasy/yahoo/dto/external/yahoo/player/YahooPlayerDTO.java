package com.warrencrasta.fantasy.yahoo.dto.external.yahoo.player;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class YahooPlayerDTO {

  @JsonAlias("player_id")
  private String playerId;

  private PlayerNameDTO name;

  @JsonAlias("editorial_team_abbr")
  private String editorialTeamAbbr;

  @JsonAlias("eligible_positions")
  private List<EligiblePositionDTO> eligiblePositions;

  @JsonAlias("player_stats")
  private PlayerStatsDTO playerStats;
}
