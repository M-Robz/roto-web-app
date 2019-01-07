<?php

/*
 * ---- Stat calculations ----
 */

function obp($h, $bb, $pa) {
  // TODO: display as .000 instead of 0.000 by converting to string
  // NOTE: OBP will never be fully accurate, not just for recent period but also entire season, since I don't have SF data
  return round(($h + $bb) / $pa, 3);
}

function era($er, $ip) {
  return round($er / $ip * 9, 2);
}

function whip($wh, $ip) {
  return round($wh / $ip, 2);
}

function gaa($ga, $gp) {
  return round($ga / $gp, 2);
}

function svp($sv, $sa) {
  return round($sv / $sa, 3);
}
