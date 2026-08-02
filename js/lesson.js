/* ============================================================
   Chirp — lesson builder
   Turns a topic's word list into an escalating ladder of stages.
   ============================================================ */
import { LESSONS, allWords } from './data.js';
import { passMark } from './state.js';

export const shuffle = a => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [x[i], x[j]] = [x[j], x[i]]; }
  return x;
};
const pick = (a, n) => shuffle(a).slice(0, n);

/* stage plans per world — later worlds lean harder on speaking */
const PLAN = [
  /* world 0 */ ['listen','listen','listen','listen','listen','listen','match','picture','picture','build',
                 'picture','choose','build','phrase','phrase','phrase','blank','boss'],
  /* world 1 */ ['listen','listen','listen','listen','match','picture','picture','picture','picture','build',
                 'choose','phrase','phrase','phrase','blank','blank','sentence','boss'],
  /* world 2 */ ['listen','listen','listen','match','picture','picture','picture','picture','build','phrase',
                 'phrase','phrase','blank','blank','sentence','sentence','choose','boss']
];

const SPEAKING = new Set(['listen','picture','phrase','blank','sentence','boss']);

export const STAGE_LABEL = {
  listen:  'Listen & Repeat',
  picture: 'Name the Picture',
  build:   'Word Builder',
  match:   'Match the Pairs',
  choose:  'Listening',
  phrase:  'Say the Phrase',
  blank:   'Fill the Gap',
  gym:     'Pronunciation Gym',
  sentence:'Say the Sentence',
  boss:    'Speed Round'
};

function decoyWords(lesson, word, n = 3) {
  const same = lesson.words.filter(w => w.w !== word.w).map(w => w.w);
  const others = allWords().filter(w => w.lesson !== lesson.id).map(w => w.w);
  return pick([...pick(same, Math.min(n, same.length)), ...pick(others, n)], n);
}

function decoyLetters(word, n) {
  const pool = 'abcdefghijklmnoprstuvwy'.split('').filter(c => !word.includes(c));
  return pick(pool, n);
}

/**
 * Build the ordered stage list for a lesson.
 * Every stage carries its own difficulty knobs so the ramp is explicit.
 */
export function buildStages(lesson) {
  const plan = PLAN[lesson.world] || PLAN[0];
  const total = plan.length;
  const pool = shuffle(lesson.words);
  let wi = 0;
  const nextWord = () => { const w = pool[wi % pool.length]; wi++; return w; };

  const stages = plan.map((type, i) => {
    const t = i / (total - 1);                              // 0 → 1 through the lesson
    const pass = passMark(lesson, i, total);
    const retries = i < total * 0.35 ? 2 : (i < total * 0.8 ? 1 : 1);
    const base = { type, index: i, total, pass, retries, label: STAGE_LABEL[type], speaking: SPEAKING.has(type) };

    switch (type) {
      case 'listen': {
        const w = nextWord();
        return { ...base, word: w, target: w.w, hint: 'full', autoplay: true,
                 prompt: 'Listen, then say it', timeLimit: null };
      }
      case 'picture': {
        const w = nextWord();
        const hint = lesson.world === 0 && t < 0.55 ? 'partial' : 'none';
        return { ...base, word: w, target: w.w, hint, autoplay: false,
                 prompt: 'What is this? Say it out loud', timeLimit: lesson.world > 0 ? 20000 : null };
      }
      case 'phrase': {
        const w = nextWord();
        return { ...base, word: w, target: w.ph, hint: t > 0.7 ? 'partial' : 'full', autoplay: t < 0.6,
                 prompt: 'Say the whole phrase', timeLimit: lesson.world > 0 ? 22000 : null };
      }
      case 'blank': {
        const w = nextWord();
        return { ...base, word: w, target: w.s, gap: w.w, sentence: w.s, hint: 'none', autoplay: false,
                 prompt: 'Fill the gap — say the whole sentence', timeLimit: 24000 };
      }
      case 'sentence': {
        const w = nextWord();
        return { ...base, word: w, target: w.s, hint: t > 0.85 ? 'partial' : 'full', autoplay: t < 0.9,
                 prompt: 'Read the sentence out loud', timeLimit: 26000 };
      }
      case 'build': {
        const w = nextWord();
        const extra = lesson.world === 0 ? 1 : (lesson.world === 1 ? 2 : 3);
        const letters = shuffle([...w.w.split(''), ...decoyLetters(w.w, extra)]);
        return { ...base, word: w, target: w.w, letters, prompt: 'Build the word', speaking: false,
                 timeLimit: lesson.world > 1 ? 40000 : null };
      }
      case 'choose': {
        const w = nextWord();
        const opts = shuffle([w.w, ...decoyWords(lesson, w, 3)]);
        return { ...base, word: w, target: w.w, options: opts, prompt: 'Which word did you hear?',
                 speaking: false, timeLimit: lesson.world > 0 ? 15000 : null };
      }
      case 'match': {
        const set = pick(lesson.words, Math.min(4 + lesson.world, lesson.words.length));
        return { ...base, pairs: set, prompt: 'Match each word to its picture', speaking: false,
                 timeLimit: lesson.world > 0 ? 45000 : null };
      }
      case 'boss': {
        const n = 4 + lesson.world;                 // 4 / 5 / 6 rapid prompts
        const per = [12000, 9500, 8000][lesson.world];
        const items = pick(lesson.words, Math.min(n, lesson.words.length)).map((w, k) => ({
          word: w,
          target: lesson.world === 2 && k % 2 === 1 ? w.ph : w.w
        }));
        return { ...base, items, perMs: per, retries: 0, hint: 'none',
                 pass: Math.min(90, pass + 4), prompt: 'Speed Round! Say each word fast' };
      }
      default:
        return base;
    }
  });

  return stages;
}

/* stars from final accuracy + whether hearts survived */
export function starsFor(accuracy, lostHearts) {
  if (accuracy >= 88 && lostHearts === 0) return 3;
  if (accuracy >= 78) return 3;
  if (accuracy >= 62) return 2;
  return 1;
}

export function xpFor(stars, lesson, bossWon) {
  return 12 + stars * 9 + lesson.world * 4 + (bossWon ? 10 : 0);
}

export function starsReward(stars, lesson) {
  return 18 + stars * 12 + lesson.world * 6;
}

/* practice deck for the training games / pronunciation gym */
export function practiceDeck(mastery, n = 12) {
  const all = allWords();
  const scored = all.map(w => {
    const rec = mastery[w.w.toLowerCase()];
    // unseen words rank mid; weak words rank first
    const weight = rec ? (1 - rec.m) * 2 + (rec.n < 2 ? .4 : 0) : 0.9;
    return { ...w, weight, rec };
  });
  return scored.sort((a, b) => b.weight - a.weight + (Math.random() - .5) * .35).slice(0, n);
}

export const lessonsWithProgress = progress =>
  LESSONS.map((l, i) => ({ ...l, idx: i, stat: progress[l.id] || null }));
