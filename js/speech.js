/* ============================================================
   Chirp — speech recognition + pronunciation scoring engine

   Scoring is a *proxy* for pronunciation quality, built from what a
   browser can actually give us:
     1. what the recogniser thought it heard (n-best list)
     2. how far down the n-best list the target appeared
     3. the recogniser's own confidence
     4. phonetic distance between target and transcript
   It is not phoneme-level assessment (that needs a server-side model),
   but it reliably separates "said it right", "close", and "not that word".
   ============================================================ */

import { createMeter } from './audio.js';

/* ---------------- environment ---------------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
export const hasASR = !!SR;
export const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isSecure = window.isSecureContext ||
  ['localhost', '127.0.0.1'].includes(location.hostname) || location.protocol === 'file:';

/* ---------------- text normalisation ---------------- */
const NUMS = { '0':'zero','1':'one','2':'two','3':'three','4':'four','5':'five','6':'six','7':'seven',
  '8':'eight','9':'nine','10':'ten','11':'eleven','12':'twelve','20':'twenty','100':'hundred' };

export function normalise(s = '') {
  return String(s)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(t => NUMS[t] || t)
    .filter(Boolean)
    .join(' ')
    .trim();
}
export const words = s => normalise(s).split(' ').filter(Boolean);

/* ---------------- Metaphone (Lawrence Philips, condensed) ---------------- */
const VOW = 'AEIOU';
const isV = c => VOW.includes(c);

export function metaphone(word) {
  let w = String(word).toUpperCase().replace(/[^A-Z]/g, '');
  if (!w) return '';
  // strip silent leading pairs
  if (/^(AE|GN|KN|PN|WR)/.test(w)) w = w.slice(1);
  else if (w[0] === 'X') w = 'S' + w.slice(1);
  else if (/^WH/.test(w)) w = 'W' + w.slice(2);

  let out = '';
  for (let i = 0; i < w.length; i++) {
    const c = w[i], p = w[i - 1] || '', n = w[i + 1] || '', n2 = w[i + 2] || '';
    if (c === p && c !== 'C') continue;                    // drop doubles
    switch (c) {
      case 'A': case 'E': case 'I': case 'O': case 'U':
        if (i === 0) out += c; break;
      case 'B': if (!(i === w.length - 1 && p === 'M')) out += 'B'; break;
      case 'C':
        if (n === 'I' && n2 === 'A') out += 'X';
        else if (n === 'H') { out += (p === 'S') ? 'K' : 'X'; }
        else if ('IEY'.includes(n)) { if (p !== 'S') out += 'S'; }
        else out += 'K';
        break;
      case 'D': out += (n === 'G' && 'EYI'.includes(n2)) ? 'J' : 'T'; break;
      case 'G':
        if (n === 'H') { if (!(i + 1 === w.length - 1 || !isV(n2))) out += 'K'; }
        else if (n === 'N') { /* silent */ }
        else if ('IEY'.includes(n)) out += 'J';
        else out += 'K';
        break;
      case 'H': if (isV(p) && !isV(n)) break; if ('CSPTG'.includes(p)) break; out += 'H'; break;
      case 'K': if (p !== 'C') out += 'K'; break;
      case 'P': out += (n === 'H') ? 'F' : 'P'; break;
      case 'Q': out += 'K'; break;
      case 'S':
        if (n === 'H') out += 'X';
        else if (n === 'I' && (n2 === 'O' || n2 === 'A')) out += 'X';
        else out += 'S';
        break;
      case 'T':
        if (n === 'I' && (n2 === 'O' || n2 === 'A')) out += 'X';
        else if (n === 'H') out += '0';
        else if (!(n === 'C' && n2 === 'H')) out += 'T';
        break;
      case 'V': out += 'F'; break;
      case 'W': case 'Y': if (isV(n)) out += c; break;
      case 'X': out += 'KS'; break;
      case 'Z': out += 'S'; break;
      case 'F': case 'J': case 'L': case 'M': case 'N': case 'R': out += c; break;
    }
  }
  return out;
}

/* ---------------- phoneme-aware edit distance ---------------- */
/* Narrow groups only: sounds a recogniser genuinely confuses, or that differ
   by voicing alone. Pedagogically important contrasts are deliberately NOT
   grouped — '0' (the "th" sound) stands alone so "three"→"tree" is penalised,
   which is exactly the error a speaking app should catch. */
const GROUPS = [ 'BP', 'FV', 'DT', 'SZ', 'KG', 'MN', 'AEIOU' ];
const groupOf = ch => GROUPS.findIndex(g => g.includes(ch));
function subCost(a, b) {
  if (a === b) return 0;
  const ga = groupOf(a), gb = groupOf(b);
  if (ga !== -1 && ga === gb) return 0.5;             // near-miss, e.g. voicing
  return 1;
}
function weightedLev(a, b, cost = subCost, gap = 0.9) {
  const m = a.length, n = b.length;
  if (!m) return n * gap;
  if (!n) return m * gap;
  let prev = Array.from({ length: n + 1 }, (_, j) => j * gap);
  for (let i = 1; i <= m; i++) {
    const cur = [i * gap];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + gap,
        cur[j - 1] + gap,
        prev[j - 1] + cost(a[i - 1], b[j - 1])
      );
    }
    prev = cur;
  }
  return prev[n];
}
const plainLev = (a, b) => weightedLev(a, b, (x, y) => (x === y ? 0 : 1), 1);

