# Chirp — Say It Right

A speak-out-loud English app for kids, built as an installable Progressive Web App.
Kids see a picture, say the word into the microphone, and get a pronunciation score
back with per-word feedback. Levels get harder as they climb.

No build step, no dependencies, no backend. Everything is plain HTML, CSS and ES modules.

---

## Run it

The microphone only works on `https://` or `localhost` — that is a browser rule, not an app
limitation. Opening `index.html` by double-clicking (a `file://` URL) will **not** work,
because ES modules and service workers are blocked there too.

**Option 1 — double-click (macOS)**

```
chmod +x start.command      # once, in Terminal
```

Then double-click `start.command`. It serves the folder and opens the app.

**Option 2 — one line in Terminal**

```
cd "path/to/Kids App/chirp" && python3 -m http.server 8080
```

Open <http://localhost:8080>

**Option 3 — Node**

```
npx serve -l 8080 .
```

### On a phone

Put the folder on any static host (Netlify drop, Vercel, GitHub Pages, Cloudflare Pages)
and open the https URL on the phone. Then:

- **iOS Safari** → Share → *Add to Home Screen*
- **Android Chrome** → the *Add Chirp to your home screen* prompt appears automatically

Once installed it runs full-screen with no browser chrome, and works offline (the service
worker caches the whole app). Speech recognition in Chrome still needs a connection —
Chrome sends audio to Google's recogniser. Safari on newer iOS can recognise on-device.

---

## Browser support for the speaking part

| Browser | Speaking scored? | Notes |
|---|---|---|
| Chrome / Edge (desktop, Android) | Yes | Needs internet for recognition |
| Safari (iOS 14.5+, macOS) | Yes | Often on-device |
| Samsung Internet | Yes | |
| Firefox | No | No Web Speech API. Chirp falls back to **record-and-compare**: it records the child, plays it next to the model voice, and they self-rate. |
| Any browser, mic denied | — | Chirp offers **tap mode**: speaking stages become word-choice questions so the lesson is still completable. |

All three paths are handled in-app with a clear explanation, not a dead end.

---

## How the pronunciation score works

There is no server, so scoring is built from what a browser can actually provide:

1. **The n-best list.** The recogniser returns up to 5 guesses. If the target word is guess
   #1 the delivery was crisp; if it only turns up at #3 it was recognisable but muddy, and
   the score is docked.
2. **Phonetic distance.** Both the target and the transcript are converted to Metaphone
   codes and compared with an edit distance whose substitution costs are sound-aware.
   Near-misses that differ only by voicing (b/p, d/t, s/z, k/g, f/v, m/n) cost half a point.
   Pedagogically important contrasts are deliberately *not* forgiven — `θ` ("th") has its
   own class, so *three → tree* and *three → free* are marked down.
3. **A wrong first sound costs extra.** The onset is the most audible cue, so `sun → fun`
   scores much lower than `jacket → jackit`.
4. **Per-word alignment.** For phrases and sentences, words are aligned with dynamic
   programming and scored individually — the chips under the gauge show which word let them
   down. The final number is `0.65 × mean + 0.35 × worst`, so one badly missed word cannot
   be averaged away.
5. **Confidence** nudges the result by at most ±7 points. It is noisy across browsers, so it
   is deliberately given little weight.

Calibration reference (measured, not estimated):

| Said | Heard | Score | Verdict |
|---|---|---|---|
| sun | sun | 99 | Perfect |
| sun | son *(homophone — pronounced correctly)* | 85 | Great |
| sun | sunk | 72 | Good |
| sun | fun | 50 | So close |
| sun | banana | 21 | Not quite |
| three | tree | 55 | So close |
| three | free | 47 | So close |
| jacket | jackit | 92 | Great |
| a red dress | a red truck | 70 | Good |
| a red dress | red dress | 43 | So close |

**Honest limitation:** this is a strong proxy, not true phoneme-level assessment. Real
pronunciation scoring (per-phoneme goodness, stress, intonation) needs a server-side
acoustic model such as Azure Pronunciation Assessment or Speechace. Chirp reliably separates
*said it right* / *close* / *not that word*, which is what a practice loop needs. It cannot
tell you the child's vowel was 40 Hz off target.

---

## How the difficulty ramps

Every lesson is 18 stages generated from its word list. Three dials tighten together:

**Within a lesson** — the pass mark climbs 14 points from the first stage to the boss;
hints go `full word` → `f··· l·····` → `nothing but a picture`; time limits appear late;
targets grow from single words → phrases → gapped sentences → full sentences.

**Across a lesson** — each further topic inside a world adds 1.2 points to the bar.

**Across worlds** — each new world adds 10 points, which is more than the whole within-world
climb, so the bar always steps up at a world boundary.

Measured end-to-end (pass mark on the first / last stage):

