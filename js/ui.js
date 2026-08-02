/* ============================================================
   Chirp — tiny UI toolkit (no framework)
   ============================================================ */
import { SFX, haptic } from './audio.js';
import { state } from './state.js';

export const $  = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
export function frag(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content;
}
export const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* delegated click with feedback */
export function on(root, sel, fn, { sound = 'tap', buzz = 8 } = {}) {
  root.addEventListener('click', ev => {
    const t = ev.target.closest(sel);
    if (!t || !root.contains(t)) return;
    if (sound && state().settings.sfx) SFX[sound] && SFX[sound]();
    if (buzz) haptic(buzz);
    fn(t, ev);
  });
}

export const sfx = name => { if (state().settings.sfx && SFX[name]) SFX[name](); };

/* ---------- toast ---------- */
let toastTimer = null;
export function toast(msg, ms = 2200) {
  $$('.toast').forEach(t => t.remove());
  const el = h(`<div class="toast">${esc(msg)}</div>`);
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), ms);
}

/* ---------- modal ---------- */
export function modal(inner, { dismissable = true } = {}) {
  const bg = h(`<div class="modal-bg"><div class="modal">${inner}</div></div>`);
  document.body.appendChild(bg);
  const close = () => bg.remove();
  if (dismissable) bg.addEventListener('click', e => { if (e.target === bg) close(); });
  return { el: bg, close, body: bg.querySelector('.modal') };
}

/* ---------- bottom sheet ---------- */
export function sheet(inner) {
  const bg = h(`<div class="sheet-bg"><div class="sheet">${inner}</div></div>`);
  document.body.appendChild(bg);
  const close = () => { bg.remove(); };
  bg.addEventListener('click', e => { if (e.target === bg) close(); });
  return { el: bg, close, body: bg.querySelector('.sheet') };
}

/* ---------- confetti ---------- */
export function confetti(n = 60) {
  const cols = ['#26C1FC', '#BF8FFD', '#FF8AD1', '#FFB525', '#8DD54F', '#FF7A6B'];
  const box = h('<div class="confetti"></div>');
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.style.cssText = `left:${Math.random() * 100}%;top:-20px;background:${cols[(Math.random() * cols.length) | 0]};
      animation-duration:${1.6 + Math.random() * 1.6}s;animation-delay:${Math.random() * .5}s;
      transform:rotate(${Math.random() * 360}deg)`;
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 4200);
}

/* ---------- circular gauge ---------- */
export function gauge(pct, { size = 62, stroke = 7, color = null, track = 'rgba(255,255,255,.3)' } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const col = color || (pct >= 80 ? '#2FCB6E' : pct >= 60 ? '#FFC61A' : '#FF5D7D');
  return `<div class="gauge" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${col}" stroke-width="${stroke}"
              stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}"
              style="transition:stroke-dashoffset .7s cubic-bezier(.2,.9,.3,1)"/>
    </svg><b>${Math.round(pct)}%</b></div>`;
}

export function ring(pct, { size = 34, stroke = 5, color = '#26C1FC' } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#EDF3F9" stroke-width="${stroke}"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}"
      transform="rotate(-90 ${size/2} ${size/2})"/></svg>`;
}

/* ---------- misc ---------- */
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const wait = ms => new Promise(r => setTimeout(r, ms));
export const fmtMs = ms => {
  const s = Math.ceil(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`;
};
