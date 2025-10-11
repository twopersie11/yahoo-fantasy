$(document).ready(function() {
  let seasonId;
  let leagueId;
  let draftTable;
  let pollHandle;
  let draftedPlayerIds = new Set();

  $('#season').change(function(){
    seasonId = $(this).val();
    leagueId = null;
    stopDraftPolling();
    resetDraftTable();
    let url = "/seasons/" + seasonId + "/leagues";
    $.getJSON(url, {
      ajax : 'true'
    }, function(leagues) {
      let leaguesDropdownHtml = '<option value="">Select a League</option>';
      for (let league of leagues) {
        leaguesDropdownHtml += '<option value="' + league.id + '">' + league.name + '</option>';
      }
      leaguesDropdownHtml += '</option>';
      $('#league').html(leaguesDropdownHtml);
    });
  });

  $('#league').change(function(){
    leagueId = $(this).val();
    if (!leagueId) {
      stopDraftPolling();
      resetDraftTable();
      return;
    }
    loadDraftRankings();
    startDraftPolling();
  });

  function resetDraftTable() {
    if (draftTable) {
      draftTable.clear().destroy();
      draftTable = null;
    }
    $('#draftRankings tbody').html('<tr class="table-secondary text-center"><td colspan="14">Select a league to view draft rankings.</td></tr>');
    draftedPlayerIds = new Set();
  }

  function loadDraftRankings() {
    if (draftTable) {
      draftTable.clear().destroy();
      $('#draftRankings tbody').empty();
    }
    $('#draftRankings tbody').empty();
    draftedPlayerIds = new Set();
    draftTable = $('#draftRankings').DataTable({
      paging: false,
      ajax: {
        url: '/leagues/' + leagueId + '/draft-rankings',
        dataSrc: ''
      },
      columns: [
        { data: 'totalRank', title: 'Rank' },
        { data: 'name', title: 'Name' },
        {
          data: function(row) {
            if (!row.positions || row.positions.length === 0) {
              return '';
            }
            return row.positions.join(', ');
          },
          title: 'Position'
        },
        { data: 'team', title: 'Team' },
        { data: function(row) { return formatStat(row.stats, 'FG%'); }, title: 'FG%' },
        { data: function(row) { return formatStat(row.stats, 'FT%'); }, title: 'FT%' },
        { data: function(row) { return formatStat(row.stats, '3PTM'); }, title: '3PTM' },
        { data: function(row) { return formatStat(row.stats, 'PTS'); }, title: 'PTS' },
        { data: function(row) { return formatStat(row.stats, 'REB'); }, title: 'REB' },
        { data: function(row) { return formatStat(row.stats, 'AST'); }, title: 'AST' },
        { data: function(row) { return formatStat(row.stats, 'ST'); }, title: 'ST' },
        { data: function(row) { return formatStat(row.stats, 'BLK'); }, title: 'BLK' },
        { data: function(row) { return formatStat(row.stats, 'TO'); }, title: 'TO' },
        {
          data: function(row) {
            if (row.zScoreValue === undefined || row.zScoreValue === null) {
              return '';
            }
            return row.zScoreValue.toFixed(2);
          },
          title: 'Value'
        }
      ],
      order: [[0, 'asc']],
      createdRow: function(row, data) {
        $(row).attr('data-player-id', data.playerId);
      }
    });

    draftTable.on('draw', function() {
      applyDraftedStyling();
    });
  }

  function formatStat(stats, key) {
    if (!stats || stats[key] === undefined || stats[key] === null) {
      return '';
    }
    let numericValue = Number(stats[key]);
    if (Number.isNaN(numericValue)) {
      return stats[key];
    }
    if (key === 'TO') {
      return numericValue.toFixed(1);
    }
    return numericValue.toFixed(2);
  }

  function startDraftPolling() {
    if (pollHandle) {
      clearInterval(pollHandle);
    }
    fetchDraftedPlayers();
    pollHandle = setInterval(fetchDraftedPlayers, 10000);
  }

  function stopDraftPolling() {
    if (pollHandle) {
      clearInterval(pollHandle);
      pollHandle = null;
    }
  }

  function fetchDraftedPlayers() {
    if (!leagueId) {
      return;
    }
    $.getJSON('/leagues/' + leagueId + '/draft-picks', {
      ajax : 'true'
    }, function(playerIds) {
      draftedPlayerIds = new Set(playerIds);
      applyDraftedStyling();
    });
  }

  function applyDraftedStyling() {
    if (!draftTable) {
      return;
    }
    draftTable.rows().every(function() {
      let rowNode = $(this.node());
      let data = this.data();
      if (draftedPlayerIds.has(data.playerId)) {
        rowNode.addClass('drafted');
      } else {
        rowNode.removeClass('drafted');
      }
    });
  }
});

$("#menu-toggle").click(function(e) {
  e.preventDefault();
  $("#wrapper").toggleClass("toggled");
});
