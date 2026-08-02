# Feeling Catchers 0.8 — speech becomes the product

Supersedes the framing in the original design doc. Emotional regulation stays, but it is now the **on-ramp**, not the point: an overwhelmed child will not talk, so settling is how you get to a conversation.

Audience: **children aged 4–7 with delayed or limited speech.**

---

## 1. The two findings that determined the design

**Turns, not words heard.** Romeo et al. found that the number of back-and-forth *conversational turns* — not adult word count — predicted children's language scores and activation in Broca's area. Donnelly & Kidd found the same for vocabulary growth. Quantity of adult talk is a much weaker lever than reciprocity.

**Children learn words worse from screens than from people.** The transfer deficit is well replicated. It shrinks when the screen is *contingent* and when an adult is present alongside.

Together these say something uncomfortable for a speech app: **the app is not the teacher.** The most it can do is manufacture turns between the child and an adult and then get out of the way. So:

- the unit of value is a **conversational turn**, and the app counts them
- the parent panel reports **turns per session**, never minutes
- every activity ends by handing the conversation to the adult, not by scoring the child

---

## 2. Why the microphone does not do speech recognition

You asked for real recognition. I built something different, and this is why.

| Speaker | Word error rate |
|---|---|
| Adults | ~5% |
| Children 6–10 | 15–21% |
| **Kindergarteners 4–6** | **up to 35%** |

Those figures are for *typically developing* children. The models are trained on typical speech, so for children with delayed speech the error rate is higher still. The chosen audience sits exactly where ASR is weakest.

A recogniser wrong a third of the time, used to gate progress, rejects correct attempts at random. For a late talker the behaviour you are trying to increase is *attempting to communicate*, so that is a punishment schedule on the target behaviour — not a UX blemish. Late talkers are frequently already reluctant to speak.

Two practical blockers reinforce it: Chrome's Web Speech API **streams audio to Google servers** (third-party disclosure of a child's voice — separate verifiable parental consent under COPPA, prohibited outright in Apple's Kids Category, and it breaks offline-first), and **iOS Safari does not reliably support `SpeechRecognition` in an installed PWA at all** — so it would not work on the primary platform.

### What the microphone actually does

On-device analysis of **loudness and duration** via an `AnalyserNode`. Nothing is recorded, nothing is stored, nothing is transmitted, and the mic track is released the moment an activity ends.

- **Any vocalisation counts as a turn.** The child cannot fail and is never told they are wrong.
- **Recognition, if ever added, may only reward.** Match → extra delight. No match → nothing, because the child already advanced on the attempt. False negatives then cost zero. That asymmetry is the only safe way to use an unreliable classifier here.
- **Ambient calibration**: the room is sampled for 900ms so a noisy kitchen does not read as constant talking.
- **Fallback**: mic refused or unsupported → a banner tells the grown-up, and tapping the screen counts the turn. The activity is otherwise identical.

---

## 3. Wait time: the app holds the silence

The single most common way an adult stops a late talker from talking is answering for them. Typical adult wait time is 1–2 seconds. A child with delayed speech often needs 5–10.

Every speech activity therefore shows a **six-second ring** and the coaching line tells the parent, plainly, to say nothing while it runs. This is the best possible use of a screen in this product: it disciplines the adult, not the child.

---

## 4. The six speech pals

| Pal | Activity | Technique |
|---|---|---|
| **Chatter** | Says a word, waits, then hands it back one word bigger | Focused stimulation + **expansion/recast** |
| **Boomer** | Grows with a loud voice, shrinks with a whisper | Vocal play — the easiest route to sound from a reluctant child |
| **Gulp** | Wants something behind a gate and simply waits | **Communication temptation** (milieu teaching) — the child initiates |
| **Pip** | "Which one?" with two objects | Choice-making — a reason to use a word rather than a point |
| **Thrummer** | Hold a sound as long as you can, measured by real voice | Phonation duration, the least demanding vocal task |
| **Nooma** | Narrow a broad feeling to a precise one, then say it aloud | Emotional vocabulary |

**Gulp is the one I would watch in testing.** It deliberately gives no instruction — the creature just wants something and waits. Adults find this excruciating and will want to prompt. If families can tolerate the silence, it is the activity most likely to produce spontaneous initiation, which is the hardest and most valuable thing to get.

A **sounds-not-words** setting swaps the word bank for animal and play sounds (`moo`, `vroom`, `uh oh`) for children not yet using words at all.

Nine regulation activities remain, demoted on the island under "Too wobbly to talk?".

---

## 5. Milestone checklist

Ten parent-answered items ("tick what your child **can** do"), never answered by the app. Three outcomes: nothing standing out · worth a conversation · worth getting assessed.

Two deliberate choices:

- **Intelligibility to strangers is a referral flag on its own.** By around four, most children are understood by people outside the family almost all of the time. That single item outweighs the others.
- **Parental concern overrides the checklist.** Even the all-clear ends by saying that if you are still worried, trust that — parental concern is one of the better early signals, and the main harm in speech delay is waiting.

It states plainly that the app does not assess, diagnose or treat anything. It never produces a score.

---

## 6. What this is not

- **Not therapy, and it says so.** It is a practice tool that tries to increase turns.
- **Not a screener.** The checklist is a prompt to seek assessment, never a result.
- **Not evidence of improvement.** The parent panel reports what was practised. There is no claim that turns in the app transfer to turns in life — that is the hypothesis your field test should attack.
- **Not a substitute for an SLP**, and the copy points at one repeatedly.

---

## 7. Verification

`test-speech.js` — 32 checks, all passing. The microphone path is genuinely exercised: Chromium is fed a synthesised WAV (`make-fake-audio.js`) as its input device, so utterance detection, level response, turn counting and the gate mechanic are tested against real audio rather than mocked.

- microphone opens, calibrates to a sane noise floor, detects utterances of plausible duration
- Chatter, Gulp and Boomer complete end to end and count turns from real vocalisations
- Gulp's gate opens on a vocalisation; Boomer scales with level
- the mic track is released when the activity ends
- **with the mic denied**: a banner appears, tapping counts turns, the activity still completes, no errors
- checklist: sparse ticks recommend assessment, intelligibility alone triggers referral, all-clear still defers to parental concern, and it never claims to diagnose

Existing suites still green: `test-pwa.js` (28), `test-content.js` (34), `test-journey.js` (39), `test-update.js` (9), `test-small.js`, and the mobile audit at **0 failures**.

---

## Sources

- Romeo RR et al. *Beyond the 30-Million-Word Gap: Children's Conversational Exposure Is Associated With Language-Related Brain Function.* Psychological Science. https://pmc.ncbi.nlm.nih.gov/articles/PMC6192025
- Donnelly S, Kidd E. *The Longitudinal Relationship Between Conversational Turn-Taking and Vocabulary Growth in Early Language Development.* Child Development. https://onlinelibrary.wiley.com/doi/10.1111/cdev.13511
- Roberts MY, Kaiser AP. *The Effectiveness of Parent-Implemented Language Interventions: A Meta-Analysis.* AJSLP. https://pubs.asha.org/doi/abs/10.1044/1058-0360(2011/10-0055)
- The Learning Agency. *Closing the Child Speech Recognition Gap.* https://the-learning-agency.com/guides-resources/closing-the-child-speech-recognition-gap-evidence-limitations-and-paths-forward/
- Encyclopedia on Early Childhood Development. *Infants, Toddlers and Learning from Screen Media.* https://www.child-encyclopedia.com/technology-early-childhood-education/according-experts/infants-toddlers-and-learning-screen-media
