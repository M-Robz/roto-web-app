<?php

/*
 * ~~~~ Load modules ~~~~
 */

// Functions
require 'cdf.php';
require 'clean.php';
require 'mean.php';
require 'stats.php';

// Classes
require 'TeamStatHolder.php';


/*
 * ~~~~ DB config ~~~~
 */
$db = 'tbpgcpqd_alooo';
$user = 'tbpgcpqd_guest';
$pw = 'zxcvb';


/*
 * ~~~~ Read request (make JSON so PHP can read as assoc array) ~~~~
 */
$dbTable = 'roto_' . strval($_POST['year']); // int -> str (won't need to convert if year is str in JSON)
$teams = $_POST['teams']; // array of str
$startWeek = $_POST['startWeek']; // int
$endWeek = $_POST['endWeek']; // int
$batCatConfigs = $_POST['batCats']; // arr of assoc arrays (I think PHP will treat JS objects as assoc arrays)
$pitCatConfigs = $_POST['pitCats']; // arr of assoc arrays
$allCatConfigs = array_merge($batCatConfigs, $pitCatConfigs); // arr of assoc arrays

// Extract bat and pit category names and store in arrays
$batCatNames = [];
$pitCatNames = [];
foreach ($batCatConfigs as $batCat) {
  array_push($batCatNames, $batCat->name);
}
foreach ($pitCatConfigs as $pitCat) {
  array_push($pitCatNames, $pitCat->name);
}

// Count categories
$numBatCats = count($batCatNames);
$numPitCats = count($pitCatNames);
$numAllCats = $numBatCats + $numPitCats;


/*
 * ~~~~ Connect to database ~~~~
 */
$conn = new mysqli('localhost', $user, $pw, $db);
if ($conn->connect_error) {
  echo 'Error connecting to database';
  exit();
}

// Query for column names
// $colNameQ = "SELECT COLUMN_NAME
//             FROM INFORMATION_SCHEMA.COLUMNS
//             WHERE TABLE_SCHEMA='".$db."'
//             AND TABLE_NAME='".$dbTable."';";
// $colNames = $conn->query($colNameQ);
// $numFields = $colNames->num_rows;


/*
 * ~~~~ Stat calculations ~~~~
 *
 * Calculate mean, sd, cumulative ratios, and win% for each team
 */
$allTeamStats = [];
foreach ($teams as $team) {

  // Build and execute query for current team
  $q =
    "SELECT * FROM ".$dbTable." ".
    "WHERE Team = '".$team."' ".
    "AND Week >= ".$startWeek." ".
    "AND Week <= ".$endWeek.";";
  $result = $conn->query($q);

  // Check whether any rows were selected
  if ($result->num_rows > 0) {

    // Create and assign new object to hold stats for the current team
    $allTeamStats[$team] = new TeamStatHolder();

    // Compute team's mean and sd for each cat
    foreach ($allCatConfigs as $category) {
      $totals = []; // totals for each wk (non-assoc arr)
      while ($row = $result->fetch_row()) {
        array_push($totals, $row[$category->name]);
      }
      $mean = mean($totals);
      $sd = stats_standard_deviation($totals);
      $allTeamStats[$team]->categoryStats[$category->name] = array('mean' => $mean, 'sd' => $sd);
    }

    // TODO: Compute team's cumulative ratios
    // Access isRatio prop of cat objects and add cumulRatio to categoryStats when necessary

    // Compute team h2h win%
    $gamesWon = 0;
    $gamesPlayed = 0;
    while ($row = $result->fetch_row()) {
      $gamesWon += $row['W'] + $row['T']/2;
      $gamesPlayed += $row['W'] + $row['L'] + $row['T'];
    }
    $allTeamStats[$team]->aggregateStats['h2hPct'] = round($gamesWon / $gamesPlayed * 100);
  }
}


/*
 * ~~~~ Calculate scores and totals ~~~~
 *
 * Calculate category scores, total scores, total %, and roto-h2h for each team
 */
foreach ($teams as $thisTeam) {

  // Calculate category scores
  foreach ($allCatConfigs as $category) {
    $ownStats = $allTeamStats[$thisTeam]->categoryStats[$category->name];
    $probabilities = [];
    foreach ($teams as $opponent) {
      if ($opponent !== $thisTeam) {
        $oppStats = $allTeamStats[$opponent]->categoryStats[$category->name];
        $z = ($oppStats['mean'] - $ownStats['mean']) / (pow($oppStats['sd'], 2) + pow($ownStats['sd'], 2));

        if ($category->isNegative) { // TODO: need `= true`?
          $p = cdf($z);
        } else {
          $p = 1 - cdf($z);
        }

        array_push($probabilities, $p);
      }
    }
    $allTeamStats[$thisTeam]->categoryStats[$category->name]['score'] = round(mean($probabilities) * 100);
  }

  // Compute totals
    // Note: can't use var for $allTeamStats[$thisTeam] bc it would be a copy, not a reference
  $batTotal = round(array_sum($allTeamStats[$thisTeam]->getScores($batCatNames)) / 100, 2);
  $pitTotal = round(array_sum($allTeamStats[$thisTeam]->getScores($pitCatNames)) / 100, 2);
  $allTeamStats[$thisTeam]->aggregateStats['batting'] = $batTotal;
  $allTeamStats[$thisTeam]->aggregateStats['pitching'] = $pitTotal;
  $allTeamStats[$thisTeam]->aggregateStats['grandTotal'] = $batTotal + $pitTotal;
  $allTeamStats[$thisTeam]->aggregateStats['rotoPct'] = round(($batTotal + $pitTotal) / $numAllCats * 100); // precision lost here bc bat/pit totals were rounded; does it matter?
  $allTeamStats[$thisTeam]->aggregateStats['diffInPct'] = $allTeamStats[$thisTeam]->aggregateStats['rotoPct'] - $allTeamStats[$thisTeam]->aggregateStats['h2hPct'];
}


/*
 * ~~~~ Assemble CSV table ~~~~
 */

// TODO: build html tables instead

// Note: line breaks in CSV are CRLF, which is a carriage return (\r in PHP) followed by a line feed (\n in PHP)
// In text files, Windows uses CRLF, while Macs use CR only
// https://tools.ietf.org/html/rfc4180
// join() is alias of implode()
$table = 'Team,' .
         join(',', $batCatNames) . ',Batting,' .
         join(',', $pitCatNames) . ',Pitching,' .
         'Total,Average,H2H%,Roto–H2H\r\n';
foreach ($teams as $team) {
  $teamAggStats = $allTeamStats[$team]->aggregateStats;
  $table .= $team . ',' .
            join(',', $allTeamStats[$team]->getScores($batCatNames)) . ',' .
            $teamAggStats['batting'] . ',' .
            join(',', $allTeamStats[$team]->getScores($pitCatNames)) . ',' .
            $teamAggStats['pitching'] . ',' .
            $teamAggStats['grandTotal'] . ',' .
            $teamAggStats['rotoPct'] . ',' .
            $teamAggStats['h2hPct'] . ',' .
            $teamAggStats['diffInPct'] . '\r\n';
}


/*
 * ~~~~ Respond with CSV table ~~~~
 */
echo $table;
