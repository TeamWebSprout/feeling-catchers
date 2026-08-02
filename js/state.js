/* ============================================================
   Chirp — persistent state, economy, progression
   ============================================================ */
import { LESSONS, ACHIEVEMENTS, lessonIndex, LEVELS } from './data.js';

const KEY = 'chirp.save.v1';
const HEART_REGEN_MS = 10 * 60 * 1000;   // one heart every 10 minutes

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const fresh = () => ({
  v: 1,
  onboarded: false,
  name: 'Explorer',
  avatar: 'fox',
  nativeLang: 'es',
  motivation: 'games',
  startLevel: 'beginner',
  goal: 'normal',
  unlocked: 1,
  hearts: 5, heartsMax: 5, heartsTs: Date.now(),
  stars: 120,
  xp: 0,
  streak: 0, lastDay: null, days: {},
  progress: {},          // lessonId -> { stars, best, done, plays }
  mastery: {},           // word -> { m, n, best, lesson, last }
  achievements: [],
  stats: { spoken: 0, perfects: 0, bossWins: 0, gymReps: 0, correct: 0, attempts: 0, seconds: 0 },
  settings: { sfx: true, tts: true, meter: true, rate: 0.85, strict: 'normal' }
});

let S = load();
const subs = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw);
    const base = fresh();
    return { ...base, ...parsed,
      stats: { ...base.stats, ...(parsed.stats || {}) },
      settings: { ...base.settings, ...(parsed.settings || {}) } };
  } catch (_) { return fresh(); }
}

let saveTimer = null;
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {}
  }, 120);
}

export const state = () => S;
export function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
function notify() { subs.forEach(f => { try { f(S); } catch (_) {} }); }
export function commit() { save(); notify(); }

export function reset() { S = fresh(); commit(); }

export function patch(obj) { Object.assign(S, obj); commit(); }
export function setSetting(k, v) { S.settings[k] = v; commit(); }

/* ---------------- hearts ---------------- */
export function refreshHearts() {
  if (S.hearts >= S.heartsMax) { S.heartsTs = Date.now(); return; }
  const gained = Math.floor((Date.now() - (S.heartsTs || Date.now())) / HEART_REGEN_MS);
  if (gained > 0) {
    S.hearts = Math.min(S.heartsMax, S.hearts + gained);
    S.heartsTs = Date.now();
    save();
  }
}
export function heartsIn() {          // ms until the next heart
  if (S.hearts >= S.heartsMax) return 0;
  return Math.max(0, HEART_REGEN_MS - (Date.now() - (S.heartsTs || Date.now())));
}
export function loseHeart() {
  refreshHearts();
  if (S.unlimitedUntil && Date.now() < S.unlimitedUntil) return S.hearts;
  if (S.hearts > 0) { if (S.hearts === S.heartsMax) S.heartsTs = Date.now(); S.hearts--; }
  commit();
  return S.hearts;
}
export const hasHearts = () => (S.unlimitedUntil && Date.now() < S.unlimitedUntil) || S.hearts > 0;
export const unlimited = () => !!(S.unlimitedUntil && Date.now() < S.unlimitedUntil);

export function buyHearts(n = 5, cost = 300) {
  if (S.stars < cost) return false;
  S.stars -= cost; S.hearts = Math.min(S.heartsMax, S.hearts + n); commit(); return true;
}
export function buyUnlimited(cost = 900) {
  if (S.stars < cost) return false;
  S.stars -= cost; S.unlimitedUntil = Date.now() + 24 * 3600 * 1000; commit(); return true;
}
export function addStars(n) { S.stars = Math.max(0, S.stars + n); commit(); }
export function bumpStat(k, n = 1) { S.stats[k] = (S.stats[k] || 0) + n; save(); }

/* ---------------- xp / level ---------------- */
export const xpForLevel = lv => Math.round(60 * lv * lv + 40 * lv);
export function levelOf(xp = S.xp) { let lv = 1; while (xp >= xpForLevel(lv)) lv++; return lv; }
export function levelProgress() {
  const lv = levelOf();
  const lo = lv === 1 ? 0 : xpForLevel(lv - 1), hi = xpForLevel(lv);
  return { lv, lo, hi, pct: Math.max(0, Math.min(1, (S.xp - lo) / (hi - lo))) };
}
export function addXp(n) {
  const before = levelOf();
  S.xp += n;
  const d = dayKey();
  S.days[d] = (S.days[d] || 0) + n;
  const after = levelOf();
  commit();
  return after > before ? after : 0;
}

