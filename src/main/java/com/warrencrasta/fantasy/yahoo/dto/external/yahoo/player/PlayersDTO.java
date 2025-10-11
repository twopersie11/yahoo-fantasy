package com.warrencrasta.fantasy.yahoo.dto.external.yahoo.player;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PlayersDTO {

  @JsonAlias({"player"})
  private List<PlayerWrapperDTO> players;
}
