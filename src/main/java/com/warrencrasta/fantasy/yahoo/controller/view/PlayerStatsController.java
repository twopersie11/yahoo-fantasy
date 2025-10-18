package com.warrencrasta.fantasy.yahoo.controller.view;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PlayerStatsController {

  @GetMapping("/player-stats")
  public String getPlayerStatsPage() {
    return "player-stats";
  }
}
