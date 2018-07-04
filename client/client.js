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
        // response (object) {
        //   standingsMarkup (string),
        //   averagesMarkup (string)
        // }

        $standingsTable.html(response.standingsMarkup);
        $averagesTable.html(response.averagesMarkup);
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

  var buildMarkup = function(data) {
    var markup = '';

    // <tr>
    //   <th colspan="3" rowspan="2">Through Week 11<br>(8 weeks)</th>
    //   <th colspan="' + pageConfig.batCats.length + '">% chance of winning category</th>
    //   <th rowspan="2">Batting*</th>
    //   <th colspan="' + pageConfig.pitCats.length + '">% chance of winning category</th>
    //   <th rowspan="2">Pitching*</th>
    //   <th rowspan="2">Total*<br>(# cats)</th>
    //   <th rowspan="2">Average**<br>(win%)</th>
    //   <th rowspan="2">H2H%</th>
    //   <th rowspan="2">Roto &dash;<br>H2H</th>
    // </tr>
    //
    // <tr>
    batCats.forEach(function(category) {
      markup += '<th>' + category.name + '</th>';
    });
    pitCats.forEach(function(category) {
      markup += '<th>' + category.name + '</th>';
    });
    // </tr>
    // <tr>
    //   <td>1</td>
    //   <td class="imgCell"><img src="images/lnt_v2_100.png"></td>
    //   <td>Lightning N Thunder <span class="green">&#8593;</span></td>
    //   <td>71</td>
    //   <td>62</td>
    //   <td>63</td>
    //   <td>56</td>
    //   <td>46</td>
    //   <td>2.98</td>
    //   <td>66</td>
    //   <td>68</td>
    //   <td>44</td>
    //   <td>58</td>
    //   <td>58</td>
    //   <td>2.93</td>
    //   <td>5.91</td>
    //   <td>59</td>
    //   <td>56</td>
    //   <td>+3</td>
    // </tr>
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
