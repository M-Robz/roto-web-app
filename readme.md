# Data structures

## Request (JSON)

```
{
  pageConfig: {         obj
    league,             str
    logos: {            obj
      team1,            str
      team2
    },
    year,               str
    categoryGroups: {   obj
      group1: [         arr of obj
        {               
          name          str
          isRatio       boolean (whether the category is a ratio)
          isNegative    boolean (whether the category is scored negatively, i.e., lower is better)
        },
        {}
      ],
      group2
    }
  },
  params: {           obj
    selectedTeams,    arr of str (teams to query for)
    startWeek,        int (first week of data to query for)
    endWeek           int (last week of data to query for)
  }
}
```

## Server-side data containers

```
$teamStats = [       assoc arr (keys are team names)
  TEAM_1 => {           obj (instance of TeamStatHolder)
    categoryStats: [    assoc arr (keys are cat names)
      CATEGORY_1 => [   assoc arr (keys are stat names)
        mean            float (note that for ratios, this is the mean of weekly ratios)
        cumulRatio      float (only used for ratios; this is the ratio calculated from cumulative stats)
        sd              float (note that for ratios, this is the std dev of weekly ratios)
        score           int
    aggregateStats: [   assoc arr (keys are stat names)
      rank              int
      batting           float
      pitching          float
      grandTotal        float
      (change?)
      rotoPct           int
      h2hPct            int
      diffInPct         int

$leagueStats = [        assoc arr (keys are cat names)
  CATEGORY_1 => [       assoc arr (keys are summary stat names)
    max                 float
    median              float
    min                 float
```

## PHP dev notes

### Assoc arrays

  - "->" for objects, "=>" for assoc arrays ("maps")
  - use fat arrow when creating array:
    `array('key1' => value1, ...)` or
    `['key1' => value1, ...]`
  - items in assoc arrays must be referenced with $array[$key], and not with fat arrow

### foreach loops
  - foreach can loop over an assoc array with or without assigning a var to the current key:
    `foreach ($arr as $key => $value)` or
    `foreach ($arr as $value)`
  - use ampersand to directly modify an array element w/i the loop (via reference) instead of a copy var:
    `foreach ($arr as &$value) {
      $value = $value * 2;
    }`
    - it's best practice to destroy the reference immediately following the loop with `unset($value)`

### Pushing to arrays

  - array_push does same thing as `$array[] = `; latter is preferred when only adding one element
  - can also use `+=`
  - for assoc arrays, do `$data += [ "two" => 2 ];`, or `$data += [ "two" => 2, "three" => 3 ];` to add multiple items at once
