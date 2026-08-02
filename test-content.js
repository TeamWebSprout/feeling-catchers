/* Drives every mechanic in the expanded roster to completion and checks what
   breaks when content is added: entry stays one tap, discovery gating works,
   variation actually varies, situation banks switch, listeners don't leak.
   Routes are deterministic (rotation is seeded) so the run is ~5 minutes
   rather than replaying sessions until the right pal happens to appear. */
const { chromium } = require('playwright');
const BASE = 'http://localhost:8099/';

const ok = [], bad = [];
const check = (n, c, x) => { (c ? ok : bad).push(n + (x ? ' — ' + x : '')); return c; };
const log = m => console.log('   … ' + m);

async function bootFresh(page) {
  await page.goto(BASE);
  await page.waitForTimeout(700);
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => new Promise(r => {
    const q = indexedDB.deleteDatabase('feeling-catchers'); q.onsuccess = q.onerror = q.onblocked = r;
  }));
  await page.goto(BASE);
  await page.waitForTimeout(900);
  if (await page.isVisible('#s-onboard')) {
    await page.click("text=I've got it, let's start");
    await page.waitForTimeout(400);
  }
}

async function playCurrent(page, timeoutMs = 100000) {
  const mech = await page.evaluate(() => SPECIES[SESSION.species].mech);
  const t0 = Date.now();
  while (!(await page.isVisible('#s-settle'))) {
    if (Date.now() - t0 > timeoutMs) throw new Error('timeout inside mechanic: ' + mech);
    if (mech === 'breath') {
      const bb = await (await page.$('#orbwrap')).boundingBox();
      await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
      await page.mouse.down(); await page.waitForTimeout(3300); await page.mouse.up();
      await page.waitForTimeout(5300);
    } else if (mech === 'trace') {
      const pos = await page.evaluate(() => {
        const svg = document.querySelector('#tw svg'), g = document.querySelector('#tg');
        if (!svg || !g) return null;
        const r = svg.getBoundingClientRect(), s = Math.min(r.width / 400, r.height / 320);
        return { x: r.left + (r.width - 400 * s) / 2 + +g.getAttribute('cx') * s,
                 y: r.top + (r.height - 320 * s) / 2 + +g.getAttribute('cy') * s };
      });
      if (pos) await page.mouse.move(pos.x, pos.y);
      await page.waitForTimeout(140);
    } else if (mech === 'beat') {
      const pb = await (await page.$('#bp')).boundingBox();
      await page.mouse.click(pb.x + pb.width / 2, pb.y + pb.height / 2);
      await page.waitForTimeout(800);
    } else if (mech === 'find5') {
      if (await page.isVisible('#m-leaf')) await page.click('#m-leaf');
      await page.waitForTimeout(380);
    } else if (mech === 'squeeze' || mech === 'bodyscan') {
      await page.waitForTimeout(1200);                      // fully timed, no input needed
    } else if (mech === 'hum') {
      const hb = await (await page.$('#hum-wrap')).boundingBox();
      await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
      await page.mouse.down(); await page.waitForTimeout(1300); await page.mouse.up();
      await page.waitForTimeout(280);
    } else if (mech === 'bilateral') {
      const lit = await page.evaluate(() =>
        document.getElementById('bl-L').classList.contains('lit') ? 'L' : 'R');
      await page.click('#bl-' + lit);
      await page.waitForTimeout(430);
    } else if (mech === 'name') {
      if (await page.isVisible('[data-b]')) await page.click('[data-b="0"]');
      else if (await page.isVisible('.chips [data-f]')) await page.click('.chips [data-f]');
      await page.waitForTimeout(450);
    } else if (mech === 'shake') {
      const sp = await (await page.$('#sh-pad')).boundingBox();
      const going = await page.evaluate(() => document.getElementById('sh-pad').classList.contains('go'));
      if (going) for (let i = 0; i < 6; i++) { await page.mouse.move(sp.x + 40 + i * 14, sp.y + 60 + (i % 2) * 22); await page.waitForTimeout(35); }
      else await page.waitForTimeout(380);
    } else if (mech === 'farewell') {
      if (await page.isVisible('#fw-btn')) await page.click('#fw-btn');
      await page.waitForTimeout(380);
    } else throw new Error('unknown mech ' + mech);
  }
  return mech;
}

