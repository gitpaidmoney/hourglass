#!/usr/bin/env node
// hourglass [path] [--all] [--author <email>] [--since <date>] [--utc] [--json]
import { execFileSync } from 'node:child_process';
import { parseLog, grid, stats, render, DAYS, DAY_NAMES } from '../src/hourglass.mjs';

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const value = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
if (flag('-h') || flag('--help')) {
  console.log(`hourglass: when do you actually ship?

  hourglass [path]            your commits in the repo at path (default: here)
    --all                     everyone's commits, not just yours
    --author <email>          one author's commits
    --since <date>            only commits after this date (anything git understands: "3 months ago")
    --utc                     hours in UTC instead of your local time
    --json                    the numbers as JSON`);
  process.exit(0);
}
const dir = args.find((a, i) => !a.startsWith('--') && !['--author', '--since'].includes(args[i - 1])) || '.';
const git = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }).trim();
let log;
try { log = git('log', '--no-merges', '--pretty=%at %ae', ...(value('--since') ? [`--since=${value('--since')}`] : [])); }
catch { console.error(`hourglass: ${dir} is not a git repository`); process.exit(1); }

let who = value('--author');
if (!who && !flag('--all')) { try { who = git('config', 'user.email'); } catch { who = ''; } }
const commits = parseLog(log).filter((c) => !who || c.email === who.toLowerCase());
const utc = flag('--utc'), g = grid(commits, { utc }), s = stats(commits, g, { utc });

if (flag('--json')) { console.log(JSON.stringify({ who: who || 'everyone', ...s, grid: g }, null, 2)); process.exit(0); }
if (!commits.length) { console.log(`no commits${who ? ` by ${who}` : ''} here yet. (--all shows everyone's)`); process.exit(0); }
const color = process.stdout.isTTY && !process.env.NO_COLOR;
console.log(`\n${commits.length} commits${who ? ` by ${who}` : ''}, ${utc ? 'UTC' : 'local time'}\n`);
console.log(render(g, { color }));
console.log(`
busiest       ${DAY_NAMES[DAYS.indexOf(s.busiestDay)]}s around ${String(s.busiestHour).padStart(2, '0')}:00
night owl     ${s.nightOwlPct} % between midnight and 5
weekends      ${s.weekendPct} %
streak        ${s.longestStreak} day${s.longestStreak === 1 ? '' : 's'} in a row (${s.activeDays} active days)
`);
