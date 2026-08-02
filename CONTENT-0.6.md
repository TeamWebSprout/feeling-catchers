# Feeling Catchers 0.6 — the content expansion

Supersedes §2 of the design doc, which said "do not ship more than four creatures." That was the wrong rule stated for the right reason. The reason still holds: **no creature ships unless it adds a regulation strategy the others don't cover.** Eleven of them now clear that bar, so eleven ship.

---

## 1. Splitting the diagnosis first

"They'll get bored" is one of three separate failure modes, and it's not the one that decides whether parents keep the app.

| Failure | What it looks like | The fix |
|---|---|---|
| **Thin catalogue** | Four activities, seen them all in week one | More strategies (§2) |
| **No variation** | The same five grounding prompts, the same figure-8, the same line of dialogue every single time | Variation *inside* each activity (§3) |
| **Narrow coverage** | Only useful during a meltdown, so used twice a week | Situation entries (§4) |

Volume was the least important of the three. A 60-second tool with four activities and real variation beats one with twenty activities that each play identically. And the reason a parent stops opening an app is almost never "my child got bored" — it's that the moments where they *would* have reached for it weren't covered. Bedtime, leaving the park, and the supermarket queue are where the demand actually is.

All three are now fixed. §4 is the one I'd defend hardest as the reason a parent keeps it.

---

## 2. The roster: eleven strategies

| Creature | Feeling / situation | Strategy | Evidence footing |
|---|---|---|---|
| **Ember** | Angry | Paced breathing, long exhale | Reasonable. Extended exhalation has the most plausible parasympathetic mechanism of anything here |
| **Zipp** | Worried | Slow motor tracing | Weak as a named intervention. Works as attention anchoring plus deliberate motor slowing |
| **Drip** | Sad | Rhythmic entrainment | Weak. Present mainly because it models sitting *with* sadness rather than fixing it |
| **Mossle** | Overwhelmed | 5-4-3-2-1 grounding | Widely used clinically, thin trial evidence in young children. Gets eyes off the screen, which is its own argument |
| **Squeezle** | Body tension, frustration | Progressive muscle relaxation | **Strongest in the app.** Jarraya et al. ran a kindergarten RCT of PMR and found gains in attention and executive functioning |
| **Thrummer** | Needs soothing | Humming exhale | Mechanism is just a long out-breath, which is solid. The specific vagal claims made for humming are not; treat those as marketing |
| **Wobble** | Scared | Bilateral left-right tapping | **Weakest.** Widely used with frightened children; evidence for the bilateral component specifically is contested. Here for steady rhythm and cross-body focus, not because the mechanism is settled |
| **Snug** | Bedtime | Body scan and wind-down | Reasonable for sleep onset. The screen dimming to near-black and ending in silence is the part that matters |
| **Nooma** | Can't name it | Emotion granularity ladder | Real construct, slow-developing. The payoff is years out, not in this session. What it buys today is a shared word |
| **Bounder** | Wiggly, restless | Wiggle then freeze | Good footing. Freeze-style games are one of the few play formats with a real link to inhibitory control at this age |
| **Loop** | Leaving somewhere fun | Goodbye ritual | Not a calming exercise at all. Advance warning plus a predictable ending is the standard advice for transitions |

Two honest notes. **The evidence is uneven and I have not levelled it up by pretending.** Squeezle and Bounder have the best footing; Wobble has the worst and I'd cut it first if something had to go. **None of this supports a clinical claim** — see §7 of the Field Test Kit, which has not changed.

The point of eleven strategies is not that each one is proven. It's that children respond to wildly different ones, and a parent needs enough shots on goal to find the one that works for *their* child. The parent panel now reports exactly that: which strategies have been used, which worked most often, which are untried.

---

## 3. Variation: run ten is not run one

- **Grounding:** 24 prompts across two banks, 5 drawn per run. A home bank and an out-and-about bank.
- **Tracing:** four paths (figure-eight, circle, wave, square loop), rotating.
- **Breathing:** cycle count rotates 4 / 5 / 6, so it doesn't feel like a fixed timer.
- **PMR:** five body parts drawn from a bank of eight.
- **Dialogue:** every creature has three opening lines instead of one. This is the cheapest fix in the whole list and probably the most noticeable to a child.
- **Naming:** four broad feelings, each with four narrower ones, so sixteen endings.

---

## 4. Situations: the dependability layer

A new row on the island, framed for the parent rather than the child: **"Or we're about to…"**

