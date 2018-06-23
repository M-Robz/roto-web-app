function dbQuery(requestParams) {
  /*
  requestParams = {year, batCats, pitCats, teams, startWeek, endWeek}
  */

  var loadMsgDelay,
      container = $('#tableContainer'), // <div>
      table = $('#serverResponse'); // <table>

  // Remove any existing error msg
  $('.error').remove();

  $.ajax('server-scripts/roto.php', {
    type: 'POST',
    data: {
      'year': requestParams.year,
      'batCats': requestParams.batCats,
      'pitCats': requestParams.pitCats,
      'teams': requestParams.teams,
      'startWeek': requestParams.startWeek,
      'endWeek': requestParams.endWeek
    },
    dataType: 'text',
    success: function(response) {
      // TODO: write csvToTable()
      table.html(csvToTable(response));
      container.fadeIn();
    },
    error: function(request, errorType, errorMessage) {
      container.before($(
        '<div class="error">' +
        'Error: ' + errorType +
        '</div>'
      ));
    },
    timeout: 10000,
    beforeSend: function() {

      // Don't show message until 2 seconds have passed without a response
      loadMsgDelay = setTimeout(function() {
        container.before($('<div class="loading">Please wait...</div>'));
      }, 2000);
    },
    complete: function() {
      clearTimeout(loadMsgDelay);
      $('.loading').remove();
    }
  });
}

$(document).ready(function() {
  var container = $('#tableContainer'), // <div>
      table = $('#serverResponse'); // <table>

  container.hide();
  $('select').val('default');
  $('form').trigger('reset');

  // TODO: what is the purpose of this? Why query when a dropdown is changed?
  $('select').on('change', function() {
    var searchType = $(this).data('criterion'),
        string = $(this).val();
    if (string != 'default') {
      $('form').trigger('reset');
      container.fadeOut(function() {
        table.empty();
        dbQuery(searchType, string);
      });
    }
  });

  // TODO: rewrite
  $('form').on('submit', function(event) {
    event.preventDefault();
    var searchType = $(this).data('criterion'),
        string = $(this).find('input[type="search"]').val();
    if (string.length > 0) {
      $('form').not(this).trigger('reset');
      $('select').val('default');
      container.fadeOut(function() {
        table.empty();
        dbQuery(searchType, string);
      });
    }
  });

});
