package com.warrencrasta.fantasy.yahoo.dto.external.yahoo;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.warrencrasta.fantasy.yahoo.dto.external.yahoo.player.PlayerWrapperDTO;
import java.util.List;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class LeagueDTO {

  private String name;

  @JsonAlias({"league_key"})
  private String leagueKey;

  @JsonAlias({"current_week"})
  private String currentWeek;

  @JsonAlias({"start_week"})
  private String startWeek;

  private List<TeamWrapperDTO> teams;

  private ScoreboardDTO scoreboard;

  private SettingsDTO settings;

  @JsonAlias({"players"})
  private List<PlayerWrapperDTO> players;

  // CORRECTED: This now correctly expects a List, which handles the empty array case.
  @JsonAlias({"draft_results"})
  private List<DraftResultDTO> draftResults;
}
