/* Mobile + PWA installability audit.
   Reports findings rather than asserting, so it can be read as a checklist. */
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://localhost:8099/';

const findings = [];
const note = (level, area, msg) => findings.push({ level, area, msg });

const DEVICES = [
  { name: 'iPhone SE (small)',      w: 320, h: 568 },
  { name: 'iPhone SE 2/8',          w: 375, h: 667 },
  { name: 'iPhone 14/15',           w: 390, h: 844 },
  { name: 'iPhone 15 Pro Max',      w: 430, h: 932 },
  { name: 'landscape phone',        w: 844, h: 390 },
  { name: 'iPad portrait',          w: 768, h: 1024 }
];

/* Every screen the app can show, and how to get there. */
const SCREENS = [
  { id: 's-onboard', go: async p => {} },
  { id: 's-island',  go: async p => { await dismissOnboard(p); } },
  { id: 's-summon',  go: async p => { await dismissOnboard(p); await p.click('[data-wx="hot"]'); await p.waitForTimeout(350); } },
  { id: 's-gate',    go: async p => { await dismissOnboard(p); await p.click('#btn-parent'); await p.waitForTimeout(350); } },
  { id: 's-parent',  go: async p => { await openParent(p); } },
  { id: 's-journey', go: async p => { await openParent(p); await p.click('#btn-journey'); await p.waitForTimeout(500); } }
];

async function dismissOnboard(p) {
  if (await p.isVisible('#s-onboard')) {
    await p.click("text=I've got it, let's start");
    await p.waitForTimeout(350);
  }
}
async function openParent(p) {
  await dismissOnboard(p);
  await p.click('#btn-parent');
  await p.waitForTimeout(300);
  const q = await p.textContent('#gate-q');
  const m = q.match(/(\d+) × (\d+)/);
  for (const d of String(+m[1] * +m[2])) await p.click(`[data-k="${d}"]`);
  await p.click('[data-k="✓"]');
  await p.waitForTimeout(600);
}

