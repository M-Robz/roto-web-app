# Data structures

## Request (JSON)

```
{
  year              str
  batCats: [        arr
    {               obj
      name          str
      isRatio       boolean (whether the category is a ratio)
      isNegative    boolean (whether the category is scored negatively, i.e., lower is better)
  pitCats: [
    (same as batCats)
  teams             arr of str (teams to query for)
  startWeek         int (first week of data to query for)
  endWeek           int (last week of data to query for)
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
