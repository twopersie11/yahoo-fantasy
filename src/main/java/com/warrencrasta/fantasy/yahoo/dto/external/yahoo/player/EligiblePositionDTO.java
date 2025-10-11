package com.warrencrasta.fantasy.yahoo.dto.external.yahoo.player;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class EligiblePositionDTO {

  private String position;
}
