package com.warrencrasta.fantasy.yahoo.service.core;

import com.warrencrasta.fantasy.yahoo.domain.player.Player;
import com.warrencrasta.fantasy.yahoo.domain.player.RankedPlayer;
import com.warrencrasta.fantasy.yahoo.domain.stat.StatCategory;
import com.warrencrasta.fantasy.yahoo.service.core.league.LeagueService;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import org.springframework.stereotype.Service;

@Service
public class YahooPlayerRankingServiceImpl implements PlayerRankingService {

  private static final List<String> TARGET_CATEGORIES =
      List.of("FG%", "FT%", "3PTM", "PTS", "REB", "AST", "ST", "BLK", "TO");

  private static final Map<String, List<String>> CATEGORY_ALIASES = Map.of(
      "FG%", List.of("FG%", "Field Goal %", "Field Goals %", "Field Goal Percentage"),
      "FT%", List.of("FT%", "Free Throw %", "Free Throw Percentage"),
      "3PTM", List.of("3PTM", "3PT Made", "3-PT Made", "3PT"),
      "PTS", List.of("PTS", "Points"),
      "REB", List.of("REB", "Rebounds"),
      "AST", List.of("AST", "Assists"),
      "ST", List.of("ST", "Steals"),
      "BLK", List.of("BLK", "Blocks"),
      "TO", List.of("TO", "Turnovers", "TOV"));

  private static final Map<String, String> DEFAULT_STAT_IDS = Map.of(
      "FG%", "5",
      "FT%", "8",
      "3PTM", "10",
      "PTS", "12",
      "REB", "15",
      "AST", "16",
      "ST", "17",
      "BLK", "18",
      "TO", "19");

  private final PlayerService playerService;
  private final LeagueService leagueService;

  public YahooPlayerRankingServiceImpl(PlayerService playerService, LeagueService leagueService) {
    this.playerService = playerService;
    this.leagueService = leagueService;
  }

  @Override
  public List<RankedPlayer> getRankedPlayers(String leagueId) {
    return getRankedPlayers(leagueId, "stats");
  }

  @Override
  public List<RankedPlayer> getRankedPlayers(String leagueId, String statSource) {
    List<Player> players = playerService.getDraftablePlayers(leagueId, statSource);
    if (players.isEmpty()) {
      return List.of();
    }

    Map<String, StatCategory> categoriesByName = mapCategoriesByCanonicalName(leagueId);

    Map<String, String> categoryNameToStatId = new LinkedHashMap<>();
    Map<String, Boolean> categoryBadness = new HashMap<>();
    for (String categoryName : TARGET_CATEGORIES) {
      StatCategory category = categoriesByName.get(categoryName);
      String statId = category != null ? category.getId() : DEFAULT_STAT_IDS.get(categoryName);
      categoryNameToStatId.put(categoryName, statId);
      categoryBadness.put(categoryName, category != null && category.isBad());
    }

    Map<String, List<Double>> valuesByCategory = new LinkedHashMap<>();
    for (String categoryName : TARGET_CATEGORIES) {
      valuesByCategory.put(categoryName, new ArrayList<>());
    }

    for (Player player : players) {
      Map<String, Double> stats = player.getStats();
      for (String categoryName : TARGET_CATEGORIES) {
        String statId = categoryNameToStatId.get(categoryName);
        double value = 0.0;
        if (stats != null && statId != null) {
          value = stats.getOrDefault(statId, 0.0);
        }
        valuesByCategory.get(categoryName).add(value);
      }
    }

    Map<String, Double> averagesByCategory = new HashMap<>();
    Map<String, Double> stdDevsByCategory = new HashMap<>();

    for (Map.Entry<String, List<Double>> entry : valuesByCategory.entrySet()) {
      List<Double> values = entry.getValue();
      double average = calculateAverage(values);
      averagesByCategory.put(entry.getKey(), average);
      stdDevsByCategory.put(entry.getKey(), calculateStandardDeviation(values, average));
    }

    List<RankedPlayer> rankedPlayers = new ArrayList<>();
    for (Player player : players) {
      RankedPlayer rankedPlayer = new RankedPlayer();
      rankedPlayer.setPlayerId(player.getPlayerId());
      rankedPlayer.setName(player.getName());
      rankedPlayer.setTeam(player.getTeam());
      rankedPlayer.setPositions(player.getPositions() != null ? new ArrayList<>(player.getPositions()) : List.of());

      Map<String, Double> namedStats = new LinkedHashMap<>();
      double totalZScore = 0.0;
      Map<String, Double> stats = player.getStats();

      for (String categoryName : TARGET_CATEGORIES) {
        String statId = categoryNameToStatId.get(categoryName);
        double value = 0.0;
        if (stats != null && statId != null) {
          value = stats.getOrDefault(statId, 0.0);
        }
        namedStats.put(categoryName, value);

        double average = averagesByCategory.getOrDefault(categoryName, 0.0);
        double stdDev = stdDevsByCategory.getOrDefault(categoryName, 0.0);
        double zScore = 0.0;
        if (stdDev > 0.0) {
          zScore = (value - average) / stdDev;
        }
        if ("TO".equals(categoryName) || categoryBadness.getOrDefault(categoryName, false)) {
          zScore *= -1;
        }
        totalZScore += zScore;
      }

      rankedPlayer.setStats(namedStats);
      rankedPlayer.setZScoreValue(totalZScore);
      rankedPlayers.add(rankedPlayer);
    }

    rankedPlayers.sort((first, second) -> Double.compare(second.getZScoreValue(), first.getZScoreValue()));

    for (int i = 0; i < rankedPlayers.size(); i++) {
      rankedPlayers.get(i).setTotalRank(i + 1);
    }

    return rankedPlayers;
  }

  private double calculateAverage(List<Double> values) {
    if (values.isEmpty()) {
      return 0.0;
    }
    double sum = 0.0;
    for (Double value : values) {
      sum += value;
    }
    return sum / values.size();
  }

  private double calculateStandardDeviation(List<Double> values, double average) {
    if (values.isEmpty()) {
      return 0.0;
    }
    double sum = 0.0;
    for (Double value : values) {
      double diff = value - average;
      sum += diff * diff;
    }
    return Math.sqrt(sum / values.size());
  }

  private Map<String, StatCategory> mapCategoriesByCanonicalName(String leagueId) {
    Map<String, StatCategory> categoriesByName = new HashMap<>();
    List<StatCategory> relevantCategories = leagueService.getRelevantCategories(leagueId);
    for (StatCategory category : relevantCategories) {
      if (category.getName() == null) {
        continue;
      }
      for (Entry<String, List<String>> aliasEntry : CATEGORY_ALIASES.entrySet()) {
        for (String alias : aliasEntry.getValue()) {
          if (alias.equalsIgnoreCase(category.getName())) {
            categoriesByName.putIfAbsent(aliasEntry.getKey(), category);
            break;
          }
        }
      }
    }
    return categoriesByName;
  }
}
