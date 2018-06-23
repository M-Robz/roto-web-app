<?php

/*
 |=====================|
 |      FUNCTIONS      |
 |=====================|
*/

/*
 * ---- cdf ----
 *
 * Use the cumulative distribution function to determine the p-value for a given z-score.
 *
 * Inputs:
 *  - $z (float): z-score
 *
 * Output (float): p-value
 */
function cdf($z) {
  $value = $z;
  $sum = $z;
  for ($i=1; $i<=100; $i++) {
    $value *= ($z*$z / (2*$i + 1));
    $sum += $value;
  }
  return 0.5 + ($sum / sqrt(2*M_PI)) * exp(-($x*$x) / 2);
}

/*
 * ---- clean ----
 *
 * Sanitize form input by trimming, stripping slashes, and encoding html special chars.
 *
 * Inputs:
 *  - $data (string): the string to sanitize
 *
 * Output (string): the sanitized string
 */
function clean($data) {
  $data = trim($data);
  $data = stripslashes($data);
  $data = htmlspecialchars($data);
  return $data;
}

/*
 * ---- mean ----
 *
 * Calculate the mean for a set of numbers.
 *
 * Inputs:
 *  - $data (array of floats): the set of numbers
 *
 * Output (float): the mean value
 */
function mean($data) {
  $count = count($data);
  if ($count > 0) {
    return array_sum($data)/$count;
  } else {
    return 'error:div/0';
  }
}

/*
 * ---- Stat calculations ----
 */
function obp($h, $bb, $pa) {
  // TODO: display as .000 instead of 0.000 by converting to string
  // TODO: OBP will never be fully accurate, not just for recent period but also entire season, since I don't have SF data
  return round(($h + $bb) / $pa, 3);
}
function era($er, $ip) {
  return round($er / $ip * 9, 2);
}
function whip($wh, $ip) {
  return round($wh / $ip, 2);
}


/*
 |==========================|
 |      DATA STRUCTURE      |
 |==========================|

  $allTeamStats [         assoc arr (keys are team names)
    TEAM_1 => {           obj
      categoryStats: [    assoc arr (keys are cat names)
        CATEGORY_1 => [   assoc arr (keys are stat names)
          mean            float
          sd              float
          score           int
      aggregateStats: [   assoc arr (keys are stat names)
        batting           float
        pitching          float
        grandTotal        float
        (change?)
        rotoPct           int
        h2hPct            int
        diffInPct         int
*/


/*
 |===================|
 |      CLASSES      |
 |===================|
*/

/*
 *
 * ---- TeamStatHolder ----
 *
 * DESCRIPTION
 *
 * Properties:
 *  - categoryStats
 *  - aggregateStats
 *
 * Methods:
 *  - getScores: Retrieve scores for an arbitrary array of category names
 *      Inputs: $categories (array)
 *      Output: $scores (associative array): [ cat1 => score, cat2 => score, ... ]
 */
class TeamStatHolder { // capitalize by convention
  public $categoryStats = [];
  public $aggregateStats = [];

  public function __construct($categoryStats, $aggregateStats) {
    $this->categoryStats = $categoryStats;
    $this->aggregateStats = $aggregateStats;
  }

  public function getScores($categories) {
    $scores = []; // assoc array
    foreach ($categories as $category) {
      $scores[$category] = $this->categoryStats[$category]['score'];
    }
    return $scores;
  }
}


/*
 |=====================|
 |      EXECUTION      |
 |=====================|
*/

// DB config
$db = 'tbpgcpqd_alooo';
$user = 'tbpgcpqd_guest';
$pw = 'zxcvb';

// Read request (make JSON so array can be read)
$dbTable = 'roto_' . strval($_POST['year']); // int -> str (won't need to convert if year is str in JSON)
$teams = $_POST['teams']; // array
$startWeek = $_POST['startWeek']; // int
$endWeek = $_POST['endWeek']; // int
$batCats = $_POST['batCats']; // arr
$pitCats = $_POST['pitCats']; // arr
$allCats = array_merge($batCats, $pitCats); // arr ['R','HR','RBI','AVG','OBP','NSB','W','SV','K','HLD','ERA','WHIP'];
$numBatCats = count($batCats);
$numPitCats = count($pitCats);
$numAllCats = $numBatCats + $numPitCats;

