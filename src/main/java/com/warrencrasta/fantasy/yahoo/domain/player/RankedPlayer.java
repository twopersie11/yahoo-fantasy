package com.warrencrasta.fantasy.yahoo.domain.player;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class RankedPlayer extends Player {

  private int totalRank;
  private double zScoreValue;
}
