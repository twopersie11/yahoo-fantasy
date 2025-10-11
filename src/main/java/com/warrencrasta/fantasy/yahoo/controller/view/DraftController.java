package com.warrencrasta.fantasy.yahoo.controller.view;

import com.warrencrasta.fantasy.yahoo.service.core.user.UserService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DraftController {

  private final UserService userService;

  public DraftController(UserService userService) {
    this.userService = userService;
  }

  @GetMapping("/draft-tool")
  public String draftTool(Model model) {
    model.addAttribute("seasons", userService.getSeasonsForUser());
    return "draft-tool";
  }
}
