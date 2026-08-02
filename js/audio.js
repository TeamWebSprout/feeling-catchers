/* ============================================================
   Chirp — speech synthesis + synthesised sound effects
   No audio files: every sound is generated with WebAudio.
   ============================================================ */

let ctx = null;
function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
export const unlockAudio = () => ac();

/* ---------- sound effects ---------- */
function tone(freq, start, dur, { type = 'sine', vol = 0.18, slideTo = null } = {}) {
  const a = ac(); if (!a) return;
  const t0 = a.currentTime + start;
  const osc = a.createOscillator(), g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}

function noise(start, dur, vol = 0.1) {
  const a = ac(); if (!a) return;
  const n = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, n, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = a.createBufferSource(), g = a.createGain();
  src.buffer = buf; g.gain.value = vol;
  src.connect(g).connect(a.destination);
  src.start(a.currentTime + start);
}

export const SFX = {
  tap:      () => tone(660, 0, 0.06, { type: 'triangle', vol: 0.09 }),
  correct:  () => { tone(660, 0, 0.1, { type:'triangle' }); tone(880, .08, .12, { type:'triangle' }); tone(1174, .17, .2, { type:'triangle' }); },
  perfect:  () => { [523,659,784,1046,1318].forEach((f,i)=>tone(f, i*0.07, 0.26, { type:'triangle', vol:.16 })); },
  wrong:    () => { tone(200, 0, 0.18, { type:'sawtooth', vol:.12, slideTo: 120 }); noise(0, .12, .05); },
  retry:    () => { tone(392, 0, 0.12, { type:'sine', vol:.12 }); tone(330, .1, .16, { type:'sine', vol:.12 }); },
  levelup:  () => { [523,659,784,1046].forEach((f,i)=>tone(f, i*0.1, 0.4, { type:'sine', vol:.15 })); },
  heartLost:() => { tone(392, 0, 0.22, { type:'sine', vol:.14, slideTo: 196 }); },
  star:     () => { tone(1318, 0, 0.1, { type:'triangle', vol:.13 }); tone(1760, .07, .16, { type:'triangle', vol:.11 }); },
  recStart: () => tone(880, 0, 0.09, { type:'sine', vol:.1 }),
  recStop:  () => tone(587, 0, 0.09, { type:'sine', vol:.1 }),
  tick:     () => tone(1400, 0, 0.03, { type:'square', vol:.05 })
};

export function haptic(pattern = 12) {
  try { navigator.vibrate && navigator.vibrate(pattern); } catch (_) {}
}

/* ---------- text to speech ---------- */
let voices = [];
function loadVoices() { try { voices = speechSynthesis.getVoices() || []; } catch (_) { voices = []; } }
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}
export const hasTTS = () => 'speechSynthesis' in window;

function pickVoice(lang = 'en-US') {
  if (!voices.length) loadVoices();
  const base = lang.split('-')[0];
  const en = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(base));
  if (!en.length) return null;
  const nice = /samantha|karen|daniel|google us english|google uk|aria|jenny|zira|libby/i;
  return en.find(v => nice.test(v.name)) || en.find(v => /female/i.test(v.name)) || en[0];
}

export function say(text, { rate = 0.9, pitch = 1.08, lang = 'en-US', onend } = {}) {
  if (!hasTTS()) { onend && onend(); return null; }
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang; u.rate = rate; u.pitch = pitch; u.volume = 1;
    const v = pickVoice(lang); if (v) u.voice = v;
    if (onend) { u.onend = onend; u.onerror = onend; }
    speechSynthesis.speak(u);
    return u;
  } catch (_) { onend && onend(); return null; }
}
export const stopSpeaking = () => { try { speechSynthesis.cancel(); } catch (_) {} };

/* ---------- microphone level meter (visual waveform) ---------- */
export async function createMeter(stream) {
  const a = ac(); if (!a) return null;
  const src = a.createMediaStreamSource(stream);
  const an = a.createAnalyser();
  an.fftSize = 512; an.smoothingTimeConstant = 0.75;
  src.connect(an);
  const data = new Uint8Array(an.frequencyBinCount);
  let peak = 0;
  return {
    read() {
      an.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
      const rms = Math.sqrt(sum / data.length);
      peak = Math.max(peak, rms);
      return Math.min(1, rms * 4.2);
    },
    peak: () => peak,
    stop() { try { src.disconnect(); an.disconnect(); } catch (_) {} }
  };
}
