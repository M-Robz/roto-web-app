<?php

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
