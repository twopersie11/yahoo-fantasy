(function($) {
  const seasonFileMap = {
    '2024-25': '/data/nba-player-stats-24-25.json',
    '2023-24': '/data/nba-player-stats-23-24.json'
  };

  const defaultSeason = '2024-25';
  const playersBySeason = {};

  let dataTable;

  const seasonSelect = document.getElementById('season');
  const searchInput = document.getElementById('playerSearch');
  const minPointsInput = document.getElementById('minPoints');
  const minReboundsInput = document.getElementById('minRebounds');
  const minAssistsInput = document.getElementById('minAssists');
  const minStealsInput = document.getElementById('minSteals');
  const minBlocksInput = document.getElementById('minBlocks');
  const minThreesInput = document.getElementById('minThreePointers');
  const maxTurnoversInput = document.getElementById('maxTurnovers');
  const playerCountBadge = document.getElementById('playerCount');
  const resetButton = document.getElementById('resetFilters');

  function getActiveView() {
    const checked = document.querySelector('input[name="statView"]:checked');
    return checked ? checked.value : 'averages';
  }

  function updateHeaderLabels(view) {
    const headerSuffix = view === 'averages' ? ' (AVG)' : ' (TOT)';
    document.getElementById('threeHeader').textContent = `3PM${headerSuffix}`;
    document.getElementById('ptsHeader').textContent = `PTS${headerSuffix}`;
    document.getElementById('rebHeader').textContent = `REB${headerSuffix}`;
    document.getElementById('astHeader').textContent = `AST${headerSuffix}`;
    document.getElementById('stlHeader').textContent = `STL${headerSuffix}`;
    document.getElementById('blkHeader').textContent = `BLK${headerSuffix}`;
    document.getElementById('tovHeader').textContent = `TOV${headerSuffix}`;
  }

  function formatNumber(value, decimals) {
    if (value === null || value === undefined) {
      return '-';
    }
    return Number(value).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function formatStat(value, view) {
    if (value === null || value === undefined) {
      return '-';
    }
    const decimals = view === 'averages' ? 1 : 0;
    const numberToFormat = view === 'averages' ? value : Math.round(value);
    return formatNumber(numberToFormat, decimals);
  }

  function formatPercentage(value) {
    if (value === null || value === undefined) {
      return '-';
    }
    return `${(value * 100).toFixed(1)}%`;
  }

  function getNumericValue(input) {
    const value = parseFloat(input.value);
    return Number.isNaN(value) ? null : value;
  }

  function renderPlayers() {
    const season = seasonSelect.value;
    const players = playersBySeason[season] || [];

    const view = getActiveView();
    updateHeaderLabels(view);

    const minPoints = getNumericValue(minPointsInput);
    const minRebounds = getNumericValue(minReboundsInput);
    const minAssists = getNumericValue(minAssistsInput);
    const minSteals = getNumericValue(minStealsInput);
    const minBlocks = getNumericValue(minBlocksInput);
    const minThrees = getNumericValue(minThreesInput);
    const maxTurnovers = getNumericValue(maxTurnoversInput);
    const searchText = searchInput.value.trim().toLowerCase();

    const filtered = players.filter((player) => {
      const stats = player[view];
      if (!stats) {
        return false;
      }

      if (searchText) {
        const fields = [player.name, player.team, player.position];
        const matches = fields.some((field) => field.toLowerCase().includes(searchText));
        if (!matches) {
          return false;
        }
      }

      if (minPoints !== null && stats.pts < minPoints) {
        return false;
      }
      if (minRebounds !== null && stats.reb < minRebounds) {
        return false;
      }
      if (minAssists !== null && stats.ast < minAssists) {
        return false;
      }
      if (minSteals !== null && stats.stl < minSteals) {
        return false;
      }
      if (minBlocks !== null && stats.blk < minBlocks) {
        return false;
      }
      if (minThrees !== null && stats.threePm < minThrees) {
        return false;
      }
      if (maxTurnovers !== null && stats.tov > maxTurnovers) {
        return false;
      }

      return true;
    });

    const rows = filtered.map((player) => {
      const stats = player[view];
      return [
        player.name,
        player.team,
        player.position,
        player.gamesPlayed,
        formatPercentage(stats.fgPct),
        formatStat(stats.threePm, view),
        formatStat(stats.pts, view),
        formatStat(stats.reb, view),
        formatStat(stats.ast, view),
        formatStat(stats.stl, view),
        formatStat(stats.blk, view),
        formatStat(stats.tov, view)
      ];
    });

    dataTable.clear();
    if (rows.length > 0) {
      dataTable.rows.add(rows);
    }
    dataTable.draw();

    playerCountBadge.textContent = rows.length.toString();
  }

  function loadSeason(season) {
    const source = seasonFileMap[season];
    if (!source) {
      return;
    }

    if (playersBySeason[season]) {
      renderPlayers();
      return;
    }

    dataTable.clear();
    dataTable.row.add(['Loading player data…', '', '', '', '', '', '', '', '', '', '', '']).draw();

    fetch(source)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to load dataset');
          }
          return response.json();
        })
        .then((data) => {
          playersBySeason[season] = Array.isArray(data.players) ? data.players : [];
          renderPlayers();
        })
        .catch(() => {
          dataTable.clear();
          dataTable.row.add(['Unable to load player data', '', '', '', '', '', '', '', '', '', '', '']).draw();
          playerCountBadge.textContent = '0';
        });
  }

  function resetFilters() {
    searchInput.value = '';
    minPointsInput.value = '';
    minReboundsInput.value = '';
    minAssistsInput.value = '';
    minStealsInput.value = '';
    minBlocksInput.value = '';
    minThreesInput.value = '';
    maxTurnoversInput.value = '';
    document.getElementById('view-averages').checked = true;
    renderPlayers();
  }

  $(document).ready(function() {
    dataTable = $('#playerStatsTable').DataTable({
      searching: false,
      paging: true,
      lengthChange: false,
      pageLength: 25,
      order: [[6, 'desc']],
      columns: [
        { title: 'Player' },
        { title: 'Team' },
        { title: 'Pos' },
        { title: 'GP' },
        { title: 'FG%' },
        { title: '3PM' },
        { title: 'PTS' },
        { title: 'REB' },
        { title: 'AST' },
        { title: 'STL' },
        { title: 'BLK' },
        { title: 'TOV' }
      ],
      language: {
        emptyTable: 'No players match your filters yet. Adjust the controls to broaden your search.'
      },
      columnDefs: [
        { targets: [0, 1, 2], className: 'text-nowrap' },
        { targets: [3], className: 'text-center' },
        { targets: [4], className: 'text-right' },
        { targets: [5, 6, 7, 8, 9, 10, 11], className: 'text-right' }
      ]
    });

    // Remove placeholder row generated in the template once DataTables is ready.
    dataTable.clear().draw();

    seasonSelect.value = defaultSeason;
    loadSeason(defaultSeason);

    seasonSelect.addEventListener('change', (event) => {
      const selectedSeason = event.target.value;
      loadSeason(selectedSeason);
    });

    document.querySelectorAll('input[name="statView"]').forEach((input) => {
      input.addEventListener('change', renderPlayers);
    });

    [
      minPointsInput,
      minReboundsInput,
      minAssistsInput,
      minStealsInput,
      minBlocksInput,
      minThreesInput,
      maxTurnoversInput
    ].forEach((input) => {
      input.addEventListener('input', renderPlayers);
    });

    searchInput.addEventListener('input', renderPlayers);
    resetButton.addEventListener('click', resetFilters);

    $('#menu-toggle').click(function(e) {
      e.preventDefault();
      $('#wrapper').toggleClass('toggled');
    });
  });
})(jQuery);
