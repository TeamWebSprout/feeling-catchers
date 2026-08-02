/* Verifies the update path end to end: a deployed change reaches an
   already-installed tester, the app offers it rather than swapping under
   them mid-session, and taking it actually activates the new build. */
const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://localhost:8099/';
const SW = 'sw.js';
const out = [];
const check = (n, c, x) => { out.push((c ? '  ✓ ' : '  ✗ ') + n + (x ? ' — ' + x : '')); return c; };

(async () => {
  const original = fs.readFileSync(SW, 'utf8');
  let allOk = true;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  try {
    // --- install the current build ---
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.reload();
    await page.waitForTimeout(1000);

    const v1 = await page.evaluate(async () => (await caches.keys())[0]);
    allOk &= check('initial build cached', v1 === 'fc-v0.8.0', v1);
    allOk &= check('update bar hidden before any deploy',
      !(await page.isVisible('#update-bar')));

    // create some state so we can prove the update does not wipe it
    if (await page.isVisible('#s-onboard')) {
      await page.click("text=I've got it, let's start");
      await page.waitForTimeout(400);
    }
    await page.click('[data-wx="much"]');
    await page.waitForTimeout(300);
    await page.click('#btn-begin');
    await page.waitForTimeout(600);
    for (let i = 0; i < 5; i++) { await page.click('#m-leaf'); await page.waitForTimeout(380); }
    await page.waitForTimeout(900);
    if (await page.isVisible('#btn-keep')) await page.click('#btn-keep');
    await page.waitForTimeout(400);
    const before = await page.evaluate(() =>
      Object.keys(JSON.parse(localStorage.getItem('fc.state') || '{}').pals || {}).length);
    allOk &= check('state exists before update', before === 1, 'pals ' + before);

    // --- "deploy" a new build ---
    fs.writeFileSync(SW, original.replace("fc-v0.8.0", "fc-v0.8.1"));
    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      await reg.update();
    });
    await page.waitForTimeout(2500);

    allOk &= check('new build detected and offered', await page.isVisible('#update-bar'));
    allOk &= check('old build still running until the parent accepts',
      (await page.evaluate(async () => (await caches.keys()).includes('fc-v0.8.0'))));

    // --- accept it ---
    await page.click('#update-now');
    await page.waitForTimeout(3000);

    const after = await page.evaluate(async () => ({
      caches: await caches.keys(),
      pals: Object.keys(JSON.parse(localStorage.getItem('fc.state') || '{}').pals || {}).length
    }));
    allOk &= check('new build is now live', after.caches.includes('fc-v0.8.1'), after.caches.join(','));
    allOk &= check('old cache cleaned up', !after.caches.includes('fc-v0.8.0'), after.caches.join(','));
    allOk &= check('tester data survived the update', after.pals === 1, 'pals ' + after.pals);
    allOk &= check('update bar cleared after applying', !(await page.isVisible('#update-bar')));
  } finally {
    fs.writeFileSync(SW, original);
    await browser.close();
  }

  console.log(out.join('\n'));
  console.log('\nJS ERRORS (' + errors.length + ')');
  errors.forEach(e => console.log('  ' + e));
  process.exit(allOk && !errors.length ? 0 : 1);
})();
