<?php

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
