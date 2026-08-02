# Feeling Catchers 0.7 — Your Journey

A progress-logging section for parents, behind the parental gate. Reachable from the Grown-ups panel.

---

## 1. Two things that kill features like this

**Manual trackers get abandoned.** Mood diaries, habit apps, sleep logs — drop-off is the norm, not the exception. A feature that asks a parent to write something every day will be empty by week three, and an empty progress screen is worse than none: it reads as a personal failure every time they open it.

So almost nothing here is manual. The jar fills by itself from sessions the app already logs. The parent is asked for exactly two things a sensor cannot see:

- **"Did that help?"** — three taps, and only for meltdown sessions. Asking it about Tuesday-evening practice is meaningless and doubles the workload, so the app doesn't.
- **"They did it without the phone."** — one tap, whenever they spot it.

That second one is the most important output the product can produce and the only real evidence of transfer. It gets the biggest button on the screen.

**Progress screens can lie, and the lie is cruel.** A chart implying "your child is 40% less angry" is unverifiable from this data, and it turns a bad fortnight — which every child has — into apparent failure at the exact moment a parent is least able to absorb it.

So what gets celebrated here is **effort and transfer, never symptom reduction.** The progress card counts sessions, strategies tried, and off-screen moments. It carries the line *"This records what was practised, not a clinical outcome. It is not a diagnosis and it is not evidence of improvement."* A test asserts that no stat line ever claims otherwise.

---

## 2. What's in it

**The Win Jar.** Marbles accumulate in a glass jar. Gold for off-screen moments, green for "really helped", blue for used-before-it-went-wrong, purple for a written note. Tap a marble to read it. Every completed practice or ahead-of-time session drops one automatically, so the jar fills whether or not the parent logs anything.

**One-tap transfer button.** "They did it without the phone."

**Add a moment.** A free-text note, in an in-app sheet rather than a native `prompt()` dialog (which blocks the page and looks wrong in an installed PWA).

**Batched rating.** Unrated meltdown sessions surface one at a time in the parent's own space, never on the child's settle screen. A small dot appears on the gear icon when something is waiting. Skip is permanent — a skipped session is never asked about again.

**Eleven milestones.** First time · Without the phone · Before it went wrong · Five strategies tried · Did one together · Ten sessions · Five bedtimes · Named a feeling · Met everyone · Two weeks in · Ten moments logged.

**Permanent by design.** No streaks, no decay, no broken chains. A milestone earned cannot be revoked, even if the parent later deletes the moment that earned it — there is a test for exactly that.

**Five-week strip.** A calendar of active days coloured by kind, with the note: *"Gaps are normal and expected. A quiet fortnight is not a failure, and this app will never tell you otherwise."*

**Progress card.** A plain summary a parent can screenshot for a partner, a teacher, or a therapist. This is also the artefact that makes the clinician channel plausible.

---

## 3. Why the child doesn't see the jar by default

A jar the child watches filling becomes a reward system, and a reward system for calming down teaches performing calm. It also sets up disappointment on the days it doesn't fill — days that are, definitionally, already bad.

So the jar lives in the parent zone. A deliberate button, **"Show your child"**, opens a full-screen celebratory view. The parent chooses when it's a shared moment instead of it becoming an ambient scoreboard. The praise is worded at effort: *"Every single one is something you did."*

If testing shows children want ongoing access, that's a finding worth acting on. Giving it to them by default would not have been.

---

## 4. What I chose not to build

- **Streaks or consecutive-day counters.** The single most common engagement mechanic and the one most likely to make a parent feel judged for a hard week.
- **Charts of mood over time.** The app has no reliable mood measure. A line going down would be fiction with a confidence-inspiring shape.
- **Sharing to social.** Nothing leaves the device; that's the compliance posture and it should stay.
- **Reminders to log.** Nagging a parent about a wellness diary is how wellness diaries get deleted.

---

## 5. Verification

`test-journey.js` — 39 checks, all passing, zero console errors:

- transfer win → marble → milestone, in one tap
- a milestone is not revoked when the win that earned it is deleted
- calm practice drops a marble with no parent effort at all
- storm sessions are queued for rating; practice sessions are not
- a rating attaches to that exact session, and a skip is never re-asked
- **marbles stay inside the glass at every count from 1 to 200** (marble size steps down as the jar fills; drawing is capped, the count is not)
- a marble never jumps position between renders
- the progress card disclaims clinical meaning and no stat line claims improvement
- the child-facing view is unreachable from the island and only opens deliberately
- export and restore carry wins, ratings and milestones without duplicating them

Existing suites still green: `test-pwa.js` (28), `test-content.js` (34), `test-update.js` (9), `test-small.js`.

Two real defects were caught by these tests during the build: marbles overflowed the jar past about 28 and vanished behind the clip path, and the packing was left-aligned rather than centred in the glass. Both are fixed.

---

## 6. What to watch in the field test

The jar adds one question to the two-week protocol, and it's a good one:

**Does the transfer button ever get pressed?** If ten families run this for two weeks and the count is zero, the product is an engaging toy and not a regulation tool. That was already Q3 of the field test kit, but it was self-report at a fourteen-day interview. Now it's captured in the moment, which is considerably better evidence.
