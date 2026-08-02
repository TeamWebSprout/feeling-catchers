const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  const file = 'http://localhost:8099/';
  await page.goto(file); await page.waitForTimeout(900);
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'shot-1-onboard.png' });

  // enter island
  await page.click("text=I've got it, let's start");
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'shot-2-island.png' });

  // ---- EMBER (breath) ----
  await page.click('[data-wx="hot"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'shot-3-summon.png' });
  await page.click('#btn-begin');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'shot-4-breath.png' });
  // simulate holding during inhale
  const wrap = await page.$('#orbwrap');
  const bb = await wrap.boundingBox();
  for (let i = 0; i < 4; i++) {
    await page.mouse.move(bb.x + bb.width/2, bb.y + bb.height/2);
    await page.mouse.down();
    await page.waitForTimeout(3400);
    await page.mouse.up();
    await page.waitForTimeout(5300);
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'shot-5-settle.png' });
  const settleVisible = await page.isVisible('#s-settle');
  console.log('EMBER -> settle screen visible:', settleVisible);
  if (settleVisible) {
    await page.click('#btn-keep');
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: 'shot-6-island-with-pal.png' });

  // ---- ZIPP (trace) ----
  await page.click('[data-wx="fizzy"]');
  await page.waitForTimeout(400);
  await page.click('#btn-begin');
  await page.waitForTimeout(1000);
  // follow the guide dot
  for (let i = 0; i < 60; i++) {
    const pos = await page.evaluate(() => {
      const svg = document.querySelector('#tw svg');
      const g = document.querySelector('#tg');
      if (!svg || !g) return null;
      const r = svg.getBoundingClientRect();
      const s = Math.min(r.width/400, r.height/320);
      const ox = (r.width - 400*s)/2, oy = (r.height - 320*s)/2;
      return { x: r.left + ox + parseFloat(g.getAttribute('cx'))*s, y: r.top + oy + parseFloat(g.getAttribute('cy'))*s };
    });
    if (!pos) break;
    await page.mouse.move(pos.x, pos.y);
    if (i === 0) await page.mouse.down();
    await page.waitForTimeout(150);
  }
  await page.screenshot({ path: 'shot-7-trace.png' });
  await page.mouse.up();
  await page.waitForTimeout(20000);
  console.log('ZIPP -> settle visible:', await page.isVisible('#s-settle'));
  await page.screenshot({ path: 'shot-8-zipp-settle.png' });
  if (await page.isVisible('#btn-keep')) await page.click('#btn-keep');
  await page.waitForTimeout(400);

  // ---- DRIP (beat) ----
  await page.click('[data-wx="rainy"]');
  await page.waitForTimeout(400);
  await page.click('#btn-begin');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'shot-9-beat.png' });
  const pad = await page.$('#bp'); const pb = await pad.boundingBox();
  for (let i = 0; i < 20; i++) { await page.mouse.click(pb.x + pb.width/2, pb.y + pb.height/2); await page.waitForTimeout(820); }
  await page.waitForTimeout(3000);
  console.log('DRIP -> settle visible:', await page.isVisible('#s-settle'));
  if (await page.isVisible('#btn-keep')) await page.click('#btn-keep');
  await page.waitForTimeout(400);

  // ---- MOSSLE (find5) ----
  await page.click('[data-wx="much"]');
  await page.waitForTimeout(400);
  await page.click('#btn-begin');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'shot-10-find5.png' });
  for (let i = 0; i < 5; i++) { await page.click('#m-leaf'); await page.waitForTimeout(500); }
  await page.waitForTimeout(1200);
  console.log('MOSSLE -> settle visible:', await page.isVisible('#s-settle'));
  if (await page.isVisible('#btn-keep')) await page.click('#btn-keep');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'shot-11-island-full.png' });

  // ---- SUNNY practice ----
  await page.click('[data-wx="sunny"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'shot-12-sunny.png' });
  await page.click('#s-summon [data-go="island"]');
  await page.waitForTimeout(300);

  // ---- PARENT GATE ----
  await page.click('#btn-parent');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'shot-13-gate.png' });
  const q = await page.textContent('#gate-q');
  const m = q.match(/(\d+) × (\d+)/);
  const ans = String(parseInt(m[1]) * parseInt(m[2]));
  for (const d of ans) await page.click(`[data-k="${d}"]`);
  await page.click('[data-k="✓"]');
  await page.waitForTimeout(600);
  console.log('PARENT dashboard visible:', await page.isVisible('#s-parent'));
  await page.screenshot({ path: 'shot-14-parent.png', fullPage: true });

  // persistence check
  await page.reload();
  await page.waitForTimeout(700);
  const palsAfter = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('fc.state')||'{}').pals||{}).length);
  console.log('Pals persisted after reload:', palsAfter);
  await page.screenshot({ path: 'shot-15-after-reload.png' });

  console.log('\n--- ERRORS (' + errors.length + ') ---');
  errors.forEach(e => console.log(e));
  await browser.close();
})();
