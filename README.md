# hourglass

**When do you actually ship?** A heatmap of your commits by weekday and hour, straight from `git log`.
No account, no upload, no dependencies: it reads the repo on your disk.

```
$ npx hourglass-cli

358 commits by you@example.com, local time

     0  3  6  9  12 15 18 21
Mon  ···············░·░░·····     7
Tue  ······░░░▓██░░·░░░·░····    81
Wed  ······░··░▒▒░▒░▒▒░▒░░░▒░    76
Thu  ····░·░░▓▒▒▒▒░▒█▒▓░░░·░·   106
Fri  ····░▒░░░░░▒░▒▒░···░░···    55
Sat  ······░░▒▒▒░░·░·········    32
Sun  ········░···············     1

busiest       Thursdays around 11:00
night owl     1 % between midnight and 5
weekends      9 %
streak        5 days in a row (15 active days)
```

## Use

```
npx hourglass-cli [path]        # your commits in the repo at path (default: here)
  --all                         everyone's commits, not just yours
  --author <email>              one author's commits
  --since "3 months ago"        only recent commits (anything git understands)
  --utc                         hours in UTC instead of your local time
  --json                        the numbers as JSON, for your own dashboards
```

"You" is whatever `git config user.email` says. Merges are left out.

## Why

Most of us guess when we do our best work and guess wrong. The log already knows.

## Develop

```
node --test test/        # Node 18 or newer, nothing to install
```

MIT licensed.
