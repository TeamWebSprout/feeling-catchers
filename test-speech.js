/* Speech layer. The point of this suite is that the microphone path is
   actually exercised — Chromium is fed a synthesised WAV as its mic — and
   that the design promise holds: a child can never be rejected, and the
   activity completes whether they vocalise or not. */
const { chromium } = require('playwright');
const BASE = 'http://localhost:8099/';

const ok = [], bad = [];
const check = (n, c, x) => { (c ? ok : bad).push(n + (x ? ' — ' + x : '')); return c; };

const MIC_ARGS = [
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
  '--use-file-for-fake-audio-capture=/tmp/fake-voice.wav',
  '--autoplay-policy=no-user-gesture-required'
];

async function boot(page, clear = true) {
  await page.goto(BASE);
  await page.waitForTimeout(600);
  if (clear) {
    await page.evaluate(() => localStorage.clear());
    await page.goto(BASE);
    await page.waitForTimeout(700);
  }
  if (await page.isVisible('#s-onboard')) {
    await page.click("text=I've got it, let's start");
    await page.waitForTimeout(400);
  }
}
async function openParent(page) {
  await page.click('#btn-parent');
  await page.waitForTimeout(350);
  const q = await page.textContent('#gate-q');
  const m = q.match(/(\d+) × (\d+)/);
  for (const d of String(+m[1] * +m[2])) await page.click(`[data-k="${d}"]`);
  await page.click('[data-k="✓"]');
  await page.waitForTimeout(700);
}
/* wait for the settle screen, with a cap */
async function awaitSettle(page, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await page.isVisible('#s-settle')) return true;
    await page.waitForTimeout(400);
  }
  return false;
}