/* similarity of two single words, 0..1 */
export function wordSim(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const ortho = 1 - plainLev(a, b) / Math.max(a.length, b.length);
  const ma = metaphone(a), mb = metaphone(b);
  const phon = (!ma || !mb)
    ? ortho
    : 1 - weightedLev(ma, mb) / Math.max(ma.length, mb.length);
  let s = 0.42 * ortho + 0.58 * phon;
  // the first sound is the most audible cue: penalise a wrong onset
  if (ma && mb && ma[0] !== mb[0] && groupOf(ma[0]) !== groupOf(mb[0])) s -= 0.07;
  return Math.max(0, Math.min(1, s));
}

/* align two word arrays; returns per-target-word similarity */
function alignWords(target, heard) {
  const m = target.length, n = heard.length;
  const D = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  const B = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(''));
  for (let i = 1; i <= m; i++) { D[i][0] = i; B[i][0] = 'D'; }
  for (let j = 1; j <= n; j++) { D[0][j] = j; B[0][j] = 'I'; }
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const sub = D[i-1][j-1] + (1 - wordSim(target[i-1], heard[j-1]));
    const del = D[i-1][j] + 1, ins = D[i][j-1] + 1;
    const best = Math.min(sub, del, ins);
    D[i][j] = best;
    B[i][j] = best === sub ? 'M' : (best === del ? 'D' : 'I');
  }
  const res = new Array(m).fill(null);
  let i = m, j = n;
  while (i > 0) {
    const b = B[i][j] || 'D';
    if (b === 'M' && j > 0) { res[i-1] = { heard: heard[j-1], sim: wordSim(target[i-1], heard[j-1]) }; i--; j--; }
    else if (b === 'I' && j > 0) { j--; }
    else { res[i-1] = { heard: null, sim: 0 }; i--; }
  }
  return res.map((r, k) => ({ word: target[k], heard: r ? r.heard : null, sim: r ? r.sim : 0 }));
}

/* ---------------- the scorer ---------------- */
/**
 * @param {string} target        what they were asked to say
 * @param {Array<{transcript:string,confidence:number}>} alts  n-best from ASR
 * @returns {{score:number, verdict:string, heard:string, words:Array, tip:string}}
 */
export function scorePronunciation(target, alts = []) {
  const tw = words(target);
  const tNorm = tw.join(' ');
  if (!alts.length) {
    return { score: 0, verdict: 'nothing', heard: '', tip: 'I did not hear anything. Tap the mic and speak clearly.',
             words: tw.map(w => ({ word: w, sim: 0, heard: null })) };
  }

  let best = null;
  alts.forEach((alt, rank) => {
    const hw = words(alt.transcript);
    if (!hw.length) return;
    const per = alignWords(tw, hw);
    const mean = per.reduce((a, p) => a + p.sim, 0) / Math.max(1, per.length);
    const worstSim = per.reduce((m, p) => Math.min(m, p.sim), 1);
    // one badly-missed word should drag a phrase down, not be averaged away
    const blended = per.length > 1 ? 0.65 * mean + 0.35 * worstSim : mean;

    // penalty for extra words the child said that were not asked for
    const extra = Math.max(0, hw.length - tw.length);
    const extraPen = Math.min(0.18, extra * 0.06);

    // rank penalty: target further down the n-best list ⇒ less crisp delivery
    const exact = hw.join(' ') === tNorm;
    const rankPen = exact ? rank * 0.05 : rank * 0.03;

    const conf = typeof alt.confidence === 'number' && alt.confidence > 0 ? alt.confidence : 0.72;
    let s = (blended - extraPen - rankPen);
    // confidence nudges by at most ±7 points, it is noisy across browsers
    s = s * (0.93 + 0.07 * Math.min(1, conf));
    if (exact && rank === 0) s = Math.max(s, 0.90 + 0.10 * Math.min(1, conf));

    const cand = { raw: Math.max(0, Math.min(1, s)), per, heard: hw.join(' '), exact, rank };
    if (!best || cand.raw > best.raw) best = cand;
  });

  if (!best) {
    return { score: 0, verdict: 'nothing', heard: '', tip: 'I did not hear anything. Try once more.',
             words: tw.map(w => ({ word: w, sim: 0, heard: null })) };
  }

  const score = Math.round(best.raw * 100);
  const worst = [...best.per].sort((a, b) => a.sim - b.sim)[0];
  let verdict = 'off', tip = '';
  if (score >= 93) { verdict = 'perfect'; tip = 'Crystal clear!'; }
  else if (score >= 80) { verdict = 'great'; tip = 'Nice and clear.'; }
  else if (score >= 65) { verdict = 'good'; tip = worst && worst.sim < 0.8 ? `Slow down on “${worst.word}”.` : 'Almost there, a bit crisper.'; }
  else if (score >= 40) { verdict = 'close'; tip = worst ? `Listen again, then stress “${worst.word}”.` : 'Listen again and copy the sound.'; }
  else { verdict = 'off'; tip = best.heard ? `I heard “${best.heard}”. Tap the speaker and copy it.` : 'Speak a little louder.'; }

  return { score, verdict, heard: best.heard, tip, words: best.per, exact: best.exact };
}

