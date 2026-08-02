/* ============================================================
   Chirp — bootstrap + router
   ============================================================ */
import { h, $, sfx, toast, modal, esc } from './ui.js';
import { ICONS } from './svg.js';
import { unlockAudio, stopSpeaking } from './audio.js';
import { hasASR, isSecure } from './speech.js';
import * as St from './state.js';
import { Onboarding, MapScreen, TrainingScreen, DictionaryScreen, ProfileScreen, GameScreen, practiceWord } from './screens.js';
import { LessonScreen, CompleteScreen, recognizer } from './exercise.js';

const app = $('#app');
let current = null, currentTab = 'map', tabbar = null;

function clear() {
  if (current && current.cleanup) { try { current.cleanup(); } catch (_) {} }
  stopSpeaking();
  app.innerHTML = '';
  current = null;
}

function mount(node, { tabs = false } = {}) {
  clear();
  current = node;
  app.appendChild(node);
  if (tabs) app.appendChild(tabbar = buildTabs());
  window.scrollTo(0, 0);
}

/* ---------- tab bar ---------- */
const TABS = [
  { id: 'map',   icon: 'map',  label: 'Learn' },
  { id: 'train', icon: 'game', label: 'Train' },
  { id: 'dict',  icon: 'az',   label: 'Words' },
  { id: 'me',    icon: 'book', label: 'Me' }
];
function buildTabs() {
  const el = h(`<nav class="tabbar">${TABS.map(t => `<button class="tab ${t.id === currentTab ? 'on' : ''}" data-t="${t.id}">
    ${ICONS[t.icon]}<span>${t.label}</span></button>`).join('')}</nav>`);
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    sfx('tap'); go(b.dataset.t);
  });
  return el;
}

/* ---------- routes ---------- */
export function go(tab) {
  currentTab = tab;
  history.replaceState({ tab }, '', `#${tab}`);
  switch (tab) {
    case 'map':   return mount(MapScreen({ onLesson: startLesson }), { tabs: true });
    case 'train': return mount(TrainingScreen({ onGame: startGame }), { tabs: true });
    case 'dict':  return mount(DictionaryScreen({ onPractise: practiceWord }), { tabs: true });
    case 'me':    return mount(ProfileScreen({ onReset: boot }), { tabs: true });
  }
}

function startLesson(lesson) {
  St.refreshHearts();
  if (!St.hasHearts()) {
    const m = modal(`<div style="font-size:44px">💔</div><h3>No hearts left</h3>
      <p>Hearts refill on their own, or buy some with stars (you have ${St.state().stars}).</p>
      <button class="btn green" data-buy>Buy 5 hearts · 300 ⭐️</button><div style="height:10px"></div>
      <button class="btn ghost" data-close>Wait it out</button>`);
    m.el.querySelector('[data-buy]').onclick = () => {
      if (St.buyHearts(5, 300)) { m.close(); startLesson(lesson); } else toast('Not enough stars.');
    };
    m.el.querySelector('[data-close]').onclick = m.close;
    return;
  }
  unlockAudio();
  mount(LessonScreen(lesson, {
    onExit: () => go('map'),
    onFinish: res => mount(CompleteScreen(res, {
      onHome: () => go('map'),
      onAgain: () => startLesson(lesson)
    }))
  }));
}

function startGame(kind) {
  unlockAudio();
  mount(GameScreen(kind, { onExit: () => go('train') }));
}

/* ---------- boot ---------- */
function boot() {
  St.refreshHearts();
  if (!St.state().onboarded) {
    mount(Onboarding({ onDone: () => { firstRunTips(); go('map'); } }));
  } else {
    go(location.hash.replace('#', '') || 'map');
    setTimeout(firstRunTips, 600);
  }
}

function firstRunTips() {
  if (sessionStorage.getItem('chirp.tips')) return;
  sessionStorage.setItem('chirp.tips', '1');
  if (!isSecure) {
    modal(`<div style="font-size:40px">🔒</div><h3>Open over https</h3>
      <p>Browsers only allow the microphone on <b>https</b> or <b>localhost</b>.
      Everything else works, but speaking will be disabled here.</p>
      <button class="btn" data-ok>Understood</button>`).el.querySelector('[data-ok]')
      .onclick = () => document.querySelector('.modal-bg').remove();
    return;
  }
  if (!hasASR) {
    modal(`<div style="font-size:40px">🎤</div><h3>Speech scoring not available</h3>
      <p>This browser has no speech recognition. Chirp will still record you so you can compare with the model voice.
      For scores, use Chrome, Edge or Safari.</p>
      <button class="btn" data-ok>Got it</button>`).el.querySelector('[data-ok]')
      .onclick = () => document.querySelector('.modal-bg').remove();
  }
}

/* keep hearts / streak fresh when the app returns to the foreground */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    St.refreshHearts();
    if (current && current.refresh) current.refresh();
  } else {
    stopSpeaking(); recognizer.abort();
  }
});

window.addEventListener('popstate', () => {
  if (current && current.cleanup) go('map');
});

/* first gesture unlocks WebAudio on iOS */
['pointerdown', 'touchstart', 'keydown'].forEach(ev =>
  window.addEventListener(ev, () => unlockAudio(), { once: true, passive: true }));

/* ---------- PWA ---------- */
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; showInstall(); });
function showInstall() {
  if (!deferredInstall || sessionStorage.getItem('chirp.install.hidden')) return;
  const bar = h(`<div class="toast" style="bottom:calc(100px + var(--safe-b));display:flex;gap:10px;align-items:center">
    <span>Add Chirp to your home screen?</span>
    <button class="btn sm green" data-yes style="padding:7px 12px">Add</button>
    <button data-no style="opacity:.6">✕</button></div>`);
  document.body.appendChild(bar);
  bar.querySelector('[data-yes]').onclick = async () => {
    bar.remove(); deferredInstall.prompt(); deferredInstall = null;
  };
  bar.querySelector('[data-no]').onclick = () => { bar.remove(); sessionStorage.setItem('chirp.install.hidden', '1'); };
}

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

/* expose a little surface for smoke tests */
window.Chirp = { go, state: St.state, reset: () => { St.reset(); boot(); }, startLesson, boot };

boot();
