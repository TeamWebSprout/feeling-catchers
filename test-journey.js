/* The progress-logging layer. What matters here is not that it renders but
   that it can't lie to a parent or lose their data: milestones must never be
   revoked, wins must survive reload and restore, ratings must attach to the
   right session, and the jar must hold up at 60+ marbles. */
const { chromium } = require('playwright');
const BASE = 'http://localhost:8099/';

const ok = [], bad = [];
const check = (n, c, x) => { (c ? ok : bad).push(n + (x ? ' — ' + x : '')); return c; };

async function openJourney(page) {
  if (!(await page.isVisible('#s-parent'))) {
    if (!(await page.isVisible('#s-island'))) await page.click('[data-go="island"]').catch(() => {});
    await page.click('#btn-parent');
    await page.waitForTimeout(350);
    const q = await page.textContent('#gate-q');
    const m = q.match(/(\d+) × (\d+)/);
    for (const d of String(+m[1] * +m[2])) await page.click(`[data-k="${d}"]`);
    await page.click('[data-k="✓"]');
    await page.waitForTimeout(700);
  }
  await page.click('#btn-journey');
  await page.waitForTimeout(600);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  page.on('dialog', async d => { errors.push('NATIVE DIALOG: ' + d.message()); await d.dismiss(); });

  await page.goto(BASE); await page.waitForTimeout(700);
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => new Promise(r => {
    const q = indexedDB.deleteDatabase('feeling-catchers'); q.onsuccess = q.onerror = q.onblocked = r;
  }));
  await page.goto(BASE); await page.waitForTimeout(900);
  if (await page.isVisible('#s-onboard')) { await page.click("text=I've got it, let's start"); await page.waitForTimeout(400); }

  // ---------- empty state ----------
  await openJourney(page);
  check('journey screen opens from the parent panel', await page.isVisible('#s-journey'));
  const empty = await page.evaluate(() => ({
    n: document.getElementById('jar-n').textContent,
    hint: document.getElementById('jar-hint').textContent,
    marbles: document.querySelectorAll('#jar-wrap .marble').length,
    ms: document.querySelectorAll('#ms-grid .ms').length,
    got: document.querySelectorAll('#ms-grid .ms.got').length,
    cells: document.querySelectorAll('#cal i').length
  }));
  check('empty jar reads as empty', empty.n === '0' && empty.marbles === 0, JSON.stringify(empty));
  check('all milestones listed, none earned', empty.ms === 11 && empty.got === 0, JSON.stringify(empty));
  check('five-week strip has 35 cells', empty.cells === 35, 'cells ' + empty.cells);

  // ---------- one-tap transfer win ----------
  await page.click('#btn-win-transfer');
  await page.waitForTimeout(700);
  const afterWin = await page.evaluate(() => ({
    n: +document.getElementById('jar-n').textContent,
    marbles: document.querySelectorAll('#jar-wrap .marble').length,
    got: [...document.querySelectorAll('#ms-grid .ms.got .mn')].map(e => e.textContent),
    hint: document.getElementById('jar-hint').textContent
  }));
  check('transfer win drops a marble', afterWin.n === 1 && afterWin.marbles === 1, JSON.stringify(afterWin));
  check('transfer unlocks its milestone', afterWin.got.includes('Without the phone'), afterWin.got.join(','));
  check('hint counts off-screen moments', /1 of them happened away from the screen/.test(afterWin.hint), afterWin.hint);

  // ---------- note sheet uses no native dialog ----------
  await page.click('#btn-win-note');
  await page.waitForTimeout(400);
  check('note sheet opens in-app', await page.isVisible('#note-sheet.on'));
  await page.fill('#note-input', 'asked for Ember by name at the shops');
  await page.click('#note-save');
  await page.waitForTimeout(700);
  const noted = await page.evaluate(() => ({
    n: +document.getElementById('jar-n').textContent,
    first: document.querySelector('#win-list .win b').textContent,
    open: document.getElementById('note-sheet').classList.contains('on')
  }));
  check('note becomes a marble with its text', noted.n === 2 && /asked for Ember/.test(noted.first), JSON.stringify(noted));
  check('note sheet closes after saving', !noted.open);

  // ---------- undo ----------
  await page.click('#btn-win-undo');
  await page.waitForTimeout(500);
  check('undo removes only the last moment',
    (await page.evaluate(() => +document.getElementById('jar-n').textContent)) === 1);

  // ---------- persistence ----------
  await page.reload(); await page.waitForTimeout(1200);
  const persisted = await page.evaluate(() => ({
    wins: (JSON.parse(localStorage.getItem('fc.state') || '{}').wins || []).length,
    ms: Object.keys(JSON.parse(localStorage.getItem('fc.state') || '{}').milestones || {}).length
  }));
  check('wins survive a reload', persisted.wins === 1, JSON.stringify(persisted));
  check('milestones survive a reload', persisted.ms >= 1, JSON.stringify(persisted));

  // ---------- milestones are never revoked ----------
  const revoke = await page.evaluate(() => {
    const before = Object.keys(S.milestones).length;
    const stamp = S.milestones.transfer;
    S.wins = [];                       // simulate the parent deleting everything
    checkMilestones();
    return { before, after: Object.keys(S.milestones).length, sameStamp: S.milestones.transfer === stamp };
  });
  check('a milestone is not revoked when its evidence is deleted',
    revoke.after === revoke.before && revoke.sameStamp, JSON.stringify(revoke));

  // ---------- a completed practice session auto-drops a marble ----------
  await page.evaluate(() => { S.wins = []; S.milestones = {}; save(); });
  await page.goto(BASE); await page.waitForTimeout(900);
  await page.evaluate(() => { S.pals.ember = { name:'Ember', calm:1, rescues:0, form:1 }; save(); renderIsland(); });
  await page.click('[data-wx="sunny"]');
  await page.waitForTimeout(400);
  await page.click('#btn-begin');
  await page.waitForTimeout(800);
  const bb = await (await page.$('#orbwrap')).boundingBox();
  for (let i = 0; i < 7; i++) {
    if (await page.isVisible('#s-settle')) break;
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.mouse.down(); await page.waitForTimeout(3300); await page.mouse.up();
    await page.waitForTimeout(5300);
  }
  if (await page.isVisible('#btn-keep')) await page.click('#btn-keep');
  else if (await page.isVisible('#s-settle [data-go="island"]')) await page.click('#s-settle [data-go="island"]');
  await page.waitForTimeout(600);
  const autoWin = await page.evaluate(() => ({ wins: S.wins.length, type: (S.wins[0] || {}).type, note: (S.wins[0] || {}).note }));
  check('calm practice drops a marble with no parent effort',
    autoWin.wins === 1 && autoWin.type === 'ahead', JSON.stringify(autoWin));

  // ---------- storm sessions ask to be rated; practice does not ----------
  const rateScope = await page.evaluate(() => {
    const before = unratedSessions().length;
    S.log.unshift({ t: Date.now() - 1000, mood:'hot', species:'ember', secs: 40,
                    outcome:'settled', kind:'storm', mech:'breath' });
    save();
    return { practiceOnly: before, withStorm: unratedSessions().length };
  });
  check('practice sessions are not queued for rating', rateScope.practiceOnly === 0, JSON.stringify(rateScope));
  check('storm sessions are queued for rating', rateScope.withStorm === 1, JSON.stringify(rateScope));

  await page.evaluate(() => renderIsland());
  check('gear shows a badge when something needs logging',
    await page.evaluate(() => document.getElementById('btn-parent').classList.contains('badge')));

  // ---------- rating attaches to the right session ----------
  await openJourney(page);
  check('rating card surfaces the pending session', await page.isVisible('#rate-card'));
  const target = await page.evaluate(() => unratedSessions()[0].t);
  await page.click('[data-r="2"]');
  await page.waitForTimeout(700);
  const rated = await page.evaluate(t => ({
    value: S.ratings[t], remaining: unratedSessions().length,
    helped: S.wins.filter(w => w.type === 'helped').length
  }), target);
  check('rating stored against that exact session', rated.value === 2, JSON.stringify(rated));
  check('queue empties after rating', rated.remaining === 0, JSON.stringify(rated));
  check('"a lot" adds a marble', rated.helped === 1, JSON.stringify(rated));

  // ---------- skip does not re-ask ----------
  await page.evaluate(() => {
    S.log.unshift({ t: Date.now() - 5000, mood:'much', species:'mossle', secs: 30,
                    outcome:'settled', kind:'storm', mech:'find5' });
    save(); renderJourney();
  });
  await page.click('#rate-skip');
  await page.waitForTimeout(500);
  check('a skipped session is not asked about again',
    (await page.evaluate(() => unratedSessions().length)) === 0);

  // ---------- jar holds up at scale ----------
  /* Every count from 1 to 200: nothing may ever poke outside the glass. */
  const scale = await page.evaluate(() => {
    const now = Date.now();
    const worst = [];
    let sample = null;
    for (let n = 1; n <= 200; n++) {
      S.wins = Array.from({ length: n }, (_, i) => ({
        t: now - i * 3600000, type: ['transfer','helped','ahead','note'][i % 4], note: 'moment ' + i }));
      renderJourney();
      const cs = [...document.querySelectorAll('#jar-wrap .marble')].map(c => ({
        x: +c.getAttribute('cx'), y: +c.getAttribute('cy'), r: +c.getAttribute('r') }));
      if (!cs.length) { worst.push('n=' + n + ' drew nothing'); continue; }
      const out = cs.some(c => c.x - c.r < 36 || c.x + c.r > 164 || c.y - c.r < 96 || c.y + c.r > 258);
      if (out) worst.push('n=' + n);
      if (n === 200) sample = { count: document.getElementById('jar-n').textContent, drawn: cs.length,
                                r: cs[0].r, listed: document.querySelectorAll('#win-list .win').length };
    }
    save();
    return { escapes: worst.slice(0, 6), sample };
  });
  check('marbles stay inside the glass at every count from 1 to 200',
    scale.escapes.length === 0, scale.escapes.join(', '));
  check('jar reports the true total past its drawing cap', scale.sample.count === '200', JSON.stringify(scale.sample));
  check('drawing is capped rather than overflowing', scale.sample.drawn < 200 && scale.sample.drawn > 20,
    'drawn ' + scale.sample.drawn);
  check('marble size steps down as the jar fills', scale.sample.r <= 9, 'r ' + scale.sample.r);
  check('moment list stays short', scale.sample.listed === 12, 'listed ' + scale.sample.listed);

  // ---------- marble positions are stable across renders ----------
  const stable = await page.evaluate(() => {
    const grab = () => [...document.querySelectorAll('#jar-wrap .marble')].map(c => c.getAttribute('cx') + ',' + c.getAttribute('cy')).join('|');
    const a = grab(); renderJourney(); const b = grab();
    return a === b;
  });
  check('a marble never jumps position between renders', stable);

  // ---------- progress card is honest ----------
  const pcard = await page.evaluate(() => ({
    all: document.getElementById('pcard').innerText,
    stats: [...document.querySelectorAll('#pcard .pl')].map(e => e.innerText).join(' | ')
  }));
  check('progress card disclaims clinical meaning', /not a diagnosis/i.test(pcard.all));
  check('progress card claims no behavioural improvement',
    !/less angry|improv|better behav|reduc|calmer|fewer meltdown/i.test(pcard.stats), pcard.stats);
  check('progress card measures practice, not symptoms',
    /Sessions completed/.test(pcard.stats) && /Strategies tried/.test(pcard.stats), pcard.stats);
  check('calendar note normalises gaps', /Gaps are normal/.test(await page.evaluate(() => document.getElementById('cal-note').textContent)));

  // ---------- child-facing view is opt-in only ----------
  const childView = await page.evaluate(() => ({
    hidden: !document.getElementById('s-jarshow').classList.contains('on'),
    reachableFromIsland: !!document.querySelector('#s-island [data-go="jarshow"]')
  }));
  check('child jar view is not on the island', childView.hidden && !childView.reachableFromIsland, JSON.stringify(childView));
  await page.click('#btn-show-child');
  await page.waitForTimeout(600);
  check('grown-up can open the jar for the child on purpose', await page.isVisible('#s-jarshow'));
  const praise = await page.evaluate(() => document.getElementById('jar-praise').textContent);
  check('child view praises effort, not behaviour', /something you did/.test(praise), praise);
  await page.screenshot({ path: 'j-child.png' });
  await page.click('#s-jarshow [data-go="island"]');
  await page.waitForTimeout(400);

  // ---------- export and restore carry the journey ----------
  await page.click('#btn-parent'); await page.waitForTimeout(350);
  const q2 = await page.textContent('#gate-q'); const m2 = q2.match(/(\d+) × (\d+)/);
  for (const d of String(+m2[1] * +m2[2])) await page.click(`[data-k="${d}"]`);
  await page.click('[data-k="✓"]'); await page.waitForTimeout(700);
  const exp = JSON.parse(await page.inputValue('#export-box'));
  check('export includes wins, ratings and milestones',
    Array.isArray(exp.wins) && exp.wins.length === 200 && !!exp.ratings && !!exp.milestones,
    'wins ' + (exp.wins || []).length);

  const restored = await page.evaluate(payload => {
    S.wins = S.wins.slice(0, 5); S.milestones = {}; save();     // simulate a wipe
    const d = JSON.parse(payload);
    const seenW = new Set(S.wins.map(w => w.t));
    S.wins = S.wins.concat(d.wins.filter(w => !seenW.has(w.t))).sort((a, b) => b.t - a.t).slice(0, 300);
    Object.keys(d.milestones).forEach(k => { if (!S.milestones[k]) S.milestones[k] = d.milestones[k]; });
    save();
    return { wins: S.wins.length, ms: Object.keys(S.milestones).length };
  }, JSON.stringify(exp));
  check('restore rebuilds the jar without duplicating it', restored.wins === 200, JSON.stringify(restored));
  check('restore rebuilds milestones', restored.ms === Object.keys(exp.milestones).length, JSON.stringify(restored));

  console.log('\nPASS (' + ok.length + ')'); ok.forEach(o => console.log('  ✓ ' + o));
  console.log('\nFAIL (' + bad.length + ')'); bad.forEach(f => console.log('  ✗ ' + f));
  console.log('\nJS ERRORS (' + errors.length + ')'); errors.forEach(e => console.log('  ' + e));
  await browser.close();
  process.exit(bad.length || errors.length ? 1 : 0);
})();
