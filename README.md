# Feeling Catchers — PWA build 0.7.1

Installable, offline-first, no backend, no accounts, no analytics, no network calls at runtime. Everything the child does stays on their device.

Supersedes §1 of the Field Test Kit: **hosting is now required** for the full experience. The app still opens from a plain file, it just loses installability and offline caching (see "Fallback" below).

---

## Files

```
index.html               the whole app (UI, mechanics, storage, PWA layer)
sw.js                    service worker — precaches the shell, serves cache-first
manifest.webmanifest     name, icons, standalone display, launch shortcuts
icons/                   192/512 standard + 192/512 maskable + apple-touch + favicon
icons/source-*.svg       vector sources, re-rasterise if you change the art
serve.js                 tiny local static server for development
test-pwa.js              28 checks: manifest, SW, offline, storage, recovery
test-update.js           proves a mid-test deploy reaches installed testers
test-loop.js             all four mechanics end to end
test-small.js            small-screen (iPhone SE) layout regression
test-content.js          34 checks: all 11 mechanics, discovery gating, variation
CONTENT-0.6.md           what the content expansion added and why
test-journey.js          39 checks: the jar, milestones, ratings, honesty of the card
PROGRESS-0.7.md          the parent progress section and its design constraints
audit-mobile.js          PWA installability + mobile layout audit across 6 viewports
```

---

## Run it locally

```bash
node serve.js          # http://localhost:8080
```

`localhost` counts as a secure context, so service workers, wake lock and the install prompt all work there. Opening `index.html` straight from disk does **not** register a service worker (browsers block that on `file://`).

## Run the tests

```bash
node serve.js 8099 &
node test-pwa.js       # exits non-zero on any failure
node test-update.js
node test-loop.js
node test-small.js
```

Requires Playwright with Chromium.

---

## Deploy

Any static host works. The app uses only relative paths, so it runs correctly from a subdirectory (`example.com/feelings/`) as well as a domain root.

**HTTPS is mandatory.** Service workers, wake lock and installation all refuse to run on plain HTTP.

| Host | How |
|---|---|
| **Netlify Drop** | Drag this folder onto `app.netlify.com/drop`. No account needed to start. Fastest path to a link. |
| **Cloudflare Pages** | `npx wrangler pages deploy .` |
| **GitHub Pages** | Push the folder, enable Pages on the branch. Works from `/repo-name/` because paths are relative. |
| **Vercel** | `npx vercel --prod` |

### One server-config detail that matters

`manifest.webmanifest` must be served as `application/manifest+json`. Netlify, Cloudflare Pages and Vercel do this already. Some Nginx and Apache defaults do not, and the symptom is silent: the install prompt just never appears. If installation isn't offered on Android, check the response's `Content-Type` first.

### Deploying an update mid-test

1. Change whatever you changed.
2. **Bump `CACHE_VERSION` in `sw.js`.** If you skip this, testers keep the old build forever.
3. Deploy.

Installed testers get a "A newer version is ready" bar on next launch. They keep using the old build until they tap Update, so a deploy can't interrupt a child mid-session. Their pals and session log survive the update — verified by `test-update.js`.

---

## What the PWA layer adds beyond the single-file prototype

**Installable.** Home-screen icon, full-screen launch, portrait lock, no browser chrome. Android and desktop Chrome get a real install button; iOS gets a one-time instruction sheet, because Safari has no programmatic install.

**Works with no signal.** The entire shell is precached on first visit. Meltdowns happen in cars, supermarkets and on planes. Cold launch in airplane mode is a tested path, not an aspiration.

**Storage that survives a two-week test.** This is the part that actually motivated the rebuild. WebKit caps *all* script-writable storage — localStorage, IndexedDB, service worker registrations and Cache API alike — at seven days of Safari use without interaction with the site. A family who tries the app, gets busy for a week and comes back would find their pals gone. Two defences:

1. **Home Screen apps are exempt.** Apple's own wording: "Web applications added to the home screen are not part of Safari and thus have their own counter of days of use." This is why the install prompt is not a nice-to-have here, and why the app nags about it in a Safari tab.
2. **Dual-write.** Every save goes to localStorage (synchronous, instant boot) *and* IndexedDB (durability mirror). If the fast store comes back empty on launch, the app silently restores from the mirror and drops you on the island. Also covers private browsing, where localStorage may be blocked while IndexedDB works.

Plus `navigator.storage.persist()` on launch, which Chrome grants to installed PWAs, and a **Restore from file** button so a parent can rebuild from a previous export if everything is lost anyway.

**Screen stays awake during a session.** A phone that dims halfway through a breathing exercise breaks the exercise. Wake Lock is acquired on entering a mechanic, released on leaving, and re-acquired when the page becomes visible again. Silently skipped where unsupported.

**Launch shortcuts.** Long-press the icon on Android for "Sunny practice" and "Grown-ups".

**Health panel.** The Grown-ups screen now reports install state, offline readiness, whether both storage systems are working, eviction protection, and space used. If a tester says "it lost everything," that panel tells you which layer failed instead of leaving you guessing.

---

## Known platform limits

- **iOS install is manual and Safari-only.** No `beforeinstallprompt`, no programmatic install. Chrome and Firefox on iOS cannot install web apps at all. Budget for hand-holding in your tester instructions; it is the single biggest drop-off point.
- **Web push needs iOS 16.4+ and an installed app.** Not used here by choice: notification-driven re-engagement aimed at a 5-year-old is the pattern this product exists to avoid. See §0.4 of the design doc.
- **~50MB storage ceiling on iOS.** Irrelevant at this size (the whole app is under 400KB), but it constrains any future audio or video assets. Pre-recorded voice-over is the first thing that will press against it.
- **Apple briefly removed home-screen web apps in the EU under the DMA in early 2024, then reversed before iOS 17.4 shipped.** They work in the EU today. Worth knowing the risk exists if the PWA becomes your only distribution channel.
- **No background anything.** No background sync, no periodic sync, no background fetch on iOS. Nothing here needs them.

## Fallback

`index.html` still works when opened directly from disk — service worker registration is skipped on `file://` and the app degrades to a plain offline HTML page with in-memory or localStorage state. Verified. Useful if you want to hand a single file to one tester without hosting anything, but you lose installability, offline caching and eviction protection.

---

## Sources for the platform claims

- WebKit, *Full Third-Party Cookie Blocking and More* (the 7-day cap and the home-screen exemption): https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
- MDN, *Screen Wake Lock API*: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- TechCrunch, *Apple reverses decision about blocking web apps on iPhones in the EU*: https://techcrunch.com/2024/03/01/apple-reverses-decision-about-blocking-web-apps-on-iphones-in-the-eu/