(async () => {
  const browser = await chromium.launch();

  /* ---------------- 1. install criteria ---------------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    await p.goto(BASE, { waitUntil: 'load' });
    await p.waitForTimeout(1600);
    await p.reload();
    await p.waitForTimeout(1200);

    const mf = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
    const need = {
      'name or short_name': !!(mf.name || mf.short_name),
      'short_name present': !!mf.short_name,
      'start_url': !!mf.start_url,
      'display standalone/fullscreen/minimal-ui': ['standalone','fullscreen','minimal-ui'].includes(mf.display),
      'icon >= 192px': mf.icons.some(i => i.sizes.split('x')[0] >= 192),
      'icon >= 512px': mf.icons.some(i => i.sizes.split('x')[0] >= 512),
      'maskable icon': mf.icons.some(i => (i.purpose || '').includes('maskable')),
      'background_color': !!mf.background_color,
      'theme_color': !!mf.theme_color,
      'id': !!mf.id,
      'screenshots (richer install UI)': Array.isArray(mf.screenshots) && mf.screenshots.length > 0,
      'screenshots wide + narrow form_factor':
        Array.isArray(mf.screenshots) &&
        mf.screenshots.some(s => s.form_factor === 'wide') &&
        mf.screenshots.some(s => s.form_factor === 'narrow')
    };
    for (const [k, ok] of Object.entries(need)) {
      if (!ok) note(k.includes('screenshot') ? 'WARN' : 'FAIL', 'manifest', k + ' missing');
    }

    const sw = await p.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      return { registered: !!r, active: !!(r && r.active), controlling: !!navigator.serviceWorker.controller };
    });
    if (!sw.registered) note('FAIL', 'service worker', 'not registered');
    if (!sw.controlling) note('FAIL', 'service worker', 'not controlling the page');

    const head = await p.evaluate(() => ({
      viewport: (document.querySelector('meta[name=viewport]') || {}).content || '',
      themeColor: !!document.querySelector('meta[name=theme-color]'),
      appleCapable: !!document.querySelector('meta[name=apple-mobile-web-app-capable]'),
      appleIcon: !!document.querySelector('link[rel=apple-touch-icon]'),
      startupImages: document.querySelectorAll('link[rel=apple-touch-startup-image]').length,
      startupSized: [...document.querySelectorAll('link[rel=apple-touch-startup-image]')].filter(l => l.media).length,
      lang: document.documentElement.lang,
      textSizeAdjust: getComputedStyle(document.documentElement).webkitTextSizeAdjust || 'unset'
    }));
    if (/user-scalable\s*=\s*no/.test(head.viewport) || /maximum-scale\s*=\s*1/.test(head.viewport))
      note('FAIL', 'accessibility', 'viewport blocks pinch-zoom (user-scalable=no / maximum-scale=1) — WCAG 1.4.4');
    if (head.startupImages && !head.startupSized)
      note('WARN', 'iOS', `${head.startupImages} apple-touch-startup-image link(s) with no media query — iOS ignores these, so launch flashes blank`);
    if (!head.lang) note('WARN', 'a11y', 'no lang on <html>');

    await ctx.close();
  }

  /* ---------------- 2. per-device layout ---------------- */
  for (const d of DEVICES) {
    const ctx = await browser.newContext({
      viewport: { width: d.w, height: d.h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2
    });
    const p = await ctx.newPage();
    p.on('pageerror', e => note('FAIL', d.name, 'JS error: ' + e.message));

    for (const s of SCREENS) {
      await p.goto(BASE);
      await p.waitForTimeout(500);
      await p.evaluate(() => localStorage.clear());
      await p.goto(BASE);
      await p.waitForTimeout(600);
      try { await s.go(p); } catch (e) { note('FAIL', d.name, `could not reach ${s.id}: ${e.message}`); continue; }

      const r = await p.evaluate(id => {
        const el = document.getElementById(id);
        if (!el || !el.classList.contains('on')) return { missing: true };
        const docOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
        const bodyOverflow = document.body.scrollWidth > window.innerWidth + 1;

        // any element painting outside the viewport horizontally
        const bleeds = [];
        el.querySelectorAll('*').forEach(n => {
          const b = n.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) return;
          if (b.right > window.innerWidth + 1.5 || b.left < -1.5) {
            const sel = n.id ? '#' + n.id : (n.className && typeof n.className === 'string' ? '.' + n.className.split(' ')[0] : n.tagName);
            if (!bleeds.includes(sel)) bleeds.push(sel);
          }
        });

        // interactive targets smaller than 44px in either dimension
        const small = [];
        el.querySelectorAll('button, a, input, [data-wx], [data-sit], [data-k], [data-r], [data-b], [data-f], .toggle[data-sw]').forEach(n => {
          const b = n.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) return;
          if (b.width < 44 || b.height < 44) {
            const sel = n.id ? '#' + n.id : (n.className && typeof n.className === 'string' ? '.' + n.className.split(' ')[0] : n.tagName);
            small.push(`${sel} ${Math.round(b.width)}x${Math.round(b.height)}`);
          }
        });

        // text smaller than 12px
        const tiny = new Set();
        el.querySelectorAll('*').forEach(n => {
          if (!n.textContent || !n.textContent.trim()) return;
          if (n.children.length) return;
          const fs = parseFloat(getComputedStyle(n).fontSize);
          if (fs && fs < 12) tiny.add(Math.round(fs * 10) / 10 + 'px');
        });

        // inputs below 16px trigger iOS zoom-on-focus
        const zoomy = [];
        el.querySelectorAll('input, textarea, select').forEach(n => {
          const fs = parseFloat(getComputedStyle(n).fontSize);
          if (fs && fs < 16) zoomy.push((n.id || n.tagName) + ' ' + fs + 'px');
        });

        // content taller than the screen with no way to scroll
        const clipped = el.scrollHeight > el.clientHeight + 2 &&
                        getComputedStyle(el).overflowY === 'hidden';

        /* the primary action of every screen must actually be clickable: on
           screen, and not painted over by anything that overflowed above it */
        let primary = null;
        const pb = el.querySelector('.btn.primary, #btn-begin, .leaf-btn');
        if (pb) {
          const b = pb.getBoundingClientRect();
          const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
          const hit = document.elementFromPoint(cx, cy);
          primary = {
            label: (pb.textContent || pb.id || '').trim().slice(0, 28),
            onScreen: b.top >= -1 && b.bottom <= window.innerHeight + 1 && b.height > 0,
            topmost: !!(hit && (hit === pb || pb.contains(hit) || pb.contains(hit.parentElement))),
            covering: hit ? (hit.id || (typeof hit.className === 'string' ? hit.className.split(' ')[0] : hit.tagName)) : 'nothing'
          };
        }

        return { docOverflow, bodyOverflow, bleeds: bleeds.slice(0, 4), small: [...new Set(small)].slice(0, 4),
                 tiny: [...tiny].slice(0, 4), zoomy, clipped, primary,
                 scrollH: el.scrollHeight, clientH: el.clientHeight };
      }, s.id);

      if (r.missing) { note('FAIL', d.name, `${s.id} did not open`); continue; }
      if (r.docOverflow || r.bodyOverflow) note('FAIL', `${d.name}/${s.id}`, 'horizontal overflow of the viewport');
      if (r.bleeds.length) note('FAIL', `${d.name}/${s.id}`, 'painting outside viewport: ' + r.bleeds.join(', '));
      if (r.small.length) note('WARN', `${d.name}/${s.id}`, 'tap target under 44px: ' + r.small.join(', '));
      if (r.tiny.length) note('WARN', `${d.name}/${s.id}`, 'text under 12px: ' + r.tiny.join(', '));
      if (r.zoomy.length) note('FAIL', `${d.name}/${s.id}`, 'input under 16px (iOS zooms on focus): ' + r.zoomy.join(', '));
      if (r.clipped) note('FAIL', `${d.name}/${s.id}`, `content ${r.scrollH}px in a ${r.clientH}px box with overflow hidden`);
      if (r.primary && !r.primary.onScreen)
        note('WARN', `${d.name}/${s.id}`, `primary action "${r.primary.label}" needs scrolling to reach`);
      if (r.primary && r.primary.onScreen && !r.primary.topmost)
        note('FAIL', `${d.name}/${s.id}`, `primary action "${r.primary.label}" is covered by ${r.primary.covering}`);
    }
    await ctx.close();
  }

  /* ---------------- 3. a mechanic in landscape ---------------- */
  try {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    await p.goto(BASE); await p.waitForTimeout(600);
    await dismissOnboard(p);
    await p.click('[data-wx="hot"]'); await p.waitForTimeout(350);

    /* the specific failure this catches: content overflowing .stage and painting
       over the primary button, so the session cannot be started at all */
    const reachable = await p.evaluate(() => {
      const b = document.getElementById('btn-begin');
      const r = b.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { onScreen: r.bottom <= window.innerHeight + 1 && r.top >= -1,
               topmost: !!(hit && (hit === b || b.contains(hit))),
               covering: hit ? (hit.id || hit.className || hit.tagName) : null };
    });
    if (!reachable.onScreen) note('FAIL', 'landscape/summon', 'primary button is off screen');
    if (!reachable.topmost) note('FAIL', 'landscape/summon', 'primary button is covered by: ' + reachable.covering);

    await p.click('#btn-begin', { timeout: 8000 }); await p.waitForTimeout(900);
    const r = await p.evaluate(() => {
      const el = document.getElementById('s-play');
      const orb = document.getElementById('orbwrap');
      const coach = document.getElementById('play-coach');
      const ob = orb ? orb.getBoundingClientRect() : null;
      const cb = coach ? coach.getBoundingClientRect() : null;
      return {
        overflowing: el.scrollHeight > el.clientHeight + 2,
        orbVisible: ob ? (ob.top >= -1 && ob.bottom <= window.innerHeight + 1) : false,
        orbBox: ob ? [Math.round(ob.width), Math.round(ob.height)] : null,
        coachOverlapsOrb: ob && cb ? !(cb.top >= ob.bottom || cb.bottom <= ob.top) : false
      };
    });
    if (!r.orbVisible) note('FAIL', 'landscape/play', `breathing orb not fully on screen (${r.orbBox})`);
    if (r.coachOverlapsOrb) note('FAIL', 'landscape/play', 'coach text overlaps the orb');
    if (r.overflowing) note('WARN', 'landscape/play', 'play screen scrolls in landscape');
    await ctx.close();
  } catch (e) {
    note('FAIL', 'landscape', 'landscape flow threw: ' + String(e.message).split('\n')[0]);
  }

  await browser.close();

  const fails = findings.filter(f => f.level === 'FAIL');
  const warns = findings.filter(f => f.level === 'WARN');
  console.log('\n=== FAIL (' + fails.length + ') ===');
  fails.forEach(f => console.log(`  [${f.area}] ${f.msg}`));
  console.log('\n=== WARN (' + warns.length + ') ===');
  warns.forEach(f => console.log(`  [${f.area}] ${f.msg}`));
  console.log('');
})();
