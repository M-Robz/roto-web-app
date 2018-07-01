<?php

/*
 * ---- TeamStatHolder ----
 *
 * TODO: DESCRIPTION
 *
 * Properties:
 *  - categoryStats
 *  - aggregateStats
 *
 * Methods:
 *  - getScores
 */
class TeamStatHolder { // capitalize by convention
  public $categoryStats = [];
  public $aggregateStats = [];

  public function __construct($categoryStats, $aggregateStats) {
    $this->categoryStats = $categoryStats;
    $this->aggregateStats = $aggregateStats;
  }

  /*
   * ---- getScores ----
   *
   * Retrieve scores for an arbitrary array of category names.
   *
   * Inputs:
   *  - $categories (array of strings): category names
   *  - $precision (integer) (optional): round scores to the specified number of decimal places before returning
   *
   * Output: $scores (associative array): [ CATEGORY_1 => score, CATEGORY_2 => score, ... ]
   */
  public function getScores($categories, $precision = NULL) {
    $scores = []; // assoc array

    // Look up each category score and store in array
    foreach ($categories as $category) {
      $scores[$category] = $this->categoryStats[$category]['score'];
    }

    // If $precision argument was provided, round scores to that number of decimal places
    if (is_set($precision)) { // TRUE if not NULL
      foreach ($scores as &$score) { // `&` allows modification of array values
        $score = round($score, $precision);
      }
      unset($score); // not needed here since the var is not used again within the function's scope, but good practice
    }

    return $scores;
  }
}