// Connect to database
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

// Calculate mean & sd for each team
$allTeamStats = [];
foreach ($teams as $team) {

  // Build and execute query
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
    foreach ($allCats as $category) {
      $totals = []; // totals for each wk (non-assoc arr)
      while ($row = $result->fetch_row()) {
        array_push($totals, $row[$category]);
      }
      $mean = mean($totals);
      $sd = stats_standard_deviation($totals);
      $allTeamStats[$team]->categoryStats[$category] = array('mean' => $mean, 'sd' => $sd);
    }

    // Compute team win%
    $gamesWon = 0;
    $gamesPlayed = 0;
    while ($row = $result->fetch_row()) {
      $gamesWon += $row['W'] + $row['T']/2;
      $gamesPlayed += $row['W'] + $row['L'] + $row['T'];
    }
    $allTeamStats[$team]->aggregateStats['h2hPct'] = round($gamesWon / $gamesPlayed * 100);
  }
}

// Calculate table data for each team
foreach ($teams as $thisTeam) {

  // Calculate category scores
  foreach ($allCats as $category) {
    $ownStats = $allTeamStats[$thisTeam]->categoryStats[$category];
    $probabilities = [];
    foreach ($teams as $opponent) {
      if ($opponent !== $thisTeam) {
        $oppStats = $allTeamStats[$opponent]->categoryStats[$category];
        $z = ($oppStats['mean'] - $ownStats['mean']) / (pow($oppStats['sd'], 2) + pow($ownStats['sd'], 2));
        array_push($probabilities, 1 - cdf($z));
      }
    }
    $allTeamStats[$thisTeam]->categoryStats[$category]['score'] = round(mean($probabilities) * 100);
  }

  // Compute totals
    // Note: can't use var for $allTeamStats[$thisTeam] bc it would be a copy, not a reference
  $batTotal = round(array_sum($allTeamStats[$thisTeam]->getScores($batCats)) / 100, 2);
  $pitTotal = round(array_sum($allTeamStats[$thisTeam]->getScores($pitCats)) / 100, 2);
  $allTeamStats[$thisTeam]->aggregateStats['batting'] = $batTotal;
  $allTeamStats[$thisTeam]->aggregateStats['pitching'] = $pitTotal;
  $allTeamStats[$thisTeam]->aggregateStats['grandTotal'] = $batTotal + $pitTotal;
  $allTeamStats[$thisTeam]->aggregateStats['rotoPct'] = round(($batTotal + $pitTotal) / $numAllCats * 100); // precision lost here bc bat/pit totals were rounded; does it matter?
  $allTeamStats[$thisTeam]->aggregateStats['diffInPct'] = $allTeamStats[$thisTeam]->aggregateStats['rotoPct'] - $allTeamStats[$thisTeam]->aggregateStats['h2hPct'];
}

// Assemble CSV table
  // Note: line breaks in CSV are CRLF, which is a carriage return (\r in PHP) followed by a line feed (\n in PHP)
  // In text files, Windows uses CRLF, while Macs use CR only
  // https://tools.ietf.org/html/rfc4180
  // join() is alias of implode()
$table = 'Team,' .
         join(',', $batCats) . ',Batting,' .
         join(',', $pitCats) . ',Pitching,' .
         'Total,Average,H2H%,Roto–H2H\r\n';
foreach ($teams as $team) {
  $teamAggStats = $allTeamStats[$team]->aggregateStats;
  $table .= $team . ',' .
            join(',', $allTeamStats[$team]->getScores($batCats)) . ',' .
            $teamAggStats['batting'] . ',' .
            join(',', $allTeamStats[$team]->getScores($pitCats)) . ',' .
            $teamAggStats['pitching'] . ',' .
            $teamAggStats['grandTotal'] . ',' .
            $teamAggStats['rotoPct'] . ',' .
            $teamAggStats['h2hPct'] . ',' .
            $teamAggStats['diffInPct'] . '\r\n';
}

// Respond with CSV table
echo $table;
