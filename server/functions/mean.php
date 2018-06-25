<?php

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
