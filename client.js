function dbQuery(requestParams) {
  /*
  requestParams = {year, batCats, pitCats, teams, startWeek, endWeek}
  */

  var loadMsgDelay,
      $container = $('#tableContainer'), // TODO: no need to redefine
      $table = $('#serverResponse'); // TODO: no need to redefine

  // Remove any existing error msg
  $('.error').remove();

  $.ajax('server.php', {
    type: 'POST',
    data: {
      // 'year': requestParams.year,
      // 'batCats': requestParams.batCats,
      // 'pitCats': requestParams.pitCats,
      'teams': requestParams.teams,
      'startWeek': requestParams.startWeek,
      'endWeek': requestParams.endWeek
    },
    dataType: 'text',
    success: function(response) {
      $table.html(csvToTable(response));
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
}

// TODO
function csvToTable() {}

$(document).ready(function() {
  var $container = $('#tableContainer'),
      $table = $('#serverResponse');

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
  //       dbQuery(searchType, string);
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
        $table.empty();
        // dbQuery(selectedTeams, startWeek, endWeek);
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
    //     dbQuery(searchType, string);
    //   });
    // }
  });

});
