/* ============================================================
   Chirp — inline SVG art library (no external assets)
   ============================================================ */

const EYE = '#2C3E57';

/* ---------- generic cute animal head ---------- */
function head({ fur, fur2, muzzle, ears = '', extras = '', blush = '#FF8AD1', eyeStyle = 'normal' }) {
  const eyes = eyeStyle === 'frog'
    ? `<g>
         <circle cx="42" cy="34" r="15" fill="${fur}"/><circle cx="78" cy="34" r="15" fill="${fur}"/>
         <circle cx="42" cy="34" r="10.5" fill="#fff"/><circle cx="78" cy="34" r="10.5" fill="#fff"/>
         <circle cx="44" cy="35" r="5.4" fill="${EYE}"/><circle cx="80" cy="35" r="5.4" fill="${EYE}"/>
         <circle cx="45.6" cy="33" r="2" fill="#fff"/><circle cx="81.6" cy="33" r="2" fill="#fff"/>
       </g>`
    : `<g>
         <ellipse cx="46" cy="60" rx="6.6" ry="8.4" fill="${EYE}"/>
         <ellipse cx="74" cy="60" rx="6.6" ry="8.4" fill="${EYE}"/>
         <circle cx="48.4" cy="57" r="2.5" fill="#fff"/>
         <circle cx="76.4" cy="57" r="2.5" fill="#fff"/>
       </g>`;
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" class="mascot-svg" aria-hidden="true">
    ${extras}
    ${ears}
    <ellipse cx="60" cy="63" rx="38" ry="34" fill="${fur}"/>
    <ellipse cx="60" cy="70" rx="27" ry="22" fill="${fur2}"/>
    <ellipse cx="60" cy="79" rx="17" ry="12" fill="${muzzle}"/>
    ${eyes}
    <ellipse cx="29" cy="74" rx="8" ry="5.4" fill="${blush}" opacity=".45"/>
    <ellipse cx="91" cy="74" rx="8" ry="5.4" fill="${blush}" opacity=".45"/>
    <ellipse cx="60" cy="73" rx="5.6" ry="4.2" fill="${EYE}"/>
    <path d="M60 77 v4 M60 81 q-7 6 -12 0 M60 81 q7 6 12 0" fill="none" stroke="${EYE}"
          stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

export const MASCOTS = {
  fox: () => head({
    fur: '#FF9A4D', fur2: '#FFB273', muzzle: '#FFF3E4',
    ears: `<path d="M24 46 L30 12 L54 36 Z" fill="#FF8A33"/><path d="M96 46 L90 12 L66 36 Z" fill="#FF8A33"/>
           <path d="M30 42 L33 22 L47 36 Z" fill="#FFD0A8"/><path d="M90 42 L87 22 L73 36 Z" fill="#FFD0A8"/>`
  }),
  bear: () => head({
    fur: '#F5B94C', fur2: '#FFD07A', muzzle: '#FFF0D2',
    ears: `<circle cx="27" cy="32" r="14" fill="#EDA92F"/><circle cx="93" cy="32" r="14" fill="#EDA92F"/>
           <circle cx="27" cy="32" r="7.5" fill="#FFD9A0"/><circle cx="93" cy="32" r="7.5" fill="#FFD9A0"/>`
  }),
  bunny: () => head({
    fur: '#FF9DC9', fur2: '#FFBBDA', muzzle: '#FFF0F6',
    ears: `<ellipse cx="42" cy="18" rx="10" ry="26" fill="#FF8CBF" transform="rotate(-10 42 18)"/>
           <ellipse cx="78" cy="18" rx="10" ry="26" fill="#FF8CBF" transform="rotate(10 78 18)"/>
           <ellipse cx="42" cy="19" rx="5" ry="17" fill="#FFD3E6" transform="rotate(-10 42 19)"/>
           <ellipse cx="78" cy="19" rx="5" ry="17" fill="#FFD3E6" transform="rotate(10 78 19)"/>`
  }),
  deer: () => head({
    fur: '#C08457', fur2: '#D9A176', muzzle: '#F7E3CE',
    extras: `<g stroke="#8A5A34" stroke-width="5.5" stroke-linecap="round" fill="none">
               <path d="M40 36 L32 12 M32 20 L20 12 M34 16 L24 4"/>
               <path d="M80 36 L88 12 M88 20 L100 12 M86 16 L96 4"/>
             </g>`,
    ears: `<ellipse cx="24" cy="48" rx="11" ry="7" fill="#B0774D" transform="rotate(-20 24 48)"/>
           <ellipse cx="96" cy="48" rx="11" ry="7" fill="#B0774D" transform="rotate(20 96 48)"/>`
  }),
  frog: () => head({
    fur: '#7FD14F', fur2: '#9BDD75', muzzle: '#E6FAD5', eyeStyle: 'frog', blush: '#FF7A9E'
  }),
  rhino: () => head({
    fur: '#8FB6D8', fur2: '#A9CCEA', muzzle: '#E6F1FA', blush: '#8AC4FF',
    extras: `<path d="M60 58 L54 84 L66 84 Z" fill="#F2F7FC" opacity=".95"/>`,
    ears: `<ellipse cx="26" cy="42" rx="8" ry="12" fill="#7FA8CC" transform="rotate(-25 26 42)"/>
           <ellipse cx="94" cy="42" rx="8" ry="12" fill="#7FA8CC" transform="rotate(25 94 42)"/>`
  })
};

export const MASCOT_KEYS = Object.keys(MASCOTS);
export const mascot = (name) => (MASCOTS[name] || MASCOTS.fox)();

/* ---------- decorative scene (onboarding / headers) ---------- */
export function scene() {
  return `<svg viewBox="0 0 390 220" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" class="scene-svg" aria-hidden="true">
    <defs><linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5FCBFF"/><stop offset="1" stop-color="#9EE0FF"/>
    </linearGradient></defs>
    <rect width="390" height="220" fill="url(#skyg)"/>
    <g fill="#fff" opacity=".92">
      <ellipse cx="60" cy="46" rx="30" ry="16"/><ellipse cx="82" cy="40" rx="20" ry="13"/>
      <ellipse cx="300" cy="34" rx="34" ry="17"/><ellipse cx="326" cy="42" rx="22" ry="12"/>
      <ellipse cx="196" cy="70" rx="18" ry="9"/>
    </g>
    <path d="M0 168 Q 70 140 140 162 T 280 156 T 390 172 L390 220 L0 220 Z" fill="#8DD54F"/>
    <path d="M0 190 Q 90 168 190 190 T 390 186 L390 220 L0 220 Z" fill="#6FBF37"/>
    <g>
      <rect x="46" y="150" width="8" height="26" rx="4" fill="#A9713F"/>
      <circle cx="50" cy="146" r="20" fill="#FFB0C8"/><circle cx="36" cy="152" r="13" fill="#FF9DC9"/>
      <circle cx="64" cy="152" r="13" fill="#FF9DC9"/>
      <rect x="322" y="146" width="9" height="30" rx="4" fill="#A9713F"/>
      <circle cx="326" cy="140" r="22" fill="#7FD14F"/><circle cx="310" cy="148" r="14" fill="#96DC6B"/>
      <circle cx="343" cy="148" r="14" fill="#96DC6B"/>
    </g>
    <g fill="#FFD84D">
      <path d="M212 178 l3.4 6.9 7.6 1.1 -5.5 5.4 1.3 7.6 -6.8 -3.6 -6.8 3.6 1.3 -7.6 -5.5 -5.4 7.6 -1.1z"/>
    </g>
  </svg>`;
}

/* ---------- UI icons ---------- */
const ic = (p, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" class="ico" aria-hidden="true">${p}${extra}</svg>`;

export const ICONS = {
  map:    ic('<path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z"/><path d="M9 4v13.5M15 6.5V20"/>'),
  book:   ic('<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 17.5V4.5"/>'),
  game:   ic('<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3M16 12h.01M18.5 14h.01"/>'),
  az:     ic('<path d="M3 17 6 8l3 9M4 14.5h4M14 8h6l-6 9h6"/>'),
  mic:    ic('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/>'),
  sound:  ic('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 8.5a5 5 0 0 1 0 7M19.5 6a8.5 8.5 0 0 1 0 12"/>'),
  back:   ic('<path d="M15 5l-7 7 7 7"/>'),
  close:  ic('<path d="M6 6l12 12M18 6L6 18"/>'),
  gear:   ic('<circle cx="12" cy="12" r="3.2"/><path d="M19.4 14.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06A2 2 0 1 1 4.17 16.9l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H2.9a2 2 0 1 1 0-4H3a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.88l-.06-.06A2 2 0 1 1 7 4.1l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V2.9a2 2 0 1 1 4 0V3a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.55 1z"/>'),
  lock:   ic('<rect x="4.5" y="10" width="15" height="11" rx="3"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>'),
  check:  ic('<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>'),
  refresh:ic('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'),
  search: ic('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>'),
  flame:  ic('<path d="M12 2.5c3.5 4 5.5 6.4 5.5 9.5a5.5 5.5 0 0 1-11 0c0-1.8.8-3.3 2-4.8.5 1.6 1.4 2.3 2.2 2.3 1.1 0 1.6-1.3 1.3-7z"/>'),
  play:   ic('<path d="M7 4.5 19 12 7 19.5z"/>'),
  trophy: ic('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a4 4 0 0 0 3 3.9M17 6h3v1a4 4 0 0 1-3 3.9M9 20h6M12 14v6"/>'),
  chevron:ic('<path d="M9 6l6 6-6 6"/>'),
  plus:   ic('<path d="M12 5v14M5 12h14"/>')
};

export const heartSvg = (filled = true) => `<svg viewBox="0 0 24 24" class="ico" aria-hidden="true">
  <path d="M12 21s-8-5.1-8-10.4A4.6 4.6 0 0 1 12 7.4 4.6 4.6 0 0 1 20 10.6C20 15.9 12 21 12 21z"
        fill="${filled ? '#FF4E78' : 'none'}" stroke="${filled ? '#FF4E78' : 'rgba(255,255,255,.55)'}" stroke-width="2"/></svg>`;

export const starSvg = (filled = true) => `<svg viewBox="0 0 24 24" class="ico" aria-hidden="true">
  <path d="M12 3.2l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17.1l-5.4 2.9 1-6.1L3.2 9.6l6.1-.9z"
        fill="${filled ? '#FFC61A' : 'none'}" stroke="${filled ? '#F0A800' : 'rgba(255,255,255,.5)'}"
        stroke-width="1.6" stroke-linejoin="round"/></svg>`;

/* Wordmark: coloured letters, echoing kid-app alphabet blocks */
export function logo() {
  const cols = ['#26C1FC', '#BF8FFD', '#FF8AD1', '#FFB525', '#8DD54F'];
  return `<span class="logo">${'Chirp'.split('').map((c, i) =>
    `<span style="color:${cols[i]}">${c}</span>`).join('')}</span>`;
}