/* ---------------- streak ---------------- */
export function touchDay() {
  const today = dayKey();
  if (S.lastDay === today) return false;
  const y = new Date(); y.setDate(y.getDate() - 1);
  S.streak = (S.lastDay === dayKey(y)) ? S.streak + 1 : 1;
  S.lastDay = today;
  commit();
  return true;
}
export function weekDays() {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = dayKey(d);
    out.push({ key: k, letter: 'SMTWTFS'[d.getDay()], num: d.getDate(), xp: S.days[k] || 0, today: i === 0 });
  }
  return out;
}

/* ---------------- lessons ---------------- */
export const isUnlocked = id => lessonIndex(id) < S.unlocked;
export function unlockThrough(n) { S.unlocked = Math.max(S.unlocked, Math.min(LESSONS.length, n)); commit(); }
export function applyStartLevel(levelId) {
  const lv = LEVELS.find(l => l.id === levelId) || LEVELS[0];
  const first = LESSONS.findIndex(l => l.world === lv.world);
  unlockThrough(Math.max(1, first + 1));
}

export function recordLesson(id, { stars, accuracy }) {
  const p = S.progress[id] || { stars: 0, best: 0, done: false, plays: 0 };
  p.plays++;
  p.stars = Math.max(p.stars, stars);
  p.best = Math.max(p.best, Math.round(accuracy));
  p.done = true;
  S.progress[id] = p;
  const idx = lessonIndex(id);
  if (idx + 2 > S.unlocked) S.unlocked = Math.min(LESSONS.length, idx + 2);
  commit();
}
export const lessonStat = id => S.progress[id] || null;
export const worldDone = w => LESSONS.filter(l => l.world === w).every(l => S.progress[l.id] && S.progress[l.id].done);
export const totalStars = () => Object.values(S.progress).reduce((a, p) => a + (p.stars || 0), 0);

/* ---------------- word mastery ---------------- */
/* m: 0..1 exponential moving average of accuracy */
export function recordWord(word, score, lessonId) {
  const w = word.toLowerCase();
  const rec = S.mastery[w] || { m: 0, n: 0, best: 0, lesson: lessonId, last: 0 };
  rec.n++;
  rec.m = rec.n === 1 ? score / 100 : rec.m * 0.6 + (score / 100) * 0.4;
  rec.best = Math.max(rec.best, score);
  rec.last = Date.now();
  rec.lesson = lessonId || rec.lesson;
  S.mastery[w] = rec;
  S.stats.spoken++;
  S.stats.attempts++;
  if (score >= 93) S.stats.perfects++;
  if (score >= 65) S.stats.correct++;
  save();
  return rec;
}
export const masteryOf = w => (S.mastery[String(w).toLowerCase()] || null);
export function dictStats() {
  const now = Date.now(), day = 864e5;
  const all = Object.values(S.mastery);
  return {
    total: all.length,
    month: all.filter(r => now - r.last < 30 * day).length,
    week:  all.filter(r => now - r.last < 7 * day).length,
    today: all.filter(r => now - r.last < day).length
  };
}

/* ---------------- achievements ---------------- */
export function checkAchievements() {
  const helpers = { worldDone };
  const gained = [];
  ACHIEVEMENTS.forEach(a => {
    if (S.achievements.includes(a.id)) return;
    let ok = false;
    try { ok = a.test(S, helpers); } catch (_) {}
    if (ok) { S.achievements.push(a.id); gained.push(a); }
  });
  if (gained.length) commit();
  return gained;
}

/* ---------------- difficulty ---------------- */
/* Pass threshold ramps with world, lesson-in-world, and stage index. */
export function passMark(lesson, stageIdx, stageCount) {
  const base = { easy: 46, normal: 55, strict: 64 }[S.settings.strict] || 55;
  // world step (10) is larger than the total within-world climb (5 × 1.2 = 6),
  // so the bar always steps up when a new world starts
  const worldBump = lesson.world * 10;
  const idxInWorld = LESSONS.filter(l => l.world === lesson.world).findIndex(l => l.id === lesson.id);
  const lessonBump = idxInWorld * 1.2;
  const stageBump = (stageIdx / Math.max(1, stageCount - 1)) * 14;
  return Math.round(Math.min(90, base + worldBump + lessonBump + stageBump));
}

refreshHearts();
