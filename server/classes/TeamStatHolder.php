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
 *  - getScores: Retrieve scores for an arbitrary array of category names
 *      Inputs: $categories (array)
 *      Output: $scores (associative array): [ CATEGORY_1 => score, CATEGORY_2 => score, ... ]
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
