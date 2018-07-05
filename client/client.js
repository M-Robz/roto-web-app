// Globals from HTML: pageConfig

$(document).ready(function() {
  var $container = $('#table-container'),
      $standingsTable = $('#standings'),
      $averagesTable = $('#averages');

  /*
   * ---- requestData ----
   *
   * TODO: will have to refactor to work w/ RHL
   *
   * TODO: DESCRIPTION
   *
   * Inputs:
   *  - pageConfig (object) = {
   *      year (string),
   *      batCats (array) = [
   *        {name, isRatio, isNegative}
   *      ],
   *      pitCats (array) = [
   *        {name, isRatio, isNegative}
   *      ]
   *    }
   *  - params (object) = {
   *      selectedTeams (array of strings),
   *      startWeek (integer),
   *      endWeek (integer)
   *    }
   *
   * Output: none
  */
  var requestData = function(config, params) {
    var loadMsgDelay;

    // Remove any existing error msg
    $('.error').remove();

    $.ajax('server.php', {
      type: 'POST',
      data: {
        'year': config.year,
        'batCats': config.batCats,
        'pitCats': config.pitCats,
        'teams': params.selectedTeams,
        'startWeek': params.startWeek,
        'endWeek': params.endWeek
      },
      dataType: 'json',
      success: function(response) {

        $standingsTable.html(buildStandingsMarkup(response));
        $averagesTable.html(buildAveragesMarkup(response));
        $container.fadeIn();
      },
      error: function(request, errorType, errorMessage) {
        $container.before($(
          '<div class="error">' +
          'Error: ' + errorType +
          '</div>'
        ));
      },
      timeout: 10000,
      beforeSend: function() {

        // Don't show message until 2 seconds have passed without a response
        loadMsgDelay = setTimeout(function() {
          $container.before($('<div class="loading">Please wait...</div>'));
        }, 2000);
      },
      complete: function() {
        clearTimeout(loadMsgDelay);
        $('.loading').remove();
      }
    });
  };

  /*
   * ---- buildStandingsMarkup ----
   *
   * Build markup for standings table from server response.
   *
   * Inputs:
   *  - data (object): Server response
   *
   * Output: (string): Markup to be inserted inside the table
   */
  var buildStandingsMarkup = function(data) {
    var headerMarkup,
        rowMarkup = []; // array of objects: {rank, html}

    // Build markup for table header
    headerMarkup = '<tr>' +
      '<th colspan="3" rowspan="2">Weeks ' + params.startWeek + '&ndash;' + params.endWeek + '</th>' +
      '<th colspan="' + pageConfig.batCats.length + '">% chance of winning category</th>' +
      '<th rowspan="2">Batting*</th>' +
      '<th colspan="' + pageConfig.pitCats.length + '">% chance of winning category</th>' +
      '<th rowspan="2">Pitching*</th>' +
      '<th rowspan="2">Total*<br>(# cats)</th>' +
      '<th rowspan="2">Average**<br>(win%)</th>' +
      '<th rowspan="2">H2H%</th>' +
      '<th rowspan="2">Roto &dash;<br>H2H</th>' +
    '</tr>' +
    '<tr>';
    pageConfig.batCats.forEach(function(category) {
      headerMarkup += '<th>' + category.name + '</th>';
    });
    pageConfig.pitCats.forEach(function(category) {
      headerMarkup += '<th>' + category.name + '</th>';
    });
    headerMarkup += '</tr>';

    // Build markup for rows of team stats
    params.selectedTeams.forEach(function(teamName) {
      var teamData = data.teamStats[teamName],
          teamMarkup = {rank: teamData.aggregateStats.rank};

      teamMarkup.html = '<tr>' +
        '<td>' + teamData.aggregateStats.rank + '</td>' +
        '<td class="imgCell"><img src="' + pageConfig.logos[teamName] + '"></td>' +
        '<td>' + teamName + '</td>';

      pageConfig.batCats.forEach(function(category) {
        teamMarkup.html += '<td>' + teamData.categoryStats[category.name].score + '</td>';
      });
      teamMarkup.html += '<td>' + teamData.aggregateStats.batting + '</td>';

      pageConfig.pitCats.forEach(function(category) {
        teamMarkup.html += '<td>' + teamData.categoryStats[category.name].score + '</td>';
      });
      teamMarkup.html += '<td>' + teamData.aggregateStats.pitching + '</td>';

      teamMarkup.html += '<td>' + teamData.aggregateStats.grandTotal + '</td>' +
        '<td>' + teamData.aggregateStats.rotoPct + '</td>' +
        '<td>' + teamData.aggregateStats.h2hPct + '</td>' +
        '<td>' + teamData.aggregateStats.diffInPct + '</td>' +
      '</tr>';
      rowMarkup.push(teamMarkup);
    });

    rowMarkup.sort(function(a, b) {
      return a.rank - b.rank;
    });

    return headerMarkup + rowMarkup.map(function(teamMarkup) { return teamMarkup.html }).join('');
  };

  var buildAveragesMarkup = function(data) {
    var headerMarkup,
        rowMarkup = [], // array of strings
        footerMarkup;

    // Build markup for table header
    headerMarkup = '<tr>' +
      '<th>Averages per Week</th>';
    pageConfig.batCats.forEach(function(category) {
      headerMarkup += '<th>' + category.name + '</th>';
    });
    pageConfig.pitCats.forEach(function(category) {
      headerMarkup += '<th>' + category.name + '</th>';
    });
    headerMarkup += '</tr>';

    // Build markup for rows of team stats
    params.selectedTeams.forEach(function(teamName) {
      var teamData = data.teamStats[teamName],
          teamMarkup;

      teamMarkup = '<tr>' +
        '<td class="imgCell"><img src="' + pageConfig.logos[teamName] + '"></td>' +
        '<td>' + teamName + '</td>';

      pageConfig.batCats.forEach(function(category) {
        var value = teamData.categoryStats[category.name].cumulRatio || teamData.categoryStats[category.name].mean;

        teamMarkup += '<td>' + value + '</td>';
      });

      pageConfig.pitCats.forEach(function(category) {
        var value = teamData.categoryStats[category.name].cumulRatio || teamData.categoryStats[category.name].mean;

        teamMarkup += '<td>' + value + '</td>';
      });

      teamMarkup += '</tr>';
      rowMarkup.push(teamMarkup);
    });

    // Build markup for mean, median, min
    footerMarkup = '<tr>' +
      '<td colspan="2">Max</td>';
    pageConfig.batCats.forEach(function(category) {
      footerMarkup += '<td>' + data.leagueStats[category.name].max + '</td>';
    });
    pageConfig.pitCats.forEach(function(category) {
      footerMarkup += '<td>' + data.leagueStats[category.name].max + '</td>';
    });
    footerMarkup += '</tr>';

    footerMarkup += '<tr>' +
      '<td colspan="2">Median</td>';
    pageConfig.batCats.forEach(function(category) {
      footerMarkup += '<td>' + data.leagueStats[category.name].median + '</td>';
    });
    pageConfig.pitCats.forEach(function(category) {
      footerMarkup += '<td>' + data.leagueStats[category.name].median + '</td>';
    });
    footerMarkup += '</tr>';

    footerMarkup += '<tr>' +
      '<td colspan="2">Min</td>';
    pageConfig.batCats.forEach(function(category) {
      footerMarkup += '<td>' + data.leagueStats[category.name].min + '</td>';
    });
    pageConfig.pitCats.forEach(function(category) {
      footerMarkup += '<td>' + data.leagueStats[category.name].min + '</td>';
    });
    footerMarkup += '</tr>';

    return headerMarkup + rowMarkup.join('') + footerMarkup;
  };

  /*
   * EXECUTION
   */
  $container.hide();
  // $('select').val('default');
  $('form').trigger('reset');
  $('#teams').find('input[type="checkbox"]').prop('checked', true);

  // TODO: what was the purpose of this? Why query when a dropdown is changed?
  // $('select').on('change', function() {
  //   var searchType = $(this).data('criterion'),
  //       string = $(this).val();
  //   if (string != 'default') {
  //     $('form').trigger('reset');
  //     $container.fadeOut(function() {
  //       table.empty();
  //       requestData(searchType, string);
  //     });
  //   }
  // });

  // TODO: rewrite
  $('form').on('submit', function(e) {
    e.preventDefault();
    $(this).find('.error').remove();

    // TODO: scope to doc ready fnc
    var params = {
      startWeek: $(this).find('#week-range').find('#starting').val(),
      endWeek: $(this).find('#week-range').find('#ending').val(),
      selectedTeams: []
    };
    $(this).find('#teams').find('input:checked').each(function() {
      params.selectedTeams.push($(this).attr('id'));
    });

    if (params.selectedTeams.length > 1 && startWeek < endWeek) {
      console.log('params.selectedTeams = ', params.selectedTeams);
      console.log('startWeek = ', startWeek);
      console.log('endWeek = ', endWeek);
      $container.fadeOut(function() {
        $standingsTable.empty();
        $averagesTable.empty();
        requestData(pageConfig, params);
      });
    } else {
      if (params.selectedTeams.length <= 1) {
        console.log('params.selectedTeams = ', params.selectedTeams);
        $(this).append('<div class="error">Must select at least two teams</div>');
      }
      if (startWeek >= endWeek) {
        console.log('startWeek = ', startWeek);
        console.log('endWeek = ', endWeek);
        $(this).append('<div class="error">Ending week must be after starting week</div>');
      }
    }
    // var searchType = $(this).data('criterion'),
    //     string = $(this).find('input[type="search"]').val();
    // if (string.length > 0) {
    //   $('form').not(this).trigger('reset');
    //   $('select').val('default');
    //   $container.fadeOut(function() {
    //     table.empty();
    //     requestData(searchType, string);
    //   });
    // }
  });

});
