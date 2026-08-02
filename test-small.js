const { chromium } = require('playwright');
const path = require('path');

// Small-screen regression pass: iPhone SE (375x667). Checks nothing overflows
// its screen container and the onboarding header no longer collides.
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport:{width:375,height:667}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type()==='error') errors.push('CONSOLE: ' + m.text()); });

  await page.goto('http://localhost:8099/');
  await page.waitForTimeout(500);

  const clipped = await page.evaluate(() => {
    const s = document.querySelector('.screen.on');
    const first = s.querySelector('h1');
    return { scrollTop: s.scrollTop, headerTop: first.getBoundingClientRect().top, screenTop: s.getBoundingClientRect().top };
  });
  console.log('onboard header top >= screen top:', clipped.headerTop >= clipped.screenTop - 1, clipped);
  await page.screenshot({ path: 'small-1-onboard.png' });

  await page.click("text=I've got it, let's start");
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'small-2-island.png' });

  for (const wx of ['hot','much','fizzy','rainy','scared','wiggly']) {
    await page.click(`[data-wx="${wx}"]`);
    await page.waitForTimeout(350);
    const fits = await page.evaluate(() => {
      const s = document.querySelector('.screen.on');
      return s.scrollHeight <= s.clientHeight + 2;
    });
    console.log(`summon ${wx} fits without scroll:`, fits);
    await page.click('#btn-begin');
    await page.waitForTimeout(700);
    await page.screenshot({ path: `small-3-${wx}.png` });
    await page.click('#btn-quit');
    await page.waitForTimeout(400);
  }

  console.log('\n--- ERRORS (' + errors.length + ') ---');
  errors.forEach(e => console.log(e));
  await browser.close();
})();
