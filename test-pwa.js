const { chromium } = require('playwright');

const BASE = 'http://localhost:8099/';
const fail = [];
const ok   = [];
const check = (name, cond, extra) => (cond ? ok : fail).push(name + (extra ? ' — ' + extra : ''));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  // ---------- 1. manifest ----------
  const mfRes = await page.goto(BASE + 'manifest.webmanifest');
  const mfType = mfRes.headers()['content-type'] || '';
  const mf = JSON.parse(await mfRes.text());
  check('manifest served as manifest+json', mfType.includes('manifest+json'), mfType);
  check('manifest has name + short_name', !!mf.name && !!mf.short_name);
  check('manifest display standalone', mf.display === 'standalone');
  check('manifest start_url relative', mf.start_url === './');
  check('manifest has 192 + 512 any icons',
    mf.icons.some(i => i.sizes === '192x192' && i.purpose === 'any') &&
    mf.icons.some(i => i.sizes === '512x512' && i.purpose === 'any'));
  check('manifest has maskable icons', mf.icons.some(i => i.purpose === 'maskable'));

  // every icon actually resolves
  for (const ic of mf.icons) {
    const r = await page.request.get(BASE + ic.src.replace('./', ''));
    check('icon 200: ' + ic.src, r.status() === 200, 'status ' + r.status());
  }

  // ---------- 2. service worker ----------
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const swState = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return {
      registered: !!reg,
      scope: reg ? reg.scope : null,
      active: !!(reg && reg.active),
      controller: !!navigator.serviceWorker.controller
    };
  });
  check('service worker registered', swState.registered);
  check('service worker active', swState.active);

  const cacheInfo = await page.evaluate(async () => {
    const keys = await caches.keys();
    if (!keys.length) return { keys, count: 0 };
    const c = await caches.open(keys[0]);
    const reqs = await c.keys();
    return { keys, count: reqs.length, urls: reqs.map(r => new URL(r.url).pathname) };
  });
  check('cache created', cacheInfo.keys.length === 1, cacheInfo.keys.join(','));
  check('shell precached (>=9 entries)', cacheInfo.count >= 9, 'got ' + cacheInfo.count);

  // ---------- 3. offline cold launch ----------
  await page.reload();                       // ensure SW controls the page
  await page.waitForTimeout(800);
  await ctx.setOffline(true);
  const offlineResp = await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  const offlineWorks = await page.evaluate(() =>
    !!document.querySelector('.screen.on') && !!document.getElementById('wx-grid'));
  check('loads with network disabled', offlineWorks, 'http ' + (offlineResp && offlineResp.status()));
  const iconOffline = await page.evaluate(async () => {
    try { const r = await fetch('./icons/icon-192.png'); return r.ok; } catch (e) { return false; }
  });
  check('cached icon served offline', iconOffline);
  await ctx.setOffline(false);

  // ---------- 4. full game loop still works ----------
  await page.goto(BASE);
  await page.waitForTimeout(600);
  if (await page.isVisible('#s-onboard')) {
    await page.click("text=I've got it, let's start");
    await page.waitForTimeout(400);
  }
  await page.click('[data-wx="much"]');
  await page.waitForTimeout(400);
  await page.click('#btn-begin');
  await page.waitForTimeout(700);
  for (let i = 0; i < 5; i++) { await page.click('#m-leaf'); await page.waitForTimeout(420); }
  await page.waitForTimeout(1000);
  check('mechanic completes to settle', await page.isVisible('#s-settle'));
  if (await page.isVisible('#btn-keep')) await page.click('#btn-keep');
  await page.waitForTimeout(400);

  // ---------- 5. dual-write storage ----------
  const stored = await page.evaluate(async () => {
    const ls = JSON.parse(localStorage.getItem('fc.state') || 'null');
    const idb = await new Promise(res => {
      const rq = indexedDB.open('feeling-catchers', 1);
      rq.onsuccess = () => {
        try {
          const tx = rq.result.transaction('state', 'readonly');
          const g = tx.objectStore('state').get('fc.state');
          g.onsuccess = () => res(g.result || null);
          g.onerror = () => res(null);
        } catch (e) { res(null); }
      };
      rq.onerror = () => res(null);
    });
    return { lsPals: Object.keys((ls || {}).pals || {}).length, idbPals: Object.keys((idb || {}).pals || {}).length, ver: (idb || {})._v };
  });
  check('localStorage has the pal', stored.lsPals === 1, JSON.stringify(stored));
  check('IndexedDB mirror has the pal', stored.idbPals === 1, JSON.stringify(stored));
  check('mirror is version-stamped', stored.ver === '0.7.1', String(stored.ver));

  // ---------- 6. recovery when localStorage is wiped ----------
  await page.evaluate(() => localStorage.removeItem('fc.state'));
  await page.reload();
  await page.waitForTimeout(1800);
  const recovered = await page.evaluate(() =>
    Object.keys(JSON.parse(localStorage.getItem('fc.state') || '{}').pals || {}).length);
  check('recovers pals from IndexedDB after localStorage wipe', recovered === 1, 'got ' + recovered);
  check('recovery lands on the island, not onboarding', await page.isVisible('#s-island'));

  // ---------- 7. parent panel + health ----------
  await page.click('#btn-parent');
  await page.waitForTimeout(400);
  const q = await page.textContent('#gate-q');
  const m = q.match(/(\d+) × (\d+)/);
  for (const d of String(parseInt(m[1]) * parseInt(m[2]))) await page.click(`[data-k="${d}"]`);
  await page.click('[data-k="✓"]');
  await page.waitForTimeout(900);
  check('parent dashboard opens', await page.isVisible('#s-parent'));
  const healthRows = await page.evaluate(() => document.querySelectorAll('#health-table tbody tr').length);
  check('health table populated', healthRows >= 6, 'rows ' + healthRows);
  const exportJson = JSON.parse(await page.inputValue('#export-box'));
  check('export includes storage diagnostics', !!exportJson.storage && typeof exportJson.storage.indexedDB === 'boolean');
  check('export build stamped 0.7.1', exportJson.build === '0.7.1');
  await page.screenshot({ path: 'pwa-parent.png', fullPage: true });

  // ---------- 8. shortcut deep link ----------
  await page.goto(BASE + '?go=parent');
  await page.waitForTimeout(700);
  check('?go=parent lands on the gate', await page.isVisible('#s-gate'));
  check('query string cleaned from URL', !page.url().includes('go=parent'), page.url());

  // ---------- report ----------
  console.log('\nPASS (' + ok.length + ')');
  ok.forEach(o => console.log('  ✓ ' + o));
  console.log('\nFAIL (' + fail.length + ')');
  fail.forEach(f => console.log('  ✗ ' + f));
  console.log('\nJS ERRORS (' + errors.length + ')');
  errors.forEach(e => console.log('  ' + e));

  await browser.close();
  process.exit(fail.length || errors.length ? 1 : 0);
})();
