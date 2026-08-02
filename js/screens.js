/* ============================================================
   Chirp — app screens
   ============================================================ */
import { h, on, sfx, toast, modal, sheet, confetti, gauge, ring, esc, clamp, wait } from './ui.js';
import { ICONS, heartSvg, starSvg, mascot, scene, logo, MASCOT_KEYS } from './svg.js';
import { LANGS, MOTIVATIONS, GOALS, LEVELS, WORLDS, LESSONS, ACHIEVEMENTS, lessonsOfWorld, allWords } from './data.js';
import { say, stopSpeaking, haptic, unlockAudio } from './audio.js';
import { scorePronunciation, hasASR, isSecure, isIOS } from './speech.js';
import { practiceDeck, shuffle } from './lesson.js';
import { recognizer } from './exercise.js';
import * as St from './state.js';

/* ============================================================
   ONBOARDING
   ============================================================ */
export function Onboarding({ onDone }) {
  const draft = { nativeLang: 'es', motivation: 'games', startLevel: 'beginner', goal: 'normal', avatar: 'fox' };
  let step = 0;
  const TOTAL = 5;

  const root = h(`<div class="screen ob">
    <div class="ob-hero">${scene()}</div>
    <div class="ob-body">
      <div class="ob-steps"></div>
      <div class="scroll" data-slot style="margin:0 -18px;padding:0 18px"></div>
    </div>
    <div class="ob-foot">
      <button class="icon-btn light" data-back style="display:none">${ICONS.back}</button>
      <button class="btn" data-next>Next</button>
    </div>
  </div>`);

  const slot = root.querySelector('[data-slot]');
  const dots = root.querySelector('.ob-steps');
  const nextBtn = root.querySelector('[data-next]');
  const backBtn = root.querySelector('[data-back]');

  const paint = () => {
    dots.innerHTML = Array.from({ length: TOTAL }, (_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('');
    backBtn.style.display = step === 0 ? 'none' : 'grid';
    nextBtn.textContent = step === TOTAL - 1 ? 'Start learning' : 'Next';
    nextBtn.className = `btn ${step === TOTAL - 1 ? 'green' : ''}`;
    slot.innerHTML = views[step]();
    slot.scrollTop = 0;
    wire();
  };

  const views = [
    () => `<div class="eyebrow">Step 1</div>
      <h2 class="title">Choose your<br>native language</h2>
      <p class="subtitle" style="margin-top:6px">Translations help you at the start.</p>
      <div class="chooser">${LANGS.map(l => `<button class="choice ${draft.nativeLang === l.id ? 'on' : ''}" data-lang="${l.id}">
        <span class="tickmark">${ICONS.check}</span><span class="big">${l.flag}</span><b>${esc(l.name)}</b></button>`).join('')}</div>`,

    () => `<div class="eyebrow">Step 2</div>
      <h2 class="title">Why do you want<br>to speak English?</h2>
      <p class="subtitle" style="margin-top:6px">Pick the reason that feels most like you.</p>
      <div class="bubbles">${MOTIVATIONS.map((m, i) => `
        <button class="bubble ${draft.motivation === m.id ? 'on' : ''}" data-mot="${m.id}"
          style="background:${m.color};color:${m.color};transform:translateY(${[0, 14, 0, 12, 0, 14][i]}px)">
          <span style="color:#fff"><em>${m.emoji}</em>${esc(m.label)}</span></button>`).join('')}</div>`,

    () => `<div class="eyebrow">Step 3</div>
      <h2 class="title">What is your<br>English level?</h2>
      <p class="subtitle" style="margin-top:6px">You can change worlds later on the map.</p>
      <div style="display:grid;gap:12px;margin-top:16px">
        ${LEVELS.map(l => `<button class="choice ${draft.startLevel === l.id ? 'on' : ''}" data-lvl="${l.id}"
          style="display:flex;align-items:center;gap:14px;text-align:left">
          <span class="tickmark">${ICONS.check}</span>
          <span style="width:46px;height:46px;border-radius:16px;display:grid;place-items:center;font-size:24px;
            background:${WORLDS[l.world].color}22">${['🌱','🌿','🌳'][l.world]}</span>
          <span style="flex:1"><b>${esc(l.label)}</b><small>${esc(l.sub)} · starts in ${WORLDS[l.world].name}</small></span>
        </button>`).join('')}
      </div>`,

    () => `<div class="eyebrow">Step 4</div>
      <h2 class="title">Choose your<br>daily goal</h2>
      <div style="display:grid;gap:10px;margin-top:16px">
        ${GOALS.map(g => `<button class="choice ${draft.goal === g.id ? 'on' : ''}" data-goal="${g.id}"
          style="display:flex;align-items:center;justify-content:space-between;text-align:left">
          <span class="tickmark">${ICONS.check}</span>
          <b>${esc(g.label)}</b><small style="margin:0;color:var(--blue)">${esc(g.sub)}</small></button>`).join('')}
      </div>
      <div class="notice" style="margin-top:16px"><span class="big">💡</span>
        <div>You can always change your goal in your profile.</div></div>`,

    () => `<div class="eyebrow">Step 5</div>
      <h2 class="title">Pick your<br>speaking buddy</h2>
      <div class="chooser" style="grid-template-columns:repeat(3,1fr)">
        ${MASCOT_KEYS.map(k => `<button class="choice ${draft.avatar === k ? 'on' : ''}" data-av="${k}" style="padding:10px 6px">
          <span class="tickmark">${ICONS.check}</span>${mascot(k).replace('class="mascot-svg"', 'class="mascot-svg" style="width:62px;height:62px;margin:0 auto"')}
          <b style="text-transform:capitalize;font-size:13px">${k}</b></button>`).join('')}
      </div>
      <div class="card" style="margin-top:18px;text-align:center">
        ${logo()}
        <p class="subtitle" style="margin-top:8px">Speak out loud, get a score, level up.<br>
        ${hasASR ? 'Your microphone is ready.' : 'Heads up: this browser cannot score speech — Chrome, Edge or Safari can.'}</p>
      </div>`
  ];

  function wire() {
    const map = { '[data-lang]': ['nativeLang', 'lang'], '[data-mot]': ['motivation', 'mot'],
                  '[data-lvl]': ['startLevel', 'lvl'], '[data-goal]': ['goal', 'goal'], '[data-av]': ['avatar', 'av'] };
    Object.entries(map).forEach(([sel, [key, attr]]) => {
      slot.querySelectorAll(sel).forEach(b => b.onclick = () => {
        draft[key] = b.dataset[attr]; sfx('tap'); haptic(10);
        if (key === 'avatar') say('Hello! Let us learn together.', { rate: .95 });
        paint();
      });
    });
  }

  nextBtn.onclick = () => {
    sfx('tap'); unlockAudio();
    if (step < TOTAL - 1) { step++; paint(); return; }
    St.patch({ ...draft, onboarded: true, name: 'Explorer' });
    St.applyStartLevel(draft.startLevel);
    confetti(70); sfx('levelup');
    onDone();
  };
  backBtn.onclick = () => { sfx('tap'); step = Math.max(0, step - 1); paint(); };

  paint();
  return root;
}

/* ============================================================
   TOP BAR (shared)
   ============================================================ */
export function topBar({ light = false } = {}) {
  const S = St.state();
  St.refreshHearts();
  return `<div class="topbar ${light ? 'on-light' : ''}">
    <div class="stat-chip">${heartSvg()}<span>${St.unlimited() ? '∞' : S.hearts}</span></div>
    <div class="stat-chip">${starSvg()}<span>${S.stars}</span></div>
    <div class="spacer"></div>
    <div class="stat-chip" style="color:${light ? '#FF7A29' : 'inherit'}">${ICONS.flame}<span>${S.streak}</span></div>
  </div>`;
}

/* ============================================================
   MAP
   ============================================================ */
export function MapScreen({ onLesson }) {
  const S = St.state();
  // open on the world holding the next lesson to do, not the furthest unlocked one
  const next = LESSONS.find(l => St.isUnlocked(l.id) && !St.lessonStat(l.id))
            || [...LESSONS].reverse().find(l => St.isUnlocked(l.id));
  let world = next ? next.world : 0;

  const root = h(`<div class="screen"><div class="scroll pad-b" data-scroll></div></div>`);
  const scr = root.querySelector('[data-scroll]');

  function paint() {
    const W = WORLDS[world];
    scr.style.background = `linear-gradient(180deg,${W.sky} 0%,${W.color} 22%,${W.dark} 100%)`;
    const list = lessonsOfWorld(world);
    scr.innerHTML = `
      ${topBar()}
      <div class="world-tabs">${WORLDS.map((w, i) => {
        const open = lessonsOfWorld(i).some(l => St.isUnlocked(l.id));
        return `<button class="wtab ${i === world ? 'on' : ''}" data-w="${i}">${open ? '' : '🔒 '}${w.label} · ${w.name}</button>`;
      }).join('')}</div>
      <div class="world-pill">${['🌳','🏜️','🌊'][world]} ${esc(W.name)} · ${list.filter(l => St.lessonStat(l.id)).length}/${list.length} done</div>
      <div class="map-canvas" data-canvas>
        <svg class="path-line" data-path></svg>
        ${list.map((l, i) => {
          const st = St.lessonStat(l.id);
          const open = St.isUnlocked(l.id);
          const off = [0, 26, 6, -24, -6, 22][i % 6];
          return `<div class="node-wrap" style="margin:16px 0;transform:translateX(${off}%)">
            <button class="node ${open ? '' : 'locked'}" data-l="${l.id}" style="background:${open ? l.color : ''}">
              ${st && st.stars ? `<span class="badge">${st.stars}★</span>` : ''}
              ${open && !st ? '<span class="ring"></span>' : ''}
              <span class="emoji">${open ? l.icon : '🔒'}</span>
            </button>
            <div class="node-label">${esc(l.title)}</div>
          </div>`;
        }).join('')}
      </div>
      <div class="pad" style="padding-top:0">
        <div class="card" style="display:flex;align-items:center;gap:12px">
          ${mascot(S.avatar).replace('class="mascot-svg"', 'class="mascot-svg float" style="width:64px;height:64px"')}
          <div style="flex:1">
            <b style="font-size:16px">${dailyLine()}</b>
            <div class="subtitle" style="font-size:13px">${todayXp()} XP today · goal ${goalXp()} XP</div>
            <div class="meter"><i style="width:${Math.min(100, todayXp() / goalXp() * 100)}%"></i></div>
          </div>
        </div>
      </div>`;
    requestAnimationFrame(() => drawPath(scr.querySelector('[data-canvas]')));
  }

  on(root, '[data-w]', b => { world = +b.dataset.w; paint(); });
  on(root, '[data-l]', b => {
    const l = LESSONS.find(x => x.id === b.dataset.l);
    if (!St.isUnlocked(l.id)) { toast('Finish the lesson before this one first.'); return; }
    openLessonSheet(l, onLesson);
  });

  paint();
  root.refresh = paint;
  return root;
}

function drawPath(canvas) {
  if (!canvas) return;
  const svg = canvas.querySelector('[data-path]');
  const nodes = [...canvas.querySelectorAll('.node')];
  if (!svg || nodes.length < 2) return;
  const cb = canvas.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${cb.width} ${cb.height}`);
  svg.setAttribute('width', cb.width); svg.setAttribute('height', cb.height);
  const pts = nodes.map(n => { const r = n.getBoundingClientRect();
    return [r.left - cb.left + r.width / 2, r.top - cb.top + r.height / 2]; });
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], my = (y0 + y1) / 2;
    d += ` C ${x0} ${my}, ${x1} ${my}, ${x1} ${y1}`;
  }
  svg.innerHTML = `<path d="${d}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="14"
    stroke-linecap="round" stroke-dasharray="2 26"/>`;
}

const todayXp = () => St.state().days[St.dayKey()] || 0;
const goalXp = () => (GOALS.find(g => g.id === St.state().goal) || GOALS[1]).xp;
function dailyLine() {
  const p = todayXp() / goalXp();
  if (p >= 1) return 'Daily goal smashed! 🎉';
  if (p > 0)  return 'Keep going, nearly there!';
  const s = St.state().streak;
  return s > 0 ? `Day ${s} of your streak 🔥` : 'Ready to talk out loud?';
}

function openLessonSheet(l, onLesson) {
  const st = St.lessonStat(l.id);
  const s = sheet(`
    <div class="sheet-icon" style="background:${l.color}22">${l.icon}</div>
    <h2 class="title" style="text-align:center">${esc(l.title)}</h2>
    <p class="subtitle" style="text-align:center;margin-top:6px">
      ${WORLDS[l.world].name} · 18 stages · ${l.words.length} words<br>
      ${st ? `Best ${st.best}% · ${st.stars}★ · played ${st.plays}×` : 'You have not tried this yet'}</p>
    <div class="wordchips">${l.words.map(w => `<span class="chip">${w.e} ${esc(w.w)}</span>`).join('')}</div>
    <div class="notice"><span class="big">🎤</span><div>Every few stages you will speak out loud.
      The pass mark climbs as you go.</div></div>
    <button class="btn green" data-go>${st ? 'Practise again' : 'Start lesson'}</button>
    <div style="height:10px"></div>
    <button class="btn ghost" data-preview>Hear all the words</button>`);
  s.body.querySelector('[data-go]').onclick = () => { sfx('tap'); s.close(); onLesson(l); };
  s.body.querySelector('[data-preview]').onclick = async () => {
    sfx('tap');
    for (const w of l.words) { if (!document.body.contains(s.el)) return; say(w.w, { rate: .8 }); await wait(1050); }
  };
}

/* ============================================================
   TRAINING
   ============================================================ */
const GAMES = [
  { id:'gym',   name:'Pronunciation<br>Gym',  color:'#26C1FC', mascot:'rhino', wide:true,
    sub:'Speak · get a score' },
  { id:'listen',name:'Listening',             color:'#BF8FFD', mascot:'bunny' },
  { id:'build', name:'Word<br>Constructor',   color:'#FFB525', mascot:'fox' },
  { id:'w2t',   name:'Word →<br>Translation', color:'#8DD54F', mascot:'frog' },
  { id:'t2w',   name:'Translation<br>→ Word', color:'#FF8AD1', mascot:'bear' },
  { id:'mixed', name:'Brainstorm',            color:'#FF7A6B', mascot:'deer', wide:true,
    sub:'A bit of everything' }
];

export function TrainingScreen({ onGame }) {
  const known = Object.keys(St.state().mastery).length;
  const root = h(`<div class="screen"><div class="scroll pad-b"
    style="background:linear-gradient(180deg,#2FB6F5,#1E9AE0 30%,var(--bg) 30%)">
    ${topBar()}
    <div class="pad" style="padding-top:0">
      <h2 class="title" style="color:#fff">Training</h2>
      <p class="subtitle" style="color:rgba(255,255,255,.85);margin:4px 0 16px">
        Short drills built from the words you know${known ? ` (${known})` : ''}.</p>
      <div class="games">
        ${GAMES.map(g => g.wide
          ? `<button class="game wide" data-g="${g.id}" style="background:${g.color}">
               <b>${g.name.replace(/<br>/g, ' ')}<span class="sub">${esc(g.sub || '')}</span></b>
               ${mascot(g.mascot)}
             </button>`
          : `<button class="game" data-g="${g.id}" style="background:${g.color}">
               <span class="count">${esc(g.sub || 'Quick drill')}</span>
               ${mascot(g.mascot)}
               <b>${g.name}</b>
             </button>`).join('')}
      </div>
      <div class="section-h"><h3>Your weakest words</h3></div>
      <div class="card tight">
        ${weakList()}
      </div>
    </div></div></div>`);
  on(root, '[data-g]', b => onGame(b.dataset.g));
  return root;
}

function weakList() {
  const m = St.state().mastery;
  const rows = Object.entries(m).sort((a, b) => a[1].m - b[1].m).slice(0, 5);
  if (!rows.length) return `<div class="empty" style="padding:18px"><span class="big">🌱</span>Speak in a lesson and your words appear here.</div>`;
  return rows.map(([w, r]) => `<div class="mrow" style="box-shadow:none;padding:8px 4px">
    <div style="flex:1"><b>${esc(w)}</b><small>best ${r.best}% · ${r.n} tries</small></div>
    ${ring(clamp(r.m, 0, 1), { color: r.m >= .8 ? '#2FCB6E' : r.m >= .5 ? '#FFC61A' : '#FF5D7D' })}</div>`).join('');
}

/* ============================================================
   MINI GAMES  (incl. Pronunciation Gym)
   ============================================================ */
export function GameScreen(kind, { onExit }) {
  const deck = practiceDeck(St.state().mastery, kind === 'gym' ? 10 : 12);
  if (!deck.length) { const r = h(`<div class="screen"><div class="empty">Nothing to practise yet.</div></div>`); return r; }
  let i = 0, right = 0, totalScore = [], alive = true;
  const lang = St.state().nativeLang;

  const root = h(`<div class="screen">
    <div class="ex pale">
      <div class="ex-top">
        <button class="icon-btn light" data-quit>${ICONS.close}</button>
        <div class="pbar"><i style="width:0%"></i></div>
        <div class="stat-chip" style="background:#fff;box-shadow:var(--sh)">${starSvg()}<span data-sc>0</span></div>
      </div>
      <div class="stage-tag" style="color:var(--ink-3)"></div>
      <div class="ex-body"></div>
      <div class="ex-foot"></div>
    </div></div>`);
  const body = root.querySelector('.ex-body'), foot = root.querySelector('.ex-foot');
  const bar = root.querySelector('.pbar i'), tag = root.querySelector('.stage-tag');
  const scEl = root.querySelector('[data-sc]');
  let raf = null, timers = [];
  const later = (f, ms) => { const t = setTimeout(f, ms); timers.push(t); return t; };
  root.cleanup = () => { alive = false; timers.forEach(clearTimeout); if (raf) cancelAnimationFrame(raf); stopSpeaking(); recognizer.abort(); recognizer.releaseMic(); };
  root.querySelector('[data-quit]').onclick = () => { sfx('tap'); root.cleanup(); onExit(); };

  const kinds = ['listen', 'build', 'w2t', 't2w', 'gym'];
  function step() {
    if (!alive) return;
    timers.forEach(clearTimeout); timers = [];
    if (raf) cancelAnimationFrame(raf);
    if (i >= deck.length) return summary();
    bar.style.width = `${(i / deck.length) * 100}%`;
    const w = deck[i];
    const k = kind === 'mixed' ? kinds[(Math.random() * (hasASR ? 5 : 4)) | 0] : kind;
    tag.textContent = `${{ gym:'Pronunciation Gym', listen:'Listening', build:'Word Constructor',
      w2t:'Word → Translation', t2w:'Translation → Word' }[k]} · ${i + 1}/${deck.length}`;
    body.innerHTML = ''; foot.innerHTML = '';
    if (k === 'gym') return gymCard(w);
    if (k === 'build') return buildCard(w);
    return quizCard(w, k);
  }

  const next = (score) => { totalScore.push(score); if (score >= 65) right++; scEl.textContent = right; i++; step(); };

  function gymCard(w) {
    const rec2 = St.masteryOf(w.w);
    body.innerHTML = `<div class="prompt">Say it clearly</div>
      <div class="prompt-sub">${rec2 ? `your best so far ${rec2.best}%` : 'first attempt'}</div>
      <div class="picture">${w.e}</div>
      <div class="target-word">${esc(w.w)}</div>
      <div class="target-trans">${esc((w.t && w.t[lang]) || '')}</div>
      <div class="btn-row" style="justify-content:center;margin-top:12px">
        <button class="btn ghost sm" data-play>${ICONS.sound} Hear it</button>
        <button class="btn ghost sm" data-slow>Slowly</button></div>
      <div class="mic-zone"><div class="wave" data-wave style="color:var(--blue)">${'<i></i>'.repeat(9)}</div>
        <button class="mic-btn" data-mic>${ICONS.mic}</button>
        <div class="mic-hint" data-hint>${hasASR ? 'Tap the mic' : 'Speech scoring is not available in this browser'}</div>
        <div data-res></div></div>`;
    body.querySelector('[data-play]').onclick = () => say(w.w, { rate: St.state().settings.rate });
    body.querySelector('[data-slow]').onclick = () => say(w.w, { rate: .5 });
    foot.innerHTML = `<button class="btn ghost" data-skip>Skip</button>`;
    foot.querySelector('[data-skip]').onclick = () => { sfx('tap'); next(0); };
    const waveEl = body.querySelector('[data-wave]'), hintEl = body.querySelector('[data-hint]'), res = body.querySelector('[data-res]');
    body.querySelector('[data-mic]').onclick = async function () {
      if (!hasASR) return toast('Try Chrome, Edge or Safari to get a score.');
      const btn = this; btn.classList.add('rec'); hintEl.textContent = 'Listening…'; sfx('recStart'); unlockAudio();
      wave(waveEl, () => recognizer.level());
      try {
        await recognizer.warmMic();
        const r = await recognizer.listen({ maxMs: 6500, onInterim: t => hintEl.textContent = t ? `“${t}”` : 'Listening…' });
        btn.classList.remove('rec'); stopW(waveEl); sfx('recStop');
        const sc = scorePronunciation(w.w, r.alternatives);
        St.recordWord(w.w, sc.score, w.lesson);
        St.bumpStat('gymReps');
        hintEl.textContent = sc.tip;
        res.innerHTML = `<div class="result"><div class="result-head">${gauge(sc.score, { track:'#EDF3F9' })}
          <div style="flex:1"><b style="font-size:19px">${sc.score >= 80 ? 'Great!' : sc.score >= 60 ? 'Good' : 'Try again'}</b>
          <div class="heardline">${sc.heard ? `I heard “${esc(sc.heard)}”` : 'Nothing heard'}</div></div></div></div>`;
        sfx(sc.score >= 80 ? 'correct' : 'retry');
        St.checkAchievements();
        foot.innerHTML = `<button class="btn green" data-n>Next word</button><div style="height:10px"></div>
          <button class="btn ghost" data-r>Say it again</button>`;
        foot.querySelector('[data-n]').onclick = () => { sfx('tap'); next(sc.score); };
        foot.querySelector('[data-r]').onclick = () => { sfx('tap'); res.innerHTML = ''; foot.innerHTML = `<button class="btn ghost" data-skip>Skip</button>`;
          foot.querySelector('[data-skip]').onclick = () => next(sc.score); };
      } catch (e) {
        btn.classList.remove('rec'); stopW(waveEl);
        toast(e.message || 'Mic problem');
      }
    };
  }

  function quizCard(w, k) {
    const pool = allWords().filter(x => x.w !== w.w);
    const tr = x => (x.t && x.t[lang]) || x.w;
    let q, correct, opts;
    if (k === 'listen') { q = `<button class="mic-btn" data-play style="margin:20px auto;color:var(--blue)">${ICONS.sound}</button>`;
      correct = w.w; opts = shuffle([w.w, ...shuffle(pool).slice(0, 3).map(x => x.w)]); }
    else if (k === 'w2t') { q = `<div class="picture">${w.e}</div><div class="target-word">${esc(w.w)}</div>`;
      correct = tr(w); opts = shuffle([tr(w), ...shuffle(pool).slice(0, 3).map(tr)]); }
    else { q = `<div class="target-word" style="margin-top:26px">${esc(tr(w))}</div>`;
      correct = w.w; opts = shuffle([w.w, ...shuffle(pool).slice(0, 3).map(x => x.w)]); }

    body.innerHTML = `<div class="prompt">${k === 'listen' ? 'Which word did you hear?' : k === 'w2t' ? 'What does it mean?' : 'Which English word is it?'}</div>
      ${q}<div class="opts two" data-opts>${opts.map(o => `<button class="opt" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
    if (k === 'listen') { body.querySelector('[data-play]').onclick = () => say(w.w, { rate: .85 }); later(() => say(w.w, { rate: .85 }), 350); }
    foot.innerHTML = `<button class="btn ghost" data-skip>Skip</button>`;
    foot.querySelector('[data-skip]').onclick = () => next(0);
    let done = false;
    body.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
      if (done) return; done = true;
      const ok = b.dataset.o === correct;
      b.classList.add(ok ? 'ok' : 'no'); sfx(ok ? 'correct' : 'wrong'); haptic(ok ? 12 : 28);
      if (!ok) body.querySelector(`[data-o="${CSS.escape(correct)}"]`).classList.add('ok');
      later(() => next(ok ? 100 : 0), 700);
    });
  }

  function buildCard(w) {
    const target = w.w;
    let filled = [];
    const letters = shuffle([...target.split(''), ...shuffle('abcdeilmnoprstu'.split('').filter(c => !target.includes(c))).slice(0, 2)]);
    body.innerHTML = `<div class="prompt">Build the word</div>
      <div class="picture">${w.e}</div><div class="slots" data-slots></div>
      <div class="tiles">${letters.map((c, n) => `<button class="tile" data-i="${n}">${esc(c)}</button>`).join('')}</div>`;
    const slotsEl = body.querySelector('[data-slots]');
    const paint = () => slotsEl.innerHTML = target.split('').map((_, n) =>
      `<div class="slot ${filled[n] ? 'f' : ''}">${filled[n] ? esc(filled[n].c) : ''}</div>`).join('');
    paint();
    foot.innerHTML = `<button class="btn ghost" data-skip>Skip</button>`;
    foot.querySelector('[data-skip]').onclick = () => next(0);
    body.querySelectorAll('.tile').forEach(t => t.onclick = () => {
      if (filled.length >= target.length) return;
      filled.push({ c: t.textContent, i: t.dataset.i }); t.classList.add('used'); sfx('tap'); paint();
      if (filled.length === target.length) {
        const ok = filled.map(f => f.c).join('') === target;
        sfx(ok ? 'correct' : 'wrong');
        slotsEl.querySelectorAll('.slot').forEach(s => s.style.background = ok ? '#2FCB6E' : '#FF5D7D');
        if (ok) say(target, { rate: .85 });
        later(() => next(ok ? 100 : 0), 850);
      }
    });
  }

  function summary() {
    const avg = Math.round(totalScore.reduce((a, b) => a + b, 0) / Math.max(1, totalScore.length));
    const coin = 10 + right * 4;
    St.addStars(coin); St.addXp(6 + right * 2); St.touchDay(); St.checkAchievements();
    if (avg >= 70) confetti(60);
    bar.style.width = '100%';
    tag.textContent = 'Done';
    body.innerHTML = `<div class="picture">${avg >= 80 ? '🏆' : avg >= 55 ? '👏' : '💪'}</div>
      <div class="target-word">${right}/${deck.length}</div>
      <div class="target-trans">average ${avg}%</div>
      <div class="reward" style="margin-top:18px"><div><b>+${coin}</b><small>Stars</small></div>
        <div><b>+${6 + right * 2}</b><small>XP</small></div></div>`;
    foot.innerHTML = `<button class="btn green" data-again>Play again</button><div style="height:10px"></div>
      <button class="btn ghost" data-out>Back to training</button>`;
    foot.querySelector('[data-again]').onclick = () => { i = 0; right = 0; totalScore = []; scEl.textContent = 0; step(); };
    foot.querySelector('[data-out]').onclick = () => { root.cleanup(); onExit(); };
  }

  function wave(el, level) {
    const bars = [...el.querySelectorAll('i')], t0 = Date.now();
    const loop = () => { if (!alive || !el.isConnected) return;
      const lv = level(), t = (Date.now() - t0) / 1000;
      bars.forEach((b, n) => { const v = lv >= 0 ? lv * (.55 + .45 * Math.sin(t * 9 + n)) : .35 + .3 * Math.sin(t * 5 + n * .7);
        b.style.height = `${6 + Math.max(0, v) * 38}px`; });
      el._raf = requestAnimationFrame(loop); };
    loop();
  }
  const stopW = el => { if (el._raf) cancelAnimationFrame(el._raf); el.querySelectorAll('i').forEach(b => b.style.height = '6px'); };

  step();
  return root;
}

/* ============================================================
   DICTIONARY
   ============================================================ */
export function DictionaryScreen({ onPractise }) {
  let q = '', filter = 'all';
  const lang = St.state().nativeLang;
  const root = h(`<div class="screen"><div class="scroll pad-b"
    style="background:linear-gradient(180deg,#2FB6F5,#1E9AE0 22%,var(--bg) 22%)" data-s></div></div>`);
  const s = root.querySelector('[data-s]');

  function rows() {
    const m = St.state().mastery;
    let list = allWords().map(w => ({ ...w, rec: m[w.w.toLowerCase()] || null }));
    if (filter === 'learning') list = list.filter(x => x.rec && x.rec.m < .8);
    if (filter === 'mastered') list = list.filter(x => x.rec && x.rec.m >= .8);
    if (filter === 'new') list = list.filter(x => !x.rec);
    if (q) { const n = q.toLowerCase();
      list = list.filter(x => x.w.includes(n) || Object.values(x.t || {}).some(t => t.toLowerCase().includes(n))); }
    if (!list.length) return `<div class="empty"><span class="big">🔍</span>No words here yet.</div>`;
    return list.slice(0, 200).map(x => `<div class="mrow">
      <div style="font-size:26px">${x.e}</div>
      <div style="flex:1"><b>${esc(x.w)}</b><small>${esc((x.t && x.t[lang]) || Object.values(x.t || {})[0] || '')}${x.rec ? ` · best ${x.rec.best}%` : ''}</small></div>
      <button class="icon-btn light" data-say="${esc(x.w)}">${ICONS.sound}</button>
      <button class="icon-btn light" data-prac="${esc(x.w)}" style="color:var(--blue)">${ICONS.mic}</button>
      ${x.rec ? ring(clamp(x.rec.m, 0, 1), { color: x.rec.m >= .8 ? '#2FCB6E' : x.rec.m >= .5 ? '#FFC61A' : '#FF5D7D' })
              : `<div style="width:34px;text-align:center;color:var(--ink-3);font-size:12px;font-weight:900">new</div>`}
    </div>`).join('');
  }

  function paint() {
    const d = St.dictStats();
    s.innerHTML = `${topBar()}
      <div class="pad" style="padding-top:0">
        <h2 class="title" style="color:#fff;margin-bottom:12px">Dictionary</h2>
        <div class="searchbar">${ICONS.search}<input placeholder="Search a word" value="${esc(q)}" data-q></div>
        <div class="stats3">
          <div class="stat-box"><b>${d.month}</b><small>This month</small></div>
          <div class="stat-box"><b>${d.week}</b><small>This week</small></div>
          <div class="stat-box"><b>${d.today}</b><small>Today</small></div>
        </div>
        <div class="filters">${['all','new','learning','mastered'].map(f =>
          `<button class="filt ${filter === f ? 'on' : ''}" data-f="${f}">${f[0].toUpperCase() + f.slice(1)}</button>`).join('')}</div>
        <div class="mastered">${rows()}</div>
      </div>`;
    const input = s.querySelector('[data-q]');
    input.oninput = e => { q = e.target.value; const pos = e.target.selectionStart; paint();
      const i2 = s.querySelector('[data-q]'); i2.focus(); i2.setSelectionRange(pos, pos); };
  }
  on(root, '[data-f]', b => { filter = b.dataset.f; paint(); });
  on(root, '[data-say]', b => say(b.dataset.say, { rate: .85 }));
  on(root, '[data-prac]', b => onPractise(b.dataset.prac));
  paint();
  root.refresh = paint;
  return root;
}

/* single word practice popup, launched from the dictionary */
export function practiceWord(word) {
  const w = allWords().find(x => x.w === word);
  if (!w) return;
  const s = sheet(`<div class="sheet-icon" style="background:#26C1FC22">${w.e}</div>
    <h2 class="title" style="text-align:center">${esc(w.w)}</h2>
    <p class="subtitle" style="text-align:center">${esc(Object.values(w.t || {})[0] || '')}</p>
    <div class="btn-row" style="justify-content:center;margin:14px 0">
      <button class="btn ghost sm" data-play>${ICONS.sound} Hear it</button>
      <button class="btn ghost sm" data-slow>Slowly</button></div>
    <div class="mic-zone" style="margin-top:0">
      <div class="wave" data-wave style="color:var(--blue)">${'<i></i>'.repeat(9)}</div>
      <button class="mic-btn" data-mic>${ICONS.mic}</button>
      <div class="mic-hint" data-hint style="color:var(--ink-2)">${hasASR ? 'Tap and say it' : 'No speech scoring in this browser'}</div>
      <div data-res style="width:100%"></div></div>`);
  const b = s.body;
  b.querySelector('[data-play]').onclick = () => say(w.w, { rate: .85 });
  b.querySelector('[data-slow]').onclick = () => say(w.w, { rate: .5 });
  const waveEl = b.querySelector('[data-wave]'), hintEl = b.querySelector('[data-hint]'), res = b.querySelector('[data-res]');
  let raf = null;
  const stop = () => { if (raf) cancelAnimationFrame(raf); waveEl.querySelectorAll('i').forEach(x => x.style.height = '6px'); };
  b.querySelector('[data-mic]').onclick = async function () {
    if (!hasASR) return toast('Try Chrome, Edge or Safari for scoring.');
    const btn = this; btn.classList.add('rec'); hintEl.textContent = 'Listening…'; sfx('recStart'); unlockAudio();
    const bars = [...waveEl.querySelectorAll('i')], t0 = Date.now();
    const loop = () => { const lv = recognizer.level(), t = (Date.now() - t0) / 1000;
      bars.forEach((x, n) => { const v = lv >= 0 ? lv * (.55 + .45 * Math.sin(t * 9 + n)) : .35 + .3 * Math.sin(t * 5 + n * .7);
        x.style.height = `${6 + Math.max(0, v) * 38}px`; });
      raf = requestAnimationFrame(loop); };
    loop();
    try {
      await recognizer.warmMic();
      const r = await recognizer.listen({ maxMs: 6000, onInterim: t => hintEl.textContent = t ? `“${t}”` : 'Listening…' });
      btn.classList.remove('rec'); stop(); sfx('recStop');
      const sc = scorePronunciation(w.w, r.alternatives);
      St.recordWord(w.w, sc.score, w.lesson); St.bumpStat('gymReps'); St.checkAchievements();
      hintEl.textContent = sc.tip;
      res.innerHTML = `<div class="result" style="background:#F3F8FD"><div class="result-head">
        ${gauge(sc.score, { track: '#E4EDF6' })}<div style="flex:1"><b style="font-size:18px">${sc.score}%</b>
        <div class="heardline">${sc.heard ? `I heard “${esc(sc.heard)}”` : 'Nothing heard'}</div></div></div></div>`;
      sfx(sc.score >= 80 ? 'correct' : 'retry');
    } catch (e) { btn.classList.remove('rec'); stop(); toast(e.message || 'Mic problem'); }
  };
  s.el.addEventListener('click', e => { if (e.target === s.el) { stop(); recognizer.abort(); } });
}

/* ============================================================
   PROFILE
   ============================================================ */
export function ProfileScreen({ onReset }) {
  const root = h(`<div class="screen"><div class="scroll pad-b" data-s></div></div>`);
  const s = root.querySelector('[data-s]');

  function paint() {
    const S = St.state();
    const lp = St.levelProgress();
    const dstat = St.dictStats();
    const mastered = Object.values(S.mastery).filter(r => r.m >= .8).length;
    const acc = S.stats.attempts ? Math.round(S.stats.correct / S.stats.attempts * 100) : 0;
    s.innerHTML = `
      <div class="prof-hero">
        ${topBar()}
        <div class="avatar">${mascot(S.avatar)}<span class="lvl">${lp.lv}</span></div>
        <div class="pname">${esc(S.name)}</div>
        <div style="text-align:center;font-size:13px;font-weight:800;opacity:.9;margin-top:2px">
          ${S.xp} XP · ${lp.hi - S.xp} XP to level ${lp.lv + 1}</div>
        <div class="meter" style="background:rgba(255,255,255,.25);margin:10px 24px 0">
          <i style="width:${lp.pct * 100}%;background:#FFD84D"></i></div>
        <div class="week">${St.weekDays().map(d => `<div class="day ${d.xp ? 'on' : ''} ${d.today ? 'today' : ''}">
          ${d.letter}<b>${d.num}</b></div>`).join('')}</div>
      </div>
      <div class="pad">
        <div class="section-h"><h3>Speaking skills</h3></div>
        <div class="card">
          <div class="skillrow"><span>Words spoken</span><small>${S.stats.spoken}</small></div>
          <div class="meter"><i style="width:${Math.min(100, S.stats.spoken / 200 * 100)}%"></i></div>
          <div style="height:14px"></div>
          <div class="skillrow"><span>Accuracy</span><small>${acc}%</small></div>
          <div class="meter"><i style="width:${acc}%;background:var(--blue)"></i></div>
          <div style="height:14px"></div>
          <div class="skillrow"><span>Words mastered</span><small>${mastered} / ${dstat.total || 0}</small></div>
          <div class="meter"><i style="width:${dstat.total ? mastered / dstat.total * 100 : 0}%;background:var(--yellow)"></i></div>
        </div>

        <div class="section-h"><h3>Achievements</h3>
          <span class="spacer"></span><small style="color:var(--ink-3);font-weight:900">${S.achievements.length}/${ACHIEVEMENTS.length}</small></div>
        <div class="card"><div class="skills">
          ${ACHIEVEMENTS.map(a => { const got = S.achievements.includes(a.id);
            return `<div class="hex ${got ? 'on' : ''}" data-ach="${a.id}" title="${esc(a.name)}">
              ${got ? a.icon : '<span class="q">?</span>'}</div>`; }).join('')}
        </div></div>

        <div class="section-h"><h3>Worlds</h3></div>
        <div class="card tight">
          ${WORLDS.map((w, i) => { const list = lessonsOfWorld(i);
            const done = list.filter(l => St.lessonStat(l.id)).length;
            return `<div class="mrow" style="box-shadow:none;padding:8px 4px">
              <div style="font-size:24px">${['🌳','🏜️','🌊'][i]}</div>
              <div style="flex:1"><b>${w.name}</b><small>${done}/${list.length} lessons</small></div>
              ${ring(done / list.length, { color: w.color })}</div>`; }).join('')}
        </div>

        <div class="section-h"><h3>Settings</h3></div>
        <div class="card">
          ${toggleRow('sfx', 'Sound effects', S.settings.sfx)}
          ${toggleRow('meter', 'Mic waveform', S.settings.meter)}
          <div class="skillrow" style="margin-top:14px"><span>Model voice speed</span>
            <small>${S.settings.rate.toFixed(2)}×</small></div>
          <input type="range" min="0.5" max="1.1" step="0.05" value="${S.settings.rate}" data-rate style="width:100%;margin-top:6px">
          <div class="skillrow" style="margin-top:14px"><span>Pass mark</span></div>
          <div class="filters" style="margin-top:8px">
            ${['easy','normal','strict'].map(k => `<button class="filt ${S.settings.strict === k ? 'on' : ''}" data-strict="${k}">
              ${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}
          </div>
          <div style="height:14px"></div>
          <div class="skillrow"><span>Speech engine</span>
            <small>${hasASR ? (isIOS ? 'Safari / on-device' : 'Browser ASR') : 'not available'}</small></div>
          <div class="skillrow" style="margin-top:6px"><span>Secure context</span>
            <small>${isSecure ? 'yes' : 'no — mic blocked'}</small></div>
          <div style="height:16px"></div>
          <button class="btn ghost" data-reset>Reset all progress</button>
        </div>
      </div>`;

    s.querySelector('[data-rate]').oninput = e => { St.setSetting('rate', +e.target.value);
      e.target.previousElementSibling.querySelector('small').textContent = (+e.target.value).toFixed(2) + '×'; };
    s.querySelector('[data-rate]').onchange = e => say('This is my speaking speed', { rate: +e.target.value });
  }

  on(root, '[data-toggle]', b => { const k = b.dataset.toggle; St.setSetting(k, !St.state().settings[k]); paint(); });
  on(root, '[data-strict]', b => { St.setSetting('strict', b.dataset.strict); paint(); toast(`Pass mark set to ${b.dataset.strict}`); });
  on(root, '[data-ach]', b => { const a = ACHIEVEMENTS.find(x => x.id === b.dataset.ach);
    const got = St.state().achievements.includes(a.id);
    toast(`${got ? a.icon : '🔒'} ${a.name} — ${a.desc}`); });
  on(root, '[data-reset]', () => {
    const m = modal(`<h3>Reset everything?</h3><p>All stars, streaks and words will be cleared.</p>
      <button class="btn coral" data-yes>Yes, reset</button><div style="height:10px"></div>
      <button class="btn ghost" data-no>Cancel</button>`);
    m.el.querySelector('[data-yes]').onclick = () => { m.close(); St.reset(); onReset(); };
    m.el.querySelector('[data-no]').onclick = m.close;
  });

  paint();
  root.refresh = paint;
  return root;
}

const toggleRow = (key, label, on_) => `<div class="skillrow" style="margin-bottom:10px">
  <span>${label}</span>
  <button data-toggle="${key}" style="width:52px;height:30px;border-radius:99px;background:${on_ ? 'var(--green)' : '#DCE6F0'};
    position:relative;transition:background .2s">
    <span style="position:absolute;top:3px;left:${on_ ? 25 : 3}px;width:24px;height:24px;border-radius:50%;
      background:#fff;transition:left .2s;box-shadow:0 2px 5px rgba(0,0,0,.2)"></span></button></div>`;
