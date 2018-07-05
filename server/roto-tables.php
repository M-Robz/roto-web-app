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
 * ~~~~ Calculate team stats ~~~~
 *
 * Calculate mean, sd, cumulative ratios, and win% for each team
 */
$teamStats = [];
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
    $teamStats[$team] = new TeamStatHolder();

    // Compute team's mean, sd, and cumulRatio for each cat
    foreach ($allCatConfigs as $category) {

      // Calculate mean and sd
      $totals = []; // totals for each wk (non-assoc arr)
      while ($row = $result->fetch_row()) {
        array_push($totals, $row[$category->name]);
      }
      $mean = mean($totals);
      $sd = stats_standard_deviation($totals);

      // Calculate cumulative ratios if applicable
      if ($category->isRatio) {
        switch ($category->name) {
          case 'OBP':
            $h = 0;
            $bb = 0;
            $pa = 0;
            while ($row = $result->fetch_row()) {
              $h += $row['H'];
              $bb += $row['BB'];
              $pa += $row['PA'];
            }
            $cumulRatio = obp($h, $bb, $pa);
            break;
          case 'ERA':
            $er = 0;
            $ip = 0;
            while ($row = $result->fetch_row()) {
              $er += $row['ER'];
              $ip += $row['IP'];
            }
            $cumulRatio = era($er, $ip);
            break;
          case 'WHIP':
            $wh = 0;
            $ip = 0;
            while ($row = $result->fetch_row()) {
              $wh += $row['WH'];
              $ip += $row['IP'];
            }
            $cumulRatio = whip($wh, $ip);
            break;
        }

        // Include cumulRatio
        $teamStats[$team]->categoryStats[$category->name] = array('mean' => $mean, 'sd' => $sd, 'cumulRatio' => $cumulRatio);

      } else {

        // Don't include cumulRatio
        $teamStats[$team]->categoryStats[$category->name] = array('mean' => $mean, 'sd' => $sd);
      }
    }

    // Compute team h2h win%
    $gamesWon = 0;
    $gamesPlayed = 0;
    while ($row = $result->fetch_row()) {
      $gamesWon += $row['W'] + $row['T']/2;
      $gamesPlayed += $row['W'] + $row['L'] + $row['T'];
    }
    $teamStats[$team]->aggregateStats['h2hPct'] = round($gamesWon / $gamesPlayed * 100);
  }
}


/*
 * ~~~~ Calculate team scores and totals ~~~~
 *
 * Calculate category scores, total scores, total %, roto-h2h, and ranks for each team
 */
$grandTotals = []; // grand totals for all teams

foreach ($teams as $thisTeam) {

  // Calculate category scores
  foreach ($allCatConfigs as $category) {
    $ownStats = $teamStats[$thisTeam]->categoryStats[$category->name];
    $probabilities = [];
    foreach ($teams as $opponent) {
      if ($opponent !== $thisTeam) {
        $oppStats = $teamStats[$opponent]->categoryStats[$category->name];
        $z = ($oppStats['mean'] - $ownStats['mean']) / (pow($oppStats['sd'], 2) + pow($ownStats['sd'], 2));

        if ($category->isNegative) { // TODO: need `= true`?
          $p = cdf($z);
        } else {
          $p = 1 - cdf($z);
        }

        array_push($probabilities, $p);
      }
    }
    $teamStats[$thisTeam]->categoryStats[$category->name]['score'] = round(mean($probabilities) * 100, 5); // retain five decimal places of precision
  }

  // Compute totals
    // Note: can't use var for $teamStats[$thisTeam] bc it would be a copy, not a reference
  $batTotal = array_sum($teamStats[$thisTeam]->getScores($batCatNames)) / 100;
  $pitTotal = array_sum($teamStats[$thisTeam]->getScores($pitCatNames)) / 100;
  $teamStats[$thisTeam]->aggregateStats['batting'] = round($batTotal, 2);
  $teamStats[$thisTeam]->aggregateStats['pitching'] = round($pitTotal, 2);
  $teamStats[$thisTeam]->aggregateStats['grandTotal'] = round($batTotal + $pitTotal, 2);
  $teamStats[$thisTeam]->aggregateStats['rotoPct'] = round(($batTotal + $pitTotal) / $numAllCats * 100);
  $teamStats[$thisTeam]->aggregateStats['diffInPct'] = $teamStats[$thisTeam]->aggregateStats['rotoPct'] - $teamStats[$thisTeam]->aggregateStats['h2hPct'];

  // Push current team's grand total to array of all teams' totals
  array_push($grandTotals, $thisTeam => $teamStats[$thisTeam]->aggregateStats['grandTotal']);
}

// Sort highest to lowest while preserving original keys
//   (by contrast, rsort() changes keys to items' indexed positions in the array)
arsort($grandTotals);

// Extract ordered team names
$grandTotals_keys = array_keys($grandTotals);

// Store ranks
for ($i=0, $len=count($grandTotals); $i<$len; $i++) {
  $teamStats[$grandTotals_keys[$i]]->aggregateStats['rank'] = $i + 1;
}


/*
 * ~~~~ Calculate league stats ~~~~
 */
$leagueStats = [];
// TODO

/*
 * ~~~~ Respond with JSON ~~~~
 */
echo json_encode(array('teamStats' => $teamStats, 'leagueStats' => $leagueStats));
