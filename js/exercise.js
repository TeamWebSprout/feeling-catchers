/* ============================================================
   Chirp — the lesson runner (all exercise stages)
   ============================================================ */
import { h, on, sfx, toast, modal, confetti, gauge, wait, esc, clamp } from './ui.js';
import { ICONS, heartSvg, starSvg, mascot } from './svg.js';
import { say, stopSpeaking, haptic, unlockAudio } from './audio.js';
import { Recognizer, PracticeRecorder, scorePronunciation, hasASR, isSecure, words as splitWords } from './speech.js';
import { buildStages, starsFor, xpFor, starsReward, shuffle, STAGE_LABEL } from './lesson.js';
import * as St from './state.js';

const rec = new Recognizer();
export const recognizer = rec;

/* how the learner is answering speech stages */
export const micMode = { value: hasASR ? 'speech' : (window.MediaRecorder ? 'practice' : 'tap') };

/* ---------- helpers ---------- */
const maskText = (text, hint) => {
  if (hint === 'full') return esc(text);
  if (hint === 'none') return '<span class="masked">• • •</span>';
  return esc(text.split(' ').map(w => w[0] + '·'.repeat(Math.max(1, w.length - 1))).join(' '));
};
const transOf = (w, lang) => (lang === 'en' ? '' : (w.t && w.t[lang]) || '');
const verdictCopy = {
  perfect: ['Perfect!', '🌟'], great: ['Great job!', '🎉'], good: ['Good one!', '👍'],
  close:   ['So close!', '🤏'], off: ['Not quite', '🙃'], nothing: ['I heard nothing', '🤫']
};

/* ============================================================
   Lesson screen
   ============================================================ */
