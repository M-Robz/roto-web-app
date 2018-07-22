<?php

/*
 * ---- median ----
 *
 * Calculate the median for a set of numbers.
 *
 * Inputs:
 *  - $data (array of floats): the set of numbers
 *
 * Output (float): the median value
 */
function median($data) {
  $count = count($data);

  sort($data); // lowest to highest

  if ($count % 2 > 0) {
    $i = floor($count / 2);
    return $data[$i];

  } else {
    $mids = array($data[$count / 2], $data[$count / 2 - 1]);
    return array_sum($mids) / 2;
  }
}
