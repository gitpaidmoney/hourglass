import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLog, grid, stats, render } from '../src/hourglass.mjs';

// Mon 2026-01-05 09:00 UTC, Mon 09:30, Tue 02:00, Sat 15:00, Sun 15:00
const at = (iso) => Math.floor(Date.parse(iso) / 1000);
const log = [at('2026-01-05T09:00:00Z'), at('2026-01-05T09:30:00Z'), at('2026-01-06T02:00:00Z'), at('2026-01-10T15:00:00Z'), at('2026-01-11T15:00:00Z')]
  .map((t) => `${t} dev@example.com`).join('\n') + '\nnot a line\n';

test('parses git log lines and skips the rest', () => {
  const c = parseLog(log);
  assert.equal(c.length, 5);
  assert.equal(c[0].email, 'dev@example.com');
});
test('buckets by weekday (Monday first) and hour', () => {
  const g = grid(parseLog(log), { utc: true });
  assert.equal(g[0][9], 2);
  assert.equal(g[1][2], 1);
  assert.equal(g[5][15], 1);
  assert.equal(g[6][15], 1);
});
test('the numbers', () => {
  const c = parseLog(log), s = stats(c, grid(c, { utc: true }), { utc: true });
  assert.deepEqual([s.total, s.busiestDay, s.busiestHour, s.nightOwlPct, s.weekendPct, s.activeDays, s.longestStreak], [5, 'Mon', 9, 20, 40, 4, 2]);
});
test('renders a row per day', () => {
  const lines = render(grid(parseLog(log), { utc: true })).split('\n');
  assert.equal(lines.length, 8);
  assert.match(lines[1], /^Mon /);
});