export function LessonScreen(lesson, { onExit, onFinish }) {
  const S = St.state();
  const stages = buildStages(lesson);
  const lang = S.nativeLang;
  let idx = 0, scores = [], lostHearts = 0, bossWon = false, alive = true;
  const startedAt = Date.now();

  const root = h(`<div class="screen">
    <div class="ex">
      <div class="ex-top">
        <button class="icon-btn" data-act="quit" aria-label="Quit lesson">${ICONS.close}</button>
        <div class="pbar"><i style="width:0%"></i></div>
        <div class="stat-chip" data-hearts>${heartSvg()}<span>${S.hearts}</span></div>
      </div>
      <div class="stage-tag"></div>
      <div class="ex-body"></div>
      <div class="ex-foot"></div>
    </div>
  </div>`);

  const exEl   = root.querySelector('.ex');
  const bodyEl = root.querySelector('.ex-body');
  const footEl = root.querySelector('.ex-foot');
  const tagEl  = root.querySelector('.stage-tag');
  const barEl  = root.querySelector('.pbar i');
  const heartsEl = root.querySelector('[data-hearts] span');

  let timers = [], raf = null;
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  function cleanup() {
    alive = false;
    timers.forEach(clearTimeout); timers = [];
    if (raf) cancelAnimationFrame(raf);
    stopSpeaking(); rec.abort(); rec.releaseMic();
  }
  root.cleanup = cleanup;

  on(root, '[data-act="quit"]', () => {
    const m = modal(`<h3>Leave the lesson?</h3><p>Your progress in this lesson will not be saved.</p>
      <button class="btn coral" data-yes>Leave</button><div style="height:10px"></div>
      <button class="btn ghost" data-no>Keep going</button>`);
    m.el.querySelector('[data-yes]').onclick = () => { m.close(); cleanup(); onExit(); };
    m.el.querySelector('[data-no]').onclick = m.close;
  });

  const refreshHearts = () => { heartsEl.textContent = St.unlimited() ? '∞' : St.state().hearts; };

  /* ---------- stage dispatch ---------- */
  function render() {
    if (!alive) return;
    timers.forEach(clearTimeout); timers = [];
    if (raf) cancelAnimationFrame(raf);
    stopSpeaking(); rec.abort();

    if (idx >= stages.length) return finish();
    const st = stages[idx];
    barEl.style.width = `${(idx / stages.length) * 100}%`;
    tagEl.textContent = `${st.label} · ${idx + 1}/${stages.length}`;
    exEl.classList.toggle('pale', ['build', 'match', 'choose'].includes(st.type));
    bodyEl.classList.toggle('center', ['build', 'match', 'choose'].includes(st.type));
    bodyEl.innerHTML = ''; footEl.innerHTML = '';
    bodyEl.scrollTop = 0;

    const effective = (st.speaking && micMode.value === 'tap') ? { ...st, type: 'choose',
      options: shuffle([st.word ? st.word.w : st.target, ...tapDecoys(st)]), speaking: false,
      prompt: 'Which word fits?', label: 'Word Check' } : st;

    switch (effective.type) {
      case 'listen': case 'picture': case 'phrase': case 'blank': case 'sentence':
        return speechStage(effective);
      case 'build':  return buildStage(effective);
      case 'choose': return chooseStage(effective);
      case 'match':  return matchStage(effective);
      case 'boss':   return micMode.value === 'tap' ? bossTapStage(effective) : bossStage(effective);
      default: idx++; return render();
    }
  }

  function tapDecoys(st) {
    const others = lesson.words.filter(w => !st.word || w.w !== st.word.w).map(w => w.w);
    return shuffle(others).slice(0, 3);
  }

  const advance = (score) => {
    scores.push(clamp(score, 0, 100));
    idx++;
    render();
  };

  /* ============================================================
     SPEECH STAGES
     ============================================================ */
  function speechStage(st) {
    const w = st.word;
    const trans = transOf(w, lang);
    let tries = 0, busy = false, finished = false, best = 0;

    /* --- visual target --- */
    let visual = '';
    if (st.type === 'listen' || st.type === 'picture') {
      visual = `<div class="picture">${w.e}</div>
        <div class="target-word">${maskText(w.w, st.hint)}</div>
        ${trans && st.hint !== 'none' ? `<div class="target-trans">${esc(trans)}</div>` : ''}`;
    } else if (st.type === 'phrase') {
      visual = `<div class="picture" style="width:104px;height:104px;font-size:52px;border-radius:32px">${w.e}</div>
        <div class="target-word small">${maskText(w.ph, st.hint)}</div>`;
    } else if (st.type === 'blank') {
      const blanked = w.s.replace(new RegExp(`\\b${w.w}\\b`, 'i'), '_____');
      visual = `<div class="picture" style="width:104px;height:104px;font-size:52px;border-radius:32px">${w.e}</div>
        <div class="target-word tiny">${esc(blanked)}</div>`;
    } else {
      visual = `<div class="picture" style="width:96px;height:96px;font-size:46px;border-radius:30px">${w.e}</div>
        <div class="target-word tiny">${maskText(w.s, st.hint)}</div>`;
    }

    bodyEl.innerHTML = `
      <div class="prompt">${esc(st.prompt)}</div>
      <div class="prompt-sub">Pass mark ${st.pass}%${st.timeLimit ? ' · beat the clock' : ''}</div>
      ${visual}
      <div class="btn-row" style="justify-content:center;margin-top:12px">
        <button class="btn ghost sm" data-play>${ICONS.sound} Hear it</button>
        <button class="btn ghost sm" data-slow>Slowly</button>
      </div>
      <div class="mic-zone">
        <div class="wave" data-wave>${'<i></i>'.repeat(9)}</div>
        <button class="mic-btn" data-mic aria-label="Record">${ICONS.mic}</button>
        <div class="mic-hint" data-hint>Tap the mic and say it</div>
        <div data-result></div>
      </div>`;

    const resultBox = bodyEl.querySelector('[data-result]');
    const hintEl = bodyEl.querySelector('[data-hint]');
    const micBtn = bodyEl.querySelector('[data-mic]');
    const waveEl = bodyEl.querySelector('[data-wave]');
    const spoken = st.target;
    const HINT_CAP = 85;
    let hintUsed = false;
    const useHint = () => {
      if (st.hint !== 'none' || hintUsed) return;
      hintUsed = true;
      const tagline = bodyEl.querySelector('.prompt-sub');
      if (tagline) tagline.innerHTML += ` · <span style="opacity:.95">hint used, max ${HINT_CAP}%</span>`;
    };

    setFoot({ primary: { label: 'Skip', cls: 'ghost', act: () => giveUp() } });
    if (micMode.value === 'practice') {
      resultBox.innerHTML = `<div class="notice"><span class="big">🎤</span><div>This browser cannot score speech.
        Chirp will record you so you can compare with the model voice. Try Chrome, Edge or Safari for scoring.</div></div>`;
    } else if (!isSecure) {
      resultBox.innerHTML = `<div class="notice"><span class="big">🔒</span><div>Microphones need
        <b>https</b> or <b>localhost</b>. Open the app from a secure address to speak.</div></div>`;
    }

    bodyEl.querySelector('[data-play]').onclick = () => { sfx('tap'); useHint(); say(spoken, { rate: St.state().settings.rate }); };
    bodyEl.querySelector('[data-slow]').onclick = () => { sfx('tap'); useHint(); say(spoken, { rate: 0.55 }); };
    if (st.autoplay) later(() => say(spoken, { rate: St.state().settings.rate }), 420);

    /* timer */
    let timeLeft = st.timeLimit;
    if (st.timeLimit) startTimer(st.timeLimit, () => { if (!finished) giveUp(true); }, v => (timeLeft = v));

    micBtn.onclick = () => record();

    async function record() {
      if (busy || finished) return;
      busy = true;
      unlockAudio();
      stopSpeaking();
      micBtn.classList.add('rec');
      hintEl.textContent = 'Listening…';
      sfx('recStart'); haptic(16);
      animateWave(waveEl, () => (micMode.value === 'speech' ? rec.level() : practice.level ? practice.level() : -1));

      if (micMode.value === 'practice') return recordPractice();

      try {
        await rec.warmMic();
        const res = await rec.listen({
          maxMs: 7000,
          onInterim: t => { hintEl.textContent = t ? `“${t}”` : 'Listening…'; }
        });
        stopWave(waveEl);
        micBtn.classList.remove('rec');
        sfx('recStop');
        const scored = scorePronunciation(spoken, res.alternatives);
        showResult(scored);
      } catch (e) {
        stopWave(waveEl); micBtn.classList.remove('rec'); busy = false;
        hintEl.textContent = 'Tap the mic and say it';
        micError(e);
      }
    }

    const practice = new PracticeRecorder();
    async function recordPractice() {
      try {
        await practice.start();
        hintEl.textContent = 'Recording… tap again to stop';
        micBtn.onclick = async () => {
          micBtn.onclick = () => record();
          const out = await practice.stop();
          stopWave(waveEl); micBtn.classList.remove('rec'); busy = false;
          sfx('recStop');
          if (!out || !out.spoke) { hintEl.textContent = 'I could not hear you — a bit louder!'; return; }
          hintEl.textContent = 'Compare the two, then choose';
          resultBox.innerHTML = `<div class="result">
            <b>How did it sound?</b>
            <div class="btn-row" style="margin-top:10px">
              <button class="btn ghost sm" data-mine>${ICONS.play} Mine</button>
              <button class="btn ghost sm" data-model>${ICONS.sound} Model</button>
            </div>
            <div class="btn-row" style="margin-top:10px">
              <button class="btn green sm" data-ok>Sounded good</button>
              <button class="btn yellow sm" data-again>Try again</button>
            </div></div>`;
          const a = new Audio(out.url);
          resultBox.querySelector('[data-mine]').onclick = () => a.play();
          resultBox.querySelector('[data-model]').onclick = () => say(spoken, { rate: .8 });
          resultBox.querySelector('[data-ok]').onclick = () => { finished = true; St.recordWord(w.w, 75, lesson.id); advance(75); };
          resultBox.querySelector('[data-again]').onclick = () => { resultBox.innerHTML = ''; };
        };
      } catch (e) {
        busy = false; stopWave(waveEl); micBtn.classList.remove('rec');
        micError({ code: 'not-allowed' });
      }
    }

    function showResult(r) {
      busy = false;
      if (hintUsed && r.score > HINT_CAP) r = { ...r, score: HINT_CAP, tip: `${r.tip} (capped — you used the hint)` };
      best = Math.max(best, r.score);
      hintEl.textContent = r.tip;
      const [title, emoji] = verdictCopy[r.verdict] || verdictCopy.off;
      const perWord = r.words.map(x => {
        const c = x.sim >= .8 ? 'good' : x.sim >= .55 ? 'mid' : 'bad';
        return `<span class="ws ${c}">${esc(x.word)}</span>`;
      }).join('');
      resultBox.innerHTML = `<div class="result">
        <div class="result-head">${gauge(r.score)}
          <div style="flex:1">
            <b style="font-size:19px">${title} ${emoji}</b>
            <div class="heardline">${r.heard ? `I heard: “${esc(r.heard)}”` : 'Nothing came through'}</div>
          </div></div>
        <div class="wordscores">${perWord}</div></div>`;

      St.recordWord(w.w, r.score, lesson.id);
      const passed = r.score >= st.pass;
      if (passed) {
        finished = true;
        sfx(r.score >= 93 ? 'perfect' : 'correct');
        haptic([12, 40, 18]);
        if (r.score >= 93) confetti(28);
        setFoot({ primary: { label: 'Continue', cls: 'green', act: () => advance(r.score) } });
      } else {
        tries++;
        sfx(r.score >= st.pass - 15 ? 'retry' : 'wrong');
        haptic(30);
        if (tries <= st.retries) {
          setFoot({
            primary: { label: `Try again (${st.retries - tries + 1} left)`, cls: 'yellow', act: () => { resultBox.innerHTML = ''; hintEl.textContent = 'Tap the mic and say it'; } },
            secondary: { label: 'Hear it slowly', act: () => say(spoken, { rate: .5 }) }
          });
        } else {
          finished = true;
          const left = St.loseHeart(); refreshHearts(); sfx('heartLost');
          setFoot({ primary: { label: 'Continue', cls: 'coral', act: () => { if (!St.hasHearts()) return outOfHearts(); advance(best); } } });
          if (left === 0) later(() => { if (alive) outOfHearts(); }, 500);
        }
      }
    }

    function giveUp(byTimer = false) {
      if (finished) return;
      finished = true;
      rec.abort(); stopWave(waveEl); micBtn.classList.remove('rec');
      St.loseHeart(); refreshHearts(); sfx('heartLost');
      resultBox.innerHTML = `<div class="result"><b>${byTimer ? '⏰ Out of time!' : 'Skipped'}</b>
        <div class="heardline">The answer was “${esc(spoken)}”.</div></div>`;
      say(spoken, { rate: .7 });
      setFoot({ primary: { label: 'Continue', cls: 'coral', act: () => { if (!St.hasHearts()) return outOfHearts(); advance(best); } } });
    }
  }

  /* ============================================================
     BOSS — speed round
     ============================================================ */
  function bossStage(st) {
    let i = 0; const got = [];
    bodyEl.innerHTML = `<div class="prompt">⚡️ Speed Round</div>
      <div class="prompt-sub">${st.items.length} words · ${Math.round(st.perMs / 1000)}s each · pass ${st.pass}%</div>
      <div data-slot style="flex:1;display:flex;flex-direction:column">
        <div style="margin:auto 0;text-align:center">
          ${mascot(lesson.mascot).replace('class="mascot-svg"', 'class="mascot-svg float" style="width:118px;height:118px;margin:0 auto"')}
          <div style="font-size:17px;font-weight:900;margin-top:10px">No hints. No second tries.</div>
          <div class="wordchips" style="margin-top:14px">
            ${st.items.map(it => `<span class="chip" style="background:rgba(255,255,255,.22);color:#fff">${it.word.e}</span>`).join('')}
          </div>
        </div>
      </div>`;
    const slot = bodyEl.querySelector('[data-slot]');
    setFoot({ primary: { label: 'Go!', cls: 'yellow', act: () => { footEl.innerHTML = ''; step(); } } });

    async function step() {
      if (!alive) return;
      if (i >= st.items.length) return done();
      const it = st.items[i];
      slot.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin:6px 0 2px">
          <div class="pbar" style="height:9px"><i data-clock style="width:100%;background:#FFD84D"></i></div>
          <div style="font-weight:900;font-size:14px">${i + 1}/${st.items.length}</div>
        </div>
        <div class="picture" style="width:118px;height:118px;font-size:60px;border-radius:34px">${it.word.e}</div>
        <div class="target-word ${it.target.includes(' ') ? 'small' : ''}">${esc(it.target)}</div>
        <div class="mic-zone"><div class="wave" data-wave>${'<i></i>'.repeat(9)}</div>
          <button class="mic-btn rec" data-mic>${ICONS.mic}</button>
          <div class="mic-hint" data-hint>Say it now!</div></div>`;
      const clock = slot.querySelector('[data-clock]');
      const waveEl = slot.querySelector('[data-wave]');
      const hintEl = slot.querySelector('[data-hint]');
      const t0 = Date.now();
      let running = true;
      const tick = () => {
        if (!running || !alive) return;
        const left = Math.max(0, 1 - (Date.now() - t0) / st.perMs);
        clock.style.width = `${left * 100}%`;
        if (left <= 0) { running = false; rec.stop(); return; }
        raf = requestAnimationFrame(tick);
      };
      tick();
      animateWave(waveEl, () => rec.level());
      sfx('recStart');

      try {
        await rec.warmMic();
        const res = await rec.listen({ maxMs: st.perMs, onInterim: t => (hintEl.textContent = t ? `“${t}”` : 'Say it now!') });
        running = false; stopWave(waveEl);
        const sc = scorePronunciation(it.target, res.alternatives);
        St.recordWord(it.word.w, sc.score, lesson.id);
        got.push(sc.score);
        hintEl.textContent = `${sc.score}% — ${verdictCopy[sc.verdict][0]}`;
        sfx(sc.score >= st.pass ? 'correct' : 'wrong');
        haptic(sc.score >= st.pass ? 14 : 30);
      } catch (e) {
        running = false; stopWave(waveEl); got.push(0);
        micError(e);
      }
      i++;
      later(step, 620);
    }

    function done() {
      const avg = got.length ? Math.round(got.reduce((a, b) => a + b, 0) / got.length) : 0;
      const won = avg >= st.pass;
      if (won) { bossWon = true; St.bumpStat('bossWins'); confetti(70); sfx('levelup'); }
      else { St.loseHeart(); refreshHearts(); sfx('heartLost'); }
      slot.innerHTML = `<div class="picture" style="width:130px;height:130px;font-size:66px">${won ? '👑' : '💪'}</div>
        <div class="target-word">${won ? 'Boss beaten!' : 'Nearly!'}</div>
        <div style="margin-top:14px;display:flex;justify-content:center">${gauge(avg, { size: 92, stroke: 10 })}</div>`;
      setFoot({ primary: { label: 'Continue', cls: won ? 'green' : 'coral', act: () => advance(avg) } });
    }
  }

  /* tap-only boss for browsers without speech */
  function bossTapStage(st) {
    const items = st.items.map(it => ({
      ...it, options: shuffle([it.word.w, ...shuffle(lesson.words.filter(x => x.w !== it.word.w)).slice(0, 3).map(x => x.w)])
    }));
    let i = 0; const got = [];
    bodyEl.innerHTML = `<div class="prompt">⚡️ Speed Round</div>
      <div class="prompt-sub">Tap the right word before the bar runs out</div><div data-slot></div>`;
    const slot = bodyEl.querySelector('[data-slot]');
    const step = () => {
      if (i >= items.length) {
        const avg = Math.round(got.reduce((a, b) => a + b, 0) / Math.max(1, got.length));
        if (avg >= st.pass) { bossWon = true; confetti(60); sfx('levelup'); } else { St.loseHeart(); refreshHearts(); }
        slot.innerHTML = `<div class="picture">${avg >= st.pass ? '👑' : '💪'}</div>`;
        return setFoot({ primary: { label: 'Continue', cls: 'green', act: () => advance(avg) } });
      }
      const it = items[i];
      slot.innerHTML = `<div class="pbar" style="height:9px;margin:10px 0"><i data-clock style="width:100%;background:#FFD84D"></i></div>
        <div class="picture">${it.word.e}</div>
        <div class="opts two">${it.options.map(o => `<button class="opt" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
      const clock = slot.querySelector('[data-clock]');
      const t0 = Date.now(); let running = true;
      const tick = () => { if (!running || !alive) return;
        const left = Math.max(0, 1 - (Date.now() - t0) / st.perMs); clock.style.width = `${left * 100}%`;
        if (left <= 0) { running = false; got.push(0); i++; return step(); }
        raf = requestAnimationFrame(tick); };
      tick();
      slot.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
        running = false;
        const ok = b.dataset.o === it.word.w;
        b.classList.add(ok ? 'ok' : 'no'); sfx(ok ? 'correct' : 'wrong');
        got.push(ok ? 100 : 0); i++; later(step, 480);
      });
    };
    setFoot({ primary: { label: 'Go!', cls: 'yellow', act: () => { footEl.innerHTML = ''; step(); } } });
  }

  /* ============================================================
     TAP STAGES
     ============================================================ */
  function buildStage(st) {
    const target = st.target.replace(/\s/g, '');
    let filled = [];
    bodyEl.innerHTML = `<div class="prompt">${esc(st.prompt)}</div>
      <div class="prompt-sub">${esc(transOf(st.word, lang) || 'Spell it out')}</div>
      <div class="picture">${st.word.e}</div>
      <div class="slots" data-slots></div>
      <div class="tiles" data-tiles>${st.letters.map((c, i) =>
        `<button class="tile" data-i="${i}">${esc(c)}</button>`).join('')}</div>`;
    const slotsEl = bodyEl.querySelector('[data-slots]');
    const tilesEl = bodyEl.querySelector('[data-tiles]');
    const paint = () => {
      slotsEl.innerHTML = target.split('').map((_, i) =>
        `<div class="slot ${filled[i] ? 'f' : ''}" data-s="${i}">${filled[i] ? esc(filled[i].c) : ''}</div>`).join('');
      slotsEl.querySelectorAll('[data-s]').forEach(el => el.onclick = () => {
        const i = +el.dataset.s; if (!filled[i]) return;
        tilesEl.querySelector(`[data-i="${filled[i].i}"]`).classList.remove('used');
        filled[i] = null; sfx('tap'); paint(); check();
      });
    };
    paint();
    tilesEl.querySelectorAll('.tile').forEach(t => t.onclick = () => {
      const slot = filled.findIndex((v, i) => !v && i < target.length);
      const free = slot === -1 ? filled.length : slot;
      if (free >= target.length) return;
      filled[free] = { c: t.textContent, i: +t.dataset.i };
      t.classList.add('used'); sfx('tap'); paint(); check();
    });
    setFoot({ primary: { label: 'Skip', cls: 'ghost', act: () => { St.loseHeart(); refreshHearts(); advance(0); } } });
    if (st.timeLimit) startTimer(st.timeLimit, () => { St.loseHeart(); refreshHearts(); advance(0); });

    function check() {
      if (filled.filter(Boolean).length < target.length) return;
      const guess = filled.map(f => f.c).join('');
      if (guess === target) {
        sfx('correct'); confetti(20); haptic([10, 30, 12]);
        slotsEl.querySelectorAll('.slot').forEach(s => s.style.background = '#2FCB6E');
        setFoot({ primary: { label: 'Continue', cls: 'green', act: () => advance(100) } });
        say(st.word.w, { rate: .8 });
      } else {
        sfx('wrong'); haptic(30);
        slotsEl.querySelectorAll('.slot').forEach(s => s.style.background = '#FF5D7D');
        later(() => {
          filled = []; tilesEl.querySelectorAll('.tile').forEach(t => t.classList.remove('used')); paint();
        }, 520);
      }
    }
  }

  function chooseStage(st) {
    let answered = false;
    bodyEl.innerHTML = `<div class="prompt">${esc(st.prompt)}</div>
      <div class="prompt-sub">Tap the speaker as many times as you like</div>
      <button class="mic-btn" data-play style="margin:16px auto;color:var(--blue)">${ICONS.sound}</button>
      <div class="opts two">${st.options.map(o => `<button class="opt" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
    bodyEl.querySelector('[data-play]').onclick = () => say(st.word.w, { rate: St.state().settings.rate });
    later(() => say(st.word.w, { rate: St.state().settings.rate }), 400);
    setFoot({ primary: { label: 'Skip', cls: 'ghost', act: () => { St.loseHeart(); refreshHearts(); advance(0); } } });
    if (st.timeLimit) startTimer(st.timeLimit, () => { if (!answered) { St.loseHeart(); refreshHearts(); advance(0); } });

    bodyEl.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
      if (answered) return; answered = true;
      const ok = b.dataset.o === st.word.w;
      b.classList.add(ok ? 'ok' : 'no');
      if (!ok) bodyEl.querySelector(`[data-o="${CSS.escape(st.word.w)}"]`).classList.add('ok');
      sfx(ok ? 'correct' : 'wrong'); haptic(ok ? 14 : 30);
      if (!ok) { St.loseHeart(); refreshHearts(); }
      setFoot({ primary: { label: 'Continue', cls: ok ? 'green' : 'coral', act: () => advance(ok ? 100 : 25) } });
    });
  }

  function matchStage(st) {
    const left = shuffle(st.pairs), right = shuffle(st.pairs);
    let sel = null, done = 0, wrong = 0;
    bodyEl.innerHTML = `<div class="prompt">${lang === 'en' ? 'Match each word to its picture' : 'Match each word to its meaning'}</div>
      <div class="prompt-sub">Tap a word, then tap its partner</div>
      <div class="match">
        <div class="mcol">${left.map(p => `<button class="opt" data-l="${esc(p.w)}">${esc(p.w)}</button>`).join('')}</div>
        <div class="mcol">${right.map(p => `<button class="opt" data-r="${esc(p.w)}">${p.e} ${esc(transOf(p, lang))}</button>`).join('')}</div>
      </div>`;
    setFoot({ primary: { label: 'Skip', cls: 'ghost', act: () => { St.loseHeart(); refreshHearts(); advance(0); } } });
    if (st.timeLimit) startTimer(st.timeLimit, () => { St.loseHeart(); refreshHearts(); advance(Math.round(done / st.pairs.length * 100)); });

    const clickL = b => { bodyEl.querySelectorAll('[data-l]').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = b; sfx('tap'); };
    bodyEl.querySelectorAll('[data-l]').forEach(b => b.onclick = () => !b.classList.contains('dim') && clickL(b));
    bodyEl.querySelectorAll('[data-r]').forEach(b => b.onclick = () => {
      if (!sel || b.classList.contains('dim')) return;
      if (sel.dataset.l === b.dataset.r) {
        sel.classList.add('ok'); b.classList.add('ok'); sfx('correct'); haptic(12);
        const a = sel, c = b;
        later(() => { a.classList.add('dim'); c.classList.add('dim'); }, 260);
        say(b.dataset.r, { rate: .85 });
        sel = null; done++;
        if (done === st.pairs.length) {
          confetti(24);
          const acc = Math.max(40, 100 - wrong * 14);
          setFoot({ primary: { label: 'Continue', cls: 'green', act: () => advance(acc) } });
        }
      } else {
        wrong++; b.classList.add('no'); sfx('wrong'); haptic(28);
        const c = b; later(() => c.classList.remove('no'), 420);
        sel.classList.remove('sel'); sel = null;
        if (wrong === 3) { St.loseHeart(); refreshHearts(); }
      }
    });
  }

  /* ============================================================
     shared bits
     ============================================================ */
  function setFoot({ primary, secondary }) {
    footEl.innerHTML = `${secondary ? `<button class="btn ghost" data-sec style="margin-bottom:10px">${esc(secondary.label)}</button>` : ''}
      <button class="btn ${primary.cls || ''}" data-pri>${esc(primary.label)}</button>`;
    footEl.querySelector('[data-pri]').onclick = () => { sfx('tap'); primary.act(); };
    if (secondary) footEl.querySelector('[data-sec]').onclick = () => { sfx('tap'); secondary.act(); };
  }

  function startTimer(ms, onEnd, onTick) {
    const t0 = Date.now();
    const bar = h(`<div class="timer" style="justify-content:center;margin-top:6px">⏱ <span></span></div>`);
    bodyEl.insertBefore(bar, bodyEl.firstChild.nextSibling);
    const span = bar.querySelector('span');
    let lastSec = -1;
    const loop = () => {
      if (!alive) return;
      const left = ms - (Date.now() - t0);
      onTick && onTick(left);
      const s = Math.ceil(left / 1000);
      if (s !== lastSec) { lastSec = s; span.textContent = `${Math.max(0, s)}s`; bar.classList.toggle('warn', s <= 5); if (s <= 5 && s > 0) sfx('tick'); }
      if (left <= 0) return onEnd();
      raf = requestAnimationFrame(loop);
    };
    loop();
  }

  function micError(e) {
    const code = e && e.code;
    if (code === 'not-allowed' || code === 'service-not-allowed') {
      const m = modal(`<h3>Mic is blocked 🎤</h3>
        <p>Chirp needs the microphone to hear you. Allow it in your browser's site settings, then tap the mic again.</p>
        <button class="btn" data-ok>Got it</button><div style="height:10px"></div>
        <button class="btn ghost" data-tap>Continue without the mic</button>`);
      m.el.querySelector('[data-ok]').onclick = m.close;
      m.el.querySelector('[data-tap]').onclick = () => { micMode.value = 'tap'; m.close(); render(); };
    } else if (code === 'network') {
      toast('Speech needs internet in this browser.');
    } else if (code === 'unsupported') {
      micMode.value = window.MediaRecorder ? 'practice' : 'tap';
      toast('No speech scoring here — switching mode.');
      render();
    } else if (code) {
      toast(e.message || 'Mic hiccup — try again.');
    }
  }

  function animateWave(waveEl, level) {
    const bars = [...waveEl.querySelectorAll('i')];
    const t0 = Date.now();
    const loop = () => {
      if (!alive || !waveEl.isConnected) return;
      const lv = level();
      const t = (Date.now() - t0) / 1000;
      bars.forEach((b, i) => {
        const wave = lv >= 0
          ? lv * (0.55 + 0.45 * Math.sin(t * 9 + i * 0.9))
          : 0.35 + 0.3 * Math.sin(t * 5 + i * 0.7);
        b.style.height = `${6 + Math.max(0, wave) * 38}px`;
      });
      waveEl._raf = requestAnimationFrame(loop);
    };
    loop();
  }
  function stopWave(waveEl) {
    if (waveEl && waveEl._raf) cancelAnimationFrame(waveEl._raf);
    if (waveEl) waveEl.querySelectorAll('i').forEach(b => (b.style.height = '6px'));
  }

  function outOfHearts() {
    const S2 = St.state();
    const m = modal(`
      <div style="font-size:44px">💔</div>
      <h3>Out of hearts</h3>
      <p>Buy more with stars, or take a short break and they refill on their own.</p>
      <div class="buy-row">
        <div class="buy" data-buy5><div class="big">💗</div><b>5 hearts</b>
          <div class="price">300 ${starSvg()}</div></div>
        <div class="buy inf" data-buyinf><div class="big">♾️</div><b>1 day</b>
          <div class="price">900 ${starSvg()}</div></div>
      </div>
      <div style="font-size:13px;color:var(--ink-3);font-weight:800;margin-bottom:12px">You have ${S2.stars} stars</div>
      <button class="btn ghost" data-leave>Leave lesson</button>`, { dismissable: false });
    m.el.querySelector('[data-buy5]').onclick = () => {
      if (St.buyHearts(5, 300)) { sfx('star'); refreshHearts(); m.close(); }
      else toast('Not enough stars yet.');
    };
    m.el.querySelector('[data-buyinf]').onclick = () => {
      if (St.buyUnlimited(900)) { sfx('star'); refreshHearts(); m.close(); }
      else toast('Not enough stars yet.');
    };
    m.el.querySelector('[data-leave]').onclick = () => { m.close(); cleanup(); onExit(); };
  }

  /* ---------- finish ---------- */
  function finish() {
    const acc = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const heartsLeft = St.state().hearts;
    const stars = starsFor(acc, Math.max(0, 5 - heartsLeft));
    const xp = xpFor(stars, lesson, bossWon);
    const coin = starsReward(stars, lesson);
    St.recordLesson(lesson.id, { stars, accuracy: acc });
    const lvUp = St.addXp(xp);
    St.addStars(coin);
    St.touchDay();
    St.bumpStat('seconds', Math.round((Date.now() - startedAt) / 1000));
    const gained = St.checkAchievements();
    cleanup();
    onFinish({ lesson, acc: Math.round(acc), stars, xp, coin, lvUp, gained, bossWon });
  }

  refreshHearts();
  render();
  return root;
}

/* ============================================================
   Lesson complete screen
   ============================================================ */
export function CompleteScreen(res, { onHome, onAgain }) {
  const { lesson, acc, stars, xp, coin, lvUp, gained } = res;
  const lang = St.state().nativeLang;
  const mastered = lesson.words.map(w => ({ w, rec: St.masteryOf(w.w) })).filter(x => x.rec);
  const root = h(`<div class="screen">
    <div class="scroll">
      <div class="done-hero">
        <div class="stars3">
          <div class="s ${stars >= 1 ? '' : 'off'}">${starSvg()}</div>
          <div class="s mid ${stars >= 2 ? '' : 'off'}">${starSvg()}</div>
          <div class="s ${stars >= 3 ? '' : 'off'}">${starSvg()}</div>
        </div>
        <div class="title" style="color:#fff">${stars === 3 ? 'Amazing!' : stars === 2 ? 'Well done!' : 'Lesson complete'}</div>
        <div class="subtitle" style="color:rgba(255,255,255,.85)">${esc(lesson.title)} · ${acc}% average accuracy</div>
        <div class="reward">
          <div><b>+${xp}</b><small>XP</small></div>
          <div><b>+${coin}</b><small>Stars</small></div>
          <div><b>${acc}%</b><small>Accuracy</small></div>
        </div>
      </div>
      <div class="pad">
        ${lvUp ? `<div class="notice" style="background:#E7F8EC;color:#12693B"><span class="big">🎉</span>
          <div><b>Level ${lvUp}!</b><br>You unlocked a new rank. Keep speaking every day.</div></div>` : ''}
        ${gained.length ? gained.map(a => `<div class="notice"><span class="big">${a.icon}</span>
          <div><b>${esc(a.name)}</b><br>${esc(a.desc)}</div></div>`).join('') : ''}
        <div class="section-h"><h3>You practised</h3></div>
        <div class="mastered">
          ${mastered.map(({ w, rec }) => `<div class="mrow">
            <div style="font-size:26px">${w.e}</div>
            <div style="flex:1"><b>${esc(w.w)}</b><small>${esc((w.t && w.t[lang]) || w.ph)} · best ${rec.best}%</small></div>
            <div>${ringSmall(rec.m)}</div></div>`).join('') || '<div class="empty">No words recorded</div>'}
        </div>
      </div>
    </div>
    <div style="padding:14px 16px calc(16px + var(--safe-b))">
      <button class="btn green" data-home>Back to the map</button>
      <div style="height:10px"></div>
      <button class="btn ghost" data-again>Practise again</button>
    </div>
  </div>`);
  root.querySelector('[data-home]').onclick = () => { sfx('tap'); onHome(); };
  root.querySelector('[data-again]').onclick = () => { sfx('tap'); onAgain(); };
  if (stars >= 2) { confetti(90); sfx('levelup'); }
  return root;
}

function ringSmall(m) {
  const pct = clamp(m, 0, 1);
  const col = pct >= .8 ? '#2FCB6E' : pct >= .5 ? '#FFC61A' : '#FF5D7D';
  const size = 34, stroke = 5, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return `<svg width="${size}" height="${size}"><circle cx="17" cy="17" r="${r}" fill="none" stroke="#EDF3F9" stroke-width="${stroke}"/>
    <circle cx="17" cy="17" r="${r}" fill="none" stroke="${col}" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 17 17)"/></svg>`;
}
