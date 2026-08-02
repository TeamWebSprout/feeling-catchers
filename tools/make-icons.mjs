/* Renders the Chirp app icons from inline SVG using headless Chromium. */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || './icons');

const art = (inset = 0) => `
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#63CFFF"/><stop offset="1" stop-color="#1E9AE0"/>
  </linearGradient>
  <linearGradient id="chick" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFE07A"/><stop offset="1" stop-color="#FFB525"/>
  </linearGradient>
</defs>
<g transform="translate(256 256) scale(${1 - inset}) translate(-256 -256)">
  <!-- speech bubble -->
  <path d="M112 128h288a44 44 0 0 1 44 44v148a44 44 0 0 1-44 44H236l-72 62v-62h-52a44 44 0 0 1-44-44V172a44 44 0 0 1 44-44z"
        fill="#FFFFFF"/>
  <!-- chick -->
  <path d="M232 176 q-4 -40 26 -50 q-22 20 -6 50z" fill="#FFC94D"/>
  <ellipse cx="238" cy="248" rx="86" ry="78" fill="url(#chick)"/>
  <ellipse cx="212" cy="234" rx="13" ry="16" fill="#2C3E57"/>
  <ellipse cx="266" cy="234" rx="13" ry="16" fill="#2C3E57"/>
  <circle cx="217" cy="228" r="4.6" fill="#fff"/><circle cx="271" cy="228" r="4.6" fill="#fff"/>
  <path d="M226 268 h26 l-13 20z" fill="#FF8A33" stroke="#FF8A33" stroke-width="6" stroke-linejoin="round"/>
  <ellipse cx="176" cy="278" rx="18" ry="11" fill="#FF8AD1" opacity=".55"/>
  <ellipse cx="300" cy="278" rx="18" ry="11" fill="#FF8AD1" opacity=".55"/>
  <!-- sound waves -->
  <g fill="none" stroke="#26C1FC" stroke-width="17" stroke-linecap="round">
    <path d="M344 214 a48 48 0 0 1 0 66"/>
    <path d="M378 188 a86 86 0 0 1 0 118"/>
  </g>
</g>`;

const svg = (size, { maskable = false } = {}) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  ${maskable
    ? `<rect width="512" height="512" fill="url(#bgSolid)"/><defs><linearGradient id="bgSolid" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="#63CFFF"/><stop offset="1" stop-color="#1E9AE0"/></linearGradient></defs>`
    : `<rect width="512" height="512" rx="112" fill="url(#bg)"/>`}
  ${art(maskable ? 0.22 : 0.03)}
</svg>`;

const page = async (browser, size, opts) => {
  const p = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg(size, opts)}</body></html>`);
  const buf = await p.screenshot({ omitBackground: true });
  await p.close();
  return buf;
};

const browser = await chromium.launch();
await fs.mkdir(OUT, { recursive: true });
await fs.writeFile(path.join(OUT, 'icon-192.png'), await page(browser, 192, {}));
await fs.writeFile(path.join(OUT, 'icon-512.png'), await page(browser, 512, {}));
await fs.writeFile(path.join(OUT, 'apple-touch-icon.png'), await page(browser, 180, {}));
await fs.writeFile(path.join(OUT, 'icon-maskable-512.png'), await page(browser, 512, { maskable: true }));
await fs.writeFile(path.join(OUT, 'icon.svg'), svg(512, {}));
await browser.close();
console.log('icons written to', OUT);