/* ---------------- recogniser wrapper ---------------- */
export class Recognizer {
  constructor() {
    this.rec = null;
    this.stream = null;
    this.meter = null;
    this.meterBlocked = isIOS;        // iOS dislikes getUserMedia + SR at once
    this.active = false;
  }

  get supported() { return hasASR; }

  async warmMic() {
    if (this.meterBlocked || this.stream) return this.stream;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.meter = await createMeter(this.stream);
      return this.stream;
    } catch (e) {
      this.meterBlocked = true;
      return null;
    }
  }

  releaseMic() {
    try { this.meter && this.meter.stop(); } catch (_) {}
    try { this.stream && this.stream.getTracks().forEach(t => t.stop()); } catch (_) {}
    this.stream = null; this.meter = null;
  }

  level() { return this.meter ? this.meter.read() : -1; }

  /**
   * Listen once. Resolves { alternatives, interim } or rejects { code, message }.
   */
  listen({ lang = 'en-US', maxMs = 7000, onInterim } = {}) {
    if (!hasASR) return Promise.reject({ code: 'unsupported', message: 'Speech recognition is not available in this browser.' });
    if (this.active) this.abort();

    return new Promise((resolve, reject) => {
      const rec = new SR();
      this.rec = rec; this.active = true;
      rec.lang = lang;
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 5;

      let settled = false, got = null;
      const finish = (fn, arg) => {
        if (settled) return; settled = true; this.active = false;
        clearTimeout(timer);
        try { rec.onresult = rec.onerror = rec.onend = null; } catch (_) {}
        fn(arg);
      };
      const timer = setTimeout(() => { try { rec.stop(); } catch (_) {} }, maxMs);

      rec.onresult = (ev) => {
        const r = ev.results[ev.results.length - 1];
        if (!r) return;
        if (!r.isFinal) { onInterim && onInterim(r[0] ? r[0].transcript : ''); return; }
        const alternatives = [];
        for (let i = 0; i < r.length; i++) {
          alternatives.push({ transcript: r[i].transcript, confidence: r[i].confidence });
        }
        got = { alternatives };
      };
      rec.onerror = (ev) => {
        const code = ev.error || 'error';
        if (code === 'no-speech') { finish(resolve, { alternatives: [] }); return; }
        if (code === 'aborted' && got) { finish(resolve, got); return; }
        finish(reject, { code, message: errMsg(code) });
      };
      rec.onend = () => finish(resolve, got || { alternatives: [] });

      try { rec.start(); }
      catch (e) { finish(reject, { code: 'start-failed', message: 'Could not start the microphone. Tap again.' }); }
    });
  }

  stop()  { try { this.rec && this.rec.stop(); } catch (_) {} }
  abort() { this.active = false; try { this.rec && this.rec.abort(); } catch (_) {} }
}

function errMsg(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed': return 'Microphone permission is blocked. Allow the mic in your browser settings.';
    case 'audio-capture':       return 'No microphone found. Check your device.';
    case 'network':             return 'Speech recognition needs an internet connection in this browser.';
    case 'unsupported':         return 'Speech recognition is not available in this browser.';
    default:                    return 'Something went wrong with the mic. Tap to try again.';
  }
}

/* Fallback: no ASR available — record and let the learner self-check. */
export class PracticeRecorder {
  constructor() { this.stream = null; this.rec = null; this.chunks = []; this.meter = null; this.url = null; }
  get supported() { return !!(navigator.mediaDevices && window.MediaRecorder); }
  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.meter = await createMeter(this.stream);
    this.chunks = [];
    this.rec = new MediaRecorder(this.stream);
    this.rec.ondataavailable = e => e.data.size && this.chunks.push(e.data);
    this.rec.start();
  }
  level() { return this.meter ? this.meter.read() : -1; }
  stop() {
    return new Promise(res => {
      if (!this.rec) return res(null);
      this.rec.onstop = () => {
        const peak = this.meter ? this.meter.peak() : 0;
        const blob = new Blob(this.chunks, { type: this.rec.mimeType || 'audio/webm' });
        if (this.url) URL.revokeObjectURL(this.url);
        this.url = URL.createObjectURL(blob);
        try { this.stream.getTracks().forEach(t => t.stop()); } catch (_) {}
        this.meter && this.meter.stop();
        this.stream = null; this.meter = null;
        res({ url: this.url, peak, spoke: peak > 0.045 });
      };
      try { this.rec.stop(); } catch (_) { res(null); }
    });
  }
}