(async () => {
  /* ================= A. with a working microphone ================= */
  {
    const browser = await chromium.launch({ args: MIC_ARGS });
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
      permissions: ['microphone']
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

    await boot(page);

    // island layout: speech is the primary section
    const layout = await page.evaluate(() => {
      const sp = document.getElementById('speech-grid');
      const wx = document.getElementById('wx-grid');
      return {
        speechPals: sp ? sp.querySelectorAll('[data-speech]').length : 0,
        speechAboveFeelings: sp && wx ? sp.getBoundingClientRect().top < wx.getBoundingClientRect().top : false,
        heading: (document.querySelector('#s-island h1') || {}).textContent
      };
    });
    check('speech pals are on the island', layout.speechPals === 6, 'got ' + layout.speechPals);
    check('speech sits above the regulation section', layout.speechAboveFeelings);
    check('island leads with talking', /talk/i.test(layout.heading || ''), layout.heading);

    // the voice engine itself
    const eng = await page.evaluate(async () => {
      const okp = await Voice.enable();
      if (!okp) return { enabled: false };
      const floor = await Voice.calibrate(900);
      const utts = [];
      let maxLevel = 0;
      await new Promise(res => {
        Voice.listen(l => { maxLevel = Math.max(maxLevel, l); }, u => utts.push(u));
        setTimeout(() => { Voice.stop(); res(); }, 7000);
      });
      return { enabled: true, floor, maxLevel, utts: utts.length, firstMs: utts[0] ? Math.round(utts[0].ms) : 0 };
    });
    check('microphone opens', eng.enabled);
    check('noise floor calibrated to something sane', eng.floor > 0 && eng.floor <= 0.09, String(eng.floor));
    check('live level responds to sound', eng.maxLevel > 0.05, 'peak ' + (eng.maxLevel || 0).toFixed(3));
    check('utterances detected from the fake mic', eng.utts >= 1, 'count ' + eng.utts);
    check('utterance duration is plausible', eng.firstMs > 400 && eng.firstMs < 1600, eng.firstMs + 'ms');

    // Chatter end to end
    await page.click('[data-speech="chatter"]');
    await page.waitForTimeout(400);
    check('summon shows the speech pal', await page.isVisible('#s-summon'));
    await page.click('#btn-begin');
    await page.waitForTimeout(1500);
    check('turn counter is shown for speech', await page.isVisible('#turn-pill'));
    check('wait ring is present', await page.evaluate(() => !!document.querySelector('.waitring')));
    const settled = await awaitSettle(page, 90000);
    check('Chatter completes end to end', settled);
    const turns = await page.evaluate(() => ({ session: (window.SESSION || {}).turns || 0, life: S.turns || 0 }));
    check('turns were counted from real vocalisations', turns.life >= 2, JSON.stringify(turns));
    if (await page.isVisible('#btn-keep')) await page.click('#btn-keep');
    await page.waitForTimeout(500);

    // Gulp: the gate must open on a vocalisation
    await page.click('[data-speech="gulp"]');
    await page.waitForTimeout(350);
    await page.click('#btn-begin');
    await page.waitForTimeout(1200);
    let opened = false;
    for (let i = 0; i < 40 && !opened; i++) {
      opened = await page.evaluate(() => {
        const g = document.getElementById('gp-gate');
        return !!(g && g.classList.contains('open'));
      });
      if (!opened) await page.waitForTimeout(500);
    }
    check('a vocalisation opens Gulp\'s gate', opened);
    await awaitSettle(page, 60000);
    if (await page.isVisible('#btn-keep')) await page.click('#btn-keep');
    await page.waitForTimeout(500);

    // Boomer responds to loudness
    await page.click('[data-speech="boomer"]');
    await page.waitForTimeout(350);
    await page.click('#btn-begin');
    await page.waitForTimeout(1500);
    let scaled = false;
    for (let i = 0; i < 30 && !scaled; i++) {
      scaled = await page.evaluate(() => {
        const a = document.getElementById('bm-art');
        return !!(a && a.style.transform && a.style.transform !== 'scale(1.000)' && /scale\(/.test(a.style.transform));
      });
      if (!scaled) await page.waitForTimeout(300);
    }
    check('Boomer scales with the voice level', scaled);
    check('Boomer completes', await awaitSettle(page, 60000));
    if (await page.isVisible('#btn-keep')) await page.click('#btn-keep');
    await page.waitForTimeout(400);

    // mic is released when leaving a speech activity
    const released = await page.evaluate(() => ({ granted: Voice.granted, stream: !!Voice.stream }));
    check('microphone released after the activity', !released.granted && !released.stream, JSON.stringify(released));

    // parent panel reports turns, not minutes
    await openParent(page);
    const sp = await page.evaluate(() => ({
      turns: document.getElementById('sp-turns').textContent,
      sess: document.getElementById('sp-sess').textContent,
      avg: document.getElementById('sp-avg').textContent,
      note: document.getElementById('sp-note').textContent
    }));
    check('parent panel shows lifetime turns', +sp.turns >= 2, JSON.stringify(sp));
    check('parent panel counts talking sessions', +sp.sess >= 3, JSON.stringify(sp));
    check('turns-per-session reported', sp.avg !== '—', sp.avg);
    check('explains why turns and not minutes', /turns/i.test(sp.note) && /minutes/i.test(sp.note));

    // milestone checklist
    const cl = await page.evaluate(() => document.querySelectorAll('#check-list [data-ck]').length);
    check('milestone checklist rendered', cl === 10, 'items ' + cl);
    await page.click('[data-ck="strangers"]');           // tick the key item only
    await page.waitForTimeout(300);
    const v1 = await page.evaluate(() => document.querySelector('#check-verdict .flag').className);
    check('few ticks still recommends assessment', /refer|watch/.test(v1), v1);
    await page.evaluate(() => {
      CHECK_ITEMS.forEach(i => S.checklist[i.k] = true); save(); renderChecklist();
    });
    const v2 = await page.evaluate(() => ({
      cls: document.querySelector('#check-verdict .flag').className,
      txt: document.querySelector('#check-verdict').textContent
    }));
    check('all ticked reads as nothing standing out', /ok/.test(v2.cls), v2.cls);
    check('never claims to diagnose', /does not assess, diagnose or treat/i.test(v2.txt));
    check('defers to parental concern', /parental concern|still worried/i.test(v2.txt));
    await page.evaluate(() => { S.checklist.strangers = false; save(); renderChecklist(); });
    const v3 = await page.evaluate(() => document.querySelector('#check-verdict .flag').className);
    check('intelligibility to strangers alone triggers referral', /refer/.test(v3), v3);

    console.log('\n--- errors in mic run: ' + errors.length + ' ---');
    errors.forEach(e => console.log('  ' + e));
    if (errors.length) bad.push('JS errors during mic run: ' + errors[0]);
    await browser.close();
  }

  /* ================= B. microphone denied ================= */
  {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
      permissions: []                       // explicitly no mic
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
    await boot(page);

    await page.click('[data-speech="chatter"]');
    await page.waitForTimeout(350);
    await page.click('#btn-begin');
    await page.waitForTimeout(2500);
    check('tells the grown-up the mic is off', await page.evaluate(() =>
      !!document.querySelector('.micoff')));
    check('activity still runs without a mic', await page.isVisible('#s-play'));

    // tapping the stage should count a turn instead
    for (let i = 0; i < 6; i++) {
      const st = await page.$('#play-stage');
      if (st) { const b = await st.boundingBox(); if (b) await page.mouse.click(b.x + b.width / 2, b.y + 40); }
      await page.waitForTimeout(900);
    }
    const tapTurns = await page.evaluate(() => S.turns || 0);
    check('tapping counts a turn when the mic is unavailable', tapTurns >= 1, 'turns ' + tapTurns);
    check('completes without a mic', await awaitSettle(page, 70000));
    check('no errors without a mic', errors.length === 0, errors[0] || '');
    await browser.close();
  }

  console.log('\nPASS (' + ok.length + ')'); ok.forEach(o => console.log('  ✓ ' + o));
  console.log('\nFAIL (' + bad.length + ')'); bad.forEach(f => console.log('  ✗ ' + f));
  process.exit(bad.length ? 1 : 0);
})();
