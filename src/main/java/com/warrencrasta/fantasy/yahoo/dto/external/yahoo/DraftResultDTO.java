package com.warrencrasta.fantasy.yahoo.dto.external.yahoo;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DraftResultDTO {

  private String pick;
  private String round;

  @JsonAlias("player_key")
  private String playerKey;

  @JsonAlias("player_id")
  private String playerId;
}