- **Bedtime** → Snug's body scan. This is the one that converts the app from occasional to nightly.
- **Time to go** → Loop's goodbye ritual. Transitions cause more meltdowns at this age than almost anything else. The coaching line says to run it *before* announcing you're leaving, not after the crying starts.
- **Waiting** → Mossle with the out-and-about prompt bank. I-spy is the canonical waiting-room activity; this is the same mechanic pointed at a different room.

The parent dashboard now counts these alongside calm-day practice in the practice-to-rescue ratio, because using the app ahead of a known flashpoint is the same behaviour the ratio was built to encourage.

---

## 5. Keeping the entry to one tap

Eleven activities could easily make things worse. A dysregulated four-year-old presented with eleven choices is a four-year-old who throws the phone.

**The child never picks an activity.** They pick a *feeling*, which is the therapeutic act anyway, and the app chooses the pal. Six feeling cards plus Sunny, exactly as before. The roster grows behind that fixed surface.

**Discovery is paced.** Each feeling starts with one pal. A second appears after 3 settled sessions of that feeling, a third after 8. A child who uses "Roary Hot" a lot meets Squeezle in week one and Bounder in week two; a child who never feels scared never meets Wobble, which is correct. First meetings get a "Someone new is on the island!" banner.

**The collection screen shows three mystery slots, not eleven.** Eleven empty question marks on day one reads as a chore list. Three plus "and 8 more still hiding" reads as a secret.

---

## 6. Together mode

On the two breathing-type activities, a second button on the summon screen: **"Do it together (two thumbs)."** The orb only grows while *both* a parent's thumb and a child's are on the screen. Release either and it stops.

This is the co-regulation thesis from §0.1 of the design doc made literal and unavoidable. It is also the single most testable thing in this release: if families use it, the whole "prop for two people" framing is validated. If they don't, that framing is wishful and the product needs rethinking. The session log records which sessions were Together, so the two-week test will answer it.

---

## 7. What I did not add, and why

- **Streaks, badges, daily rewards.** Standard retention machinery, aimed at a five-year-old, in a mental-health tool. No.
- **Push notifications.** Available on installed iOS PWAs since 16.4. Still no — see §0.4 of the design doc.
- **A creature the child can pick directly.** Would undo §5. If testing shows children resent not choosing, the fix is a small "someone else?" swap on the summon screen, not a roster menu.
- **Microphone-based humming detection.** Thrummer is the obvious place for it and it's still the wrong first bet, for every reason in §0.3.

---

## 8. What this expansion costs

Being straight about the tradeoff, since the design doc argued the other way three days ago:

- **Voice-over scope roughly tripled.** Eleven activities of scripted prompts, and pre-recorded VO is a P0 for shipping. This is the single biggest cost of the expansion.
- **More to get wrong under stress.** Eleven mechanics is eleven things that can confuse a child mid-meltdown. The one-tap entry protects against this; testing has to confirm it.
- **The MVP is no longer minimal.** The four-activity build could have been tested a week earlier. I think coverage is worth that week, because the thing being tested is whether parents *depend* on it, and four activities could never have answered that. But it is a real delay and I'd rather name it than let it pass as free.
- **Some of these will fail.** Eleven strategies means some are duds for any given family. That's the design: the parent panel exists to find the two or three that work and let the rest go.

---

## 9. Verification

`test-content.js` — 34 checks, all passing, zero console errors:

- all eleven mechanics driven to completion through the real UI
- discovery gating (1 pal fresh → 2 at three sessions → 3 at eight)
- one tap from island to summon, one more to the mechanic
- Waiting draws from the out-and-about bank, not the home one
- grounding prompts differ across six consecutive runs
- window listeners torn down after each session (they leaked before this release)
- parent panel labels situations, feelings and the chosen emotion word readably
- strategy coverage populated across all eleven

Plus the existing suites still green: `test-pwa.js` (28), `test-update.js` (9), `test-small.js` (iPhone SE layout).

---

## Sources

- Jarraya S, Jarraya M, Engel FA. *Kindergarten-Based Progressive Muscle Relaxation Training Enhances Attention and Executive Functioning: A Randomized Controlled Trial.* Perceptual and Motor Skills. https://pubmed.ncbi.nlm.nih.gov/35090365/
- Nook EC, Sasse SF, Lambert HK, McLaughlin KA, Somerville LH. *The Nonlinear Development of Emotion Differentiation: Granular Emotional Experience Is Low in Adolescence.* Psychological Science. https://journals.sagepub.com/doi/full/10.1177/0956797618773357
- Radesky JS et al. *Longitudinal Associations Between Use of Mobile Devices for Calming and Emotional Reactivity and Executive Functioning in Children Aged 3 to 5 Years.* JAMA Pediatrics. https://jamanetwork.com/journals/jamapediatrics/fullarticle/2799042