async function finishSettle(page) {
  if (await page.isVisible('#btn-keep')) await page.click('#btn-keep');
  else if (await page.isVisible('#s-settle [data-go="island"]')) await page.click('#s-settle [data-go="island"]');
  await page.waitForTimeout(450);
}

/* Seed unlocks + rotation so a given feeling yields a specific pal. */
async function route(page, r) {
  if (r.wx) {
    await page.evaluate(({ f, idx }) => {
      S.feelingCounts[f] = 20;                       // all three unlocked
      S.rotation[f] = (idx - 1 + 3) % 3;             // next pick lands on idx
      save();
    }, { f: r.wx, idx: r.idx });
    await page.click(`[data-wx="${r.wx}"]`);
  } else {
    await page.click(`[data-sit="${r.sit}"]`);
  }
  await page.waitForTimeout(420);
  await page.click('#btn-begin');
  await page.waitForTimeout(550);
}

const TARGETS = [
  { mech: 'breath',    wx: 'hot',   idx: 0 },
  { mech: 'squeeze',   wx: 'hot',   idx: 1 },
  { mech: 'shake',     wx: 'hot',   idx: 2 },
  { mech: 'find5',     wx: 'much',  idx: 0 },
  { mech: 'trace',     wx: 'fizzy', idx: 0 },
  { mech: 'hum',       wx: 'fizzy', idx: 1 },
  { mech: 'bilateral', wx: 'fizzy', idx: 2 },
  { mech: 'beat',      wx: 'rainy', idx: 0 },
  { mech: 'name',      wx: 'rainy', idx: 2 },
  { mech: 'bodyscan',  sit: 'bedtime' },
  { mech: 'farewell',  sit: 'leaving' }
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  await bootFresh(page);

  // ---------- entry surface ----------
  const entry = await page.evaluate(() => ({
    feelings: document.querySelectorAll('#wx-grid [data-wx]').length,
    situations: document.querySelectorAll('#sit-grid [data-sit]').length,
    palSlots: document.querySelectorAll('#pal-grid .pal').length,
    palCount: document.getElementById('pal-count').textContent,
    more: document.getElementById('pal-more').textContent
  }));
  check('six feelings + sunny on the island', entry.feelings === 7, JSON.stringify(entry));
  check('three situation entries', entry.situations === 3);
  check('empty collection shows 3 mystery slots, not 11', entry.palSlots === 3, 'slots ' + entry.palSlots);
  check('collection size still communicated', /0 of 15/.test(entry.palCount) && /12 more/.test(entry.more),
    entry.palCount + ' | ' + entry.more);

  // ---------- discovery gating, before anything is played ----------
  const gate0 = await page.evaluate(() => ({ hot: unlockedCount('hot'), much: unlockedCount('much') }));
  check('a fresh feeling starts with exactly one pal', gate0.hot === 1 && gate0.much === 1, JSON.stringify(gate0));
  const gate = await page.evaluate(() => {
    const before = unlockedCount('scared');
    S.feelingCounts.scared = 3; const at3 = unlockedCount('scared');
    S.feelingCounts.scared = 8; const at8 = unlockedCount('scared');
    S.feelingCounts.scared = 0; save();
    return { before, at3, at8 };
  });
  check('second pal unlocks at 3 sessions', gate.before === 1 && gate.at3 === 2, JSON.stringify(gate));
  check('third pal unlocks at 8 sessions', gate.at8 === 3, JSON.stringify(gate));

  // ---------- one tap from island to summon, two to play ----------
  await page.click('[data-wx="hot"]');
  await page.waitForTimeout(400);
  check('feeling tap goes straight to summon', await page.isVisible('#s-summon'));
  check('new pal announced on first meeting', await page.isVisible('#summon-new'));
  check('Together offered on a breathing pal', await page.isVisible('#btn-together'));
  await page.click('#s-summon [data-go="island"]');
  await page.waitForTimeout(350);

  // ---------- every mechanic completes ----------
  const seen = new Set();
  for (const t of TARGETS) {
    await route(page, t);
    const mech = await playCurrent(page);
    seen.add(mech);
    check(`${t.wx || t.sit} → ${mech} completes`, mech === t.mech && await page.isVisible('#s-settle'),
      mech !== t.mech ? 'expected ' + t.mech : '');
    log(`${t.mech} ok`);
    await finishSettle(page);
  }
  const ALL = TARGETS.map(t => t.mech);
  check('all eleven mechanics reached and completed', ALL.every(m => seen.has(m)),
    'missing: ' + ALL.filter(m => !seen.has(m)).join(','));

  // ---------- waiting uses the out-and-about prompt bank ----------
  await page.click('[data-sit="waiting"]');
  await page.waitForTimeout(400);
  await page.click('#btn-begin');
  await page.waitForTimeout(700);
  const outPrompt = await page.evaluate(() => ({
    shown: document.getElementById('m-q').textContent,
    inOut: QUEST_BANKS.out.some(q => q.q === document.getElementById('m-q').textContent),
    inHome: QUEST_BANKS.home.some(q => q.q === document.getElementById('m-q').textContent)
  }));
  check('Waiting draws from the out-and-about bank', outPrompt.inOut && !outPrompt.inHome, outPrompt.shown);
  await playCurrent(page); await finishSettle(page);

  // ---------- variation ----------
  const variation = await page.evaluate(() => {
    const runs = [];
    for (let i = 0; i < 6; i++) runs.push(sample(QUEST_BANKS.home, 5).map(q => q.q).join('|'));
    return { distinct: new Set(runs).size, home: QUEST_BANKS.home.length, out: QUEST_BANKS.out.length,
             paths: TRACE_PATHS.length, lines: SPECIES.ember.lines.length, parts: BODY_PARTS.length };
  });
  check('grounding prompts differ run to run', variation.distinct >= 5, JSON.stringify(variation));
  check('grounding banks are deep enough to last', variation.home >= 12 && variation.out >= 8, JSON.stringify(variation));
  check('four trace paths rotate', variation.paths >= 4);
  check('creatures have dialogue pools', variation.lines >= 3);
  check('PMR draws 5 body parts from a larger bank', variation.parts >= 8, 'bank ' + variation.parts);

  // ---------- no listener leak across sessions ----------
  const leak = await page.evaluate(() => typeof sessionSignal === 'function' && ABORT === null);
  check('window listeners torn down after a session ends', leak);

  // ---------- parent panel ----------
  await page.click('#btn-parent');
  await page.waitForTimeout(400);
  const q = await page.textContent('#gate-q');
  const m = q.match(/(\d+) × (\d+)/);
  for (const d of String(+m[1] * +m[2])) await page.click(`[data-k="${d}"]`);
  await page.click('[data-k="✓"]');
  await page.waitForTimeout(900);
  const cov = await page.evaluate(() => document.querySelectorAll('#coverage .pill').length);
  check('strategy coverage lists what was used', cov >= 9, 'pills ' + cov);
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll('#log-table tbody tr')].map(r => r.innerText.replace(/\s+/g, ' ')));
  check('log labels situations readably', rows.some(r => /Bedtime|Time to go|Waiting/.test(r)), rows[0]);
  check('log labels feelings readably', rows.some(r => /Roary Hot|Too Much|Rainy|Buzzy Fizzy/.test(r)));
  check('naming session recorded the chosen word', rows.some(r => /Mad \//.test(r)), rows.find(r => /Mad/.test(r)) || '');
  const exp = JSON.parse(await page.inputValue('#export-box'));
  check('export carries the mechanic on each session', exp.sessions.every(s => !!s.mech));
  await page.screenshot({ path: 'content-parent.png', fullPage: false });

  console.log('\nPASS (' + ok.length + ')'); ok.forEach(o => console.log('  ✓ ' + o));
  console.log('\nFAIL (' + bad.length + ')'); bad.forEach(f => console.log('  ✗ ' + f));
  console.log('\nJS ERRORS (' + errors.length + ')'); errors.forEach(e => console.log('  ' + e));
  await browser.close();
  process.exit(bad.length || errors.length ? 1 : 0);
})();
