// hourglass: when do you actually ship? Commits by weekday and hour, from git itself.
// Pure functions here; the command line lives in bin/hourglass.mjs.

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHADES = [' ', '░', '▒', '▓', '█'];

/** Parse `git log --pretty=%at %ae` output into [{ t: ms, email }]. */
export function parseLog(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    const m = line.trim().match(/^(\d+)\s+(\S*)$/);
    if (m) out.push({ t: Number(m[1]) * 1000, email: m[2].toLowerCase() });
  }
  return out;
}

/** A 7 × 24 grid of commit counts (Monday first), in local time or UTC. */
export function grid(commits, { utc = false } = {}) {
  const g = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const c of commits) {
    const d = new Date(c.t);
    const day = ((utc ? d.getUTCDay() : d.getDay()) + 6) % 7;
    const hour = utc ? d.getUTCHours() : d.getHours();
    g[day][hour]++;
  }
  return g;
}

/** The numbers worth knowing: busiest day and hour, night owl and weekend shares, the longest run of days with a commit. */
export function stats(commits, g, { utc = false } = {}) {
  const total = commits.length;
  const byDay = g.map((row) => row.reduce((a, b) => a + b, 0));
  const byHour = Array.from({ length: 24 }, (_, h) => g.reduce((a, row) => a + row[h], 0));
  const top = (arr) => arr.indexOf(Math.max(...arr));
  const night = byHour.slice(0, 5).reduce((a, b) => a + b, 0);
  const weekend = byDay[5] + byDay[6];
  const days = [...new Set(commits.map((c) => {
    const d = new Date(c.t);
    return utc ? Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) : new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }))].sort((a, b) => a - b);
  let streak = days.length ? 1 : 0, run = 1;
  for (let i = 1; i < days.length; i++) {
    run = Math.round((days[i] - days[i - 1]) / 86400000) === 1 ? run + 1 : 1;
    if (run > streak) streak = run;
  }
  return {
    total,
    busiestDay: total ? DAYS[top(byDay)] : null,
    busiestHour: total ? top(byHour) : null,
    nightOwlPct: total ? Math.round((night / total) * 100) : 0,
    weekendPct: total ? Math.round((weekend / total) * 100) : 0,
    activeDays: days.length,
    longestStreak: streak,
  };
}

/** The heatmap as text. `color` adds ANSI shading for terminals. */
export function render(g, { color = false } = {}) {
  const max = Math.max(1, ...g.flat());
  const shade = (n) => {
    if (!n) return color ? '\x1b[90m·\x1b[0m' : '·';
    const i = Math.min(SHADES.length - 1, Math.ceil((n / max) * (SHADES.length - 1)));
    const ch = SHADES[i];
    return color ? `\x1b[38;5;${[0, 22, 28, 34, 46][i]}m${ch}\x1b[0m` : ch;
  };
  const head = '     ' + Array.from({ length: 24 }, (_, h) => (h % 3 === 0 ? String(h).padEnd(3) : '')).join('');
  const rows = g.map((row, d) => `${DAYS[d]}  ${row.map(shade).join('')}  ${String(row.reduce((a, b) => a + b, 0)).padStart(4)}`);
  return [head, ...rows].join('\n');
}
