$(document).ready(function() {
  var $container = $('#table-container'),
      $standingsTable = $('#standings'),
      $averagesTable = $('#averages');

  /*
   * requestData
   *
   * Inputs:
   *  - params (object) = {
   *      year (string),
   *      batCats,
   *      pitCats,
   *      teams (array of strings),
   *      startWeek (integer),
   *      endWeek (integer)
   *    }
   *
   * Output: none
  */
  var requestData = function(params) {
    var loadMsgDelay;

    // Remove any existing error msg
    $('.error').remove();

    $.ajax('server.php', {
      type: 'POST',
      data: {
        // 'year': params.year,
        // 'batCats': params.batCats,
        // 'pitCats': params.pitCats,
        'teams': params.teams,
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

  /*
   * EXECUTION
   */
  $container.hide();
  // $('select').val('default');
  $('form').trigger('reset');
  $('#teams').find('input[type="checkbox"]').prop('checked', true);

  // TODO: what is the purpose of this? Why query when a dropdown is changed?
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

    var startWeek = $(this).find('#week-range').find('#starting').val();
    var endWeek = $(this).find('#week-range').find('#ending').val();

    var selectedTeams = []; $(this).find('#teams').find('input:checked').each(function() {
      selectedTeams.push($(this).attr('id'));
    });

    if (selectedTeams.length > 1 && startWeek < endWeek) {
      console.log('selectedTeams = ', selectedTeams);
      console.log('startWeek = ', startWeek);
      console.log('endWeek = ', endWeek);
      $container.fadeOut(function() {
        $standingsTable.empty();
        $averagesTable.empty();
        requestData(selectedTeams, startWeek, endWeek);
      });
    } else {
      if (selectedTeams.length <= 1) {
        console.log('selectedTeams = ', selectedTeams);
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
