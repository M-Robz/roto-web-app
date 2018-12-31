// Globals from HTML: pageConfig

$(document).ready(function() {
  var $container = $('#table-container'),
      $standingsTable = $('#standings'),
      $averagesTable = $('#averages');

  /*
   * ---- requestData ----
   *
   * TODO: DESCRIPTION
   *
   * Inputs:
   *  - pageConfig (object): See readme for description
   *
   * TODO: Delete this
   *  - pageConfig (object) = {
   *      logos (object): {
   *        team1 (string),
   *        team2 (string)
   *      },
   *      year (string),
   *      categoryGroups (object): {
   *        group1 (array): [
   *          {name, isRatio, isNegative}
   *        ],
   *        group2 (array): [
   *          {name, isRatio, isNegative}
   *        ]
   *      }
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
        config: config,
        params: params
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
    var categoryGroups = Object.keys(pageConfig.categoryGroups), // string: names of category groups
        headerMarkup,
        rowMarkup = []; // array of objects: {rank, html}

    //--- Begin markup for table header
    headerMarkup = '<tr>' +
      '<th colspan="3" rowspan="2">Weeks ' + params.startWeek + '&ndash;' + params.endWeek + '</th>';

    categoryGroups.forEach(function (groupName) {
      headerMarkup += '<th colspan="' + pageConfig.categoryGroups[groupName].length + '">% chance of winning category</th>' +
        '<th rowspan="2">' + groupName + '*</th>';
    });

    headerMarkup += '<th rowspan="2">Total*<br>(# cats)</th>' +
      '<th rowspan="2">Average**<br>(win%)</th>' +
      '<th rowspan="2">H2H%</th>' +
      '<th rowspan="2">Roto &dash;<br>H2H</th>' +
    '</tr>' +
    '<tr>';

    categoryGroups.forEach(function (groupName) {
      // Normal way of doing it
      // pageConfig.categoryGroups[groupName].forEach(function (category) {
      //   headerMarkup += '<th>' + category.name + '</th>';
      // });

      // Trying a new approach like use of map() below; this way headerMarkup is only concatenated once
      headerMarkup += pageConfig.categoryGroups[groupName].map(function (category) {
        return '<th>' + category.name + '</th>';
      }).join('');
    });

    headerMarkup += '</tr>';
    //--- End markup for table header

    //--- Begin markup for rows of team stats
    params.selectedTeams.forEach(function(teamName) {
      var teamData = data.teamStats[teamName],
          teamMarkup = {rank: teamData.aggregateStats.rank};

      teamMarkup.html = '<tr>' +
        '<td>' + teamData.aggregateStats.rank + '</td>' +
        '<td class="imgCell"><img src="' + pageConfig.logos[teamName] + '"></td>' +
        '<td>' + teamName + '</td>';

      categoryGroups.forEach(function (groupName) {
        teamMarkup.html += pageConfig.categoryGroups[groupName].map(function (category) {
          return '<td>' + teamData.categoryStats[category.name].score + '</td>';
        }).join('') +
          '<td>' + teamData.aggregateStats[groupName] + '</td>';
      });

      teamMarkup.html += '<td>' + teamData.aggregateStats.grandTotal + '</td>' +
        '<td>' + teamData.aggregateStats.rotoPct + '</td>' +
        '<td>' + teamData.aggregateStats.h2hPct + '</td>' +
        '<td>' + teamData.aggregateStats.diffInPct + '</td>' +
      '</tr>';
      rowMarkup.push(teamMarkup);
    });
    //--- End markup for rows of team stats

    // Sort row markup by team rank
    rowMarkup.sort(function(a, b) {
      return a.rank - b.rank;
    });

    return headerMarkup + rowMarkup.map(function(teamMarkup) { return teamMarkup.html }).join('');
  };

  /*
   * ---- buildAveragesMarkup ----
   *
   * Build markup for averages table from server response.
   *
   * Inputs:
   *  - data (object): Server response
   *
   * Output: (string): Markup to be inserted inside the table
   */
  var buildAveragesMarkup = function(data) {
    var categoryGroups = Object.keys(pageConfig.categoryGroups), // string: names of category groups
        allCats = [], // array of objects
        headerMarkup,
        rowMarkup = [], // array of strings
        footerMarkup;

    // Merge categories from all category groups into a single array
    categoryGroups.forEach(function (groupName) {
      allCats.concat(pageConfig.categoryGroups[groupName]);
    });

    // --- Begin markup for table header
    headerMarkup = '<tr>' +
      '<th>Averages per Week</th>';
    allCats.forEach(function(category) {
      headerMarkup += '<th>' + category.name + '</th>';
    });
    headerMarkup += '</tr>';
    // --- End markup for table header

    // --- Begin markup for rows of team stats
    params.selectedTeams.forEach(function(teamName) {
      var teamData = data.teamStats[teamName],
          teamMarkup;

      teamMarkup = '<tr>' +
        '<td class="imgCell"><img src="' + pageConfig.logos[teamName] + '"></td>' +
        '<td>' + teamName + '</td>';

      allCats.forEach(function(category) {
        var value = teamData.categoryStats[category.name].cumulRatio || teamData.categoryStats[category.name].mean;

        teamMarkup += '<td>' + value + '</td>';
      });

      teamMarkup += '</tr>';
      rowMarkup.push(teamMarkup);
    });
    // --- End markup for rows of team stats

    // --- Begin markup for mean, median, min
    footerMarkup = '<tr>' +
      '<td colspan="2">Max</td>';
    allCats.forEach(function(category) {
      footerMarkup += '<td>' + data.leagueStats[category.name].max + '</td>';
    });
    footerMarkup += '</tr>';

    footerMarkup += '<tr>' +
      '<td colspan="2">Median</td>';
    allCats.forEach(function(category) {
      footerMarkup += '<td>' + data.leagueStats[category.name].median + '</td>';
    });
    footerMarkup += '</tr>';

    footerMarkup += '<tr>' +
      '<td colspan="2">Min</td>';
    allCats.forEach(function(category) {
      footerMarkup += '<td>' + data.leagueStats[category.name].min + '</td>';
    });
    footerMarkup += '</tr>';
    // --- End markup for mean, median, min

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
