package com.warrencrasta.fantasy.yahoo.domain.player;

import java.util.List;
import java.util.Map;
import lombok.Data;

@Data
public class Player {

  private String playerId;
  private String name;
  private String team;
  private List<String> positions;
  private Map<String, Double> stats;
}