| Lesson | World | First | Last | Boss |
|---|---|---|---|---|
| Weather | Meadow | 55% | 73% | 4 words, 12s each |
| Colors | Meadow | 61% | 79% | 4 words, 12s each |
| Food | Desert | 65% | 83% | 5 words, 9.5s each |
| Numbers | Desert | 71% | 89% | 5 words, 9.5s each |
| Sea Life | Ocean | 75% | 90% | 6 items, 8s each |
| Sports | Ocean | 81% | 90% | 6 items, 8s each |

Extra pressure appears with the worlds too: more decoy letters in the word builder, more
pairs to match, more speaking stages, shorter clocks, and a boss round with no retries.
There is also a **hint cap**: on a hidden-target stage, tapping *Hear it* caps that stage at
85%, so the easy way out has a price.

A global **Pass mark** setting (Easy / Normal / Strict) shifts every threshold by ±9 points
for kids who need a gentler or tougher run.

---

## The nine stage types

| Stage | Speaking | What it drills |
|---|---|---|
| Listen & Repeat | ✅ | Copy the model voice, everything visible |
| Name the Picture | ✅ | Recall + produce, word masked or hidden |
| Say the Phrase | ✅ | 2–4 words, linking sounds |
| Fill the Gap | ✅ | Say a whole sentence with a word missing on screen |
| Say the Sentence | ✅ | Full sentence fluency |
| Speed Round (boss) | ✅ | Rapid fire, no hints, no retries, a clock per word |
| Word Builder | tap | Spelling, with decoy letters |
| Match the Pairs | tap | Word ↔ meaning / picture |
| Listening | tap | Hear it, pick it out of four |

---

## Game systems

- **Hearts** — 5 lives, one lost per failed stage, one regenerating every 10 minutes
- **Stars** — earned per lesson, spent on 5 hearts (300) or unlimited hearts for a day (900)
- **XP and levels** — quadratic curve, level-up celebration
- **Streaks** — daily, with a 7-day strip on the profile
- **12 achievements** — first word, 100 words, 5 perfect scores, boss beaten, world cleared…
- **Word mastery** — an exponential moving average per word, shown as a coloured ring in the
  dictionary and used to build the practice deck (weakest words come up first)
- **Training** — Pronunciation Gym, Listening, Word Constructor, Word→Translation,
  Translation→Word, and a mixed Brainstorm drill
- **Dictionary** — every word, searchable, filterable by New / Learning / Mastered, each row
  with a play button and a one-tap mic practice sheet

---

## Files

```
index.html                 shell + splash
manifest.webmanifest       PWA manifest (standalone, portrait, shortcuts)
sw.js                      service worker, offline-first app shell
start.command              double-click launcher for macOS
css/app.css                the whole design system
js/app.js                  bootstrap, router, tab bar, install prompt
js/data.js                 curriculum: 3 worlds, 18 lessons, 108 words + phrases + sentences
js/lesson.js               stage generator and the difficulty ramp
js/exercise.js             the lesson runner — all nine stage types, hearts, results
js/screens.js              onboarding, map, training, mini games, dictionary, profile
js/speech.js               recognition wrapper, Metaphone, scoring engine
js/state.js                save file, economy, progression, achievements
js/audio.js                text-to-speech, synthesised sound effects, mic level meter
js/ui.js                   DOM helpers, modals, sheets, gauges, confetti
js/svg.js                  all artwork — six mascots, icons, scenery, logo
icons/                     generated app icons
tools/make-icons.mjs       regenerates the icons (needs playwright)
```

Every sound is synthesised with WebAudio and every illustration is inline SVG or emoji, so
there are no binary assets to lose and the whole app is a few hundred kilobytes.

---

## Adding content

Open `js/data.js` and add to `LESSONS`. One entry per topic:

```js
{
  id: 'jungle', world: 0, title: 'Jungle', icon: '🌴', color: '#8DD54F', mascot: 'frog',
  words: [
    { w:'monkey', t:{ es:'mono', fr:'singe' }, e:'🐒',
      ph:'a noisy monkey', s:'A noisy monkey swings above the path.' }
  ]
}
```

`w` is the English word, `t` the translations, `e` the picture, `ph` a short phrase, `s` a
full sentence. The 18 stages, the boss round, the dictionary entry and the difficulty
thresholds are all generated from that. Six words per lesson keeps the pacing right.

Bump `VERSION` in `sw.js` after any edit so returning users get the new files.

---

## Tested

Driven end to end in headless Chromium at 320 px, 390 px and 820 px wide:
full onboarding, both a world-1 and a world-3 lesson through all nine stage types to the
completion screen, the training games, the gym, the dictionary practice sheet, the profile,
the no-speech-engine fallback, the mic-denied fallback, offline reload after killing the
network, and the hearts/stars economy. No console errors.
