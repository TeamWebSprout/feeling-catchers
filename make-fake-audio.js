/* Generates a WAV that Chromium can use as a fake microphone, so the voice
   pipeline is exercised for real instead of being assumed to work.
   Pattern: 2.0s near-silence, 1.0s of voice-like tone, repeating. Chromium
   loops the file, so utterances keep arriving for as long as a test listens. */
const fs = require('fs');

const RATE = 16000, QUIET = 2.0, LOUD = 1.0, CYCLES = 12;
const samples = [];

function push(sec, fn) {
  const n = Math.round(sec * RATE);
  for (let i = 0; i < n; i++) samples.push(fn(i / RATE, i));
}

for (let c = 0; c < CYCLES; c++) {
  // room tone, well under the detector's floor
  push(QUIET, () => (Math.random() - 0.5) * 0.002);
  // a voice-ish burst: low fundamental + harmonics + a little noise,
  // with soft attack/release so it doesn't read as a click
  push(LOUD, (t) => {
    const env = Math.min(1, t / 0.05) * Math.min(1, (LOUD - t) / 0.08);
    const s = 0.45 * Math.sin(2 * Math.PI * 300 * t)
            + 0.18 * Math.sin(2 * Math.PI * 600 * t)
            + 0.09 * Math.sin(2 * Math.PI * 900 * t)
            + (Math.random() - 0.5) * 0.03;
    return s * env;
  });
}

const data = Buffer.alloc(samples.length * 2);
samples.forEach((v, i) => {
  const c = Math.max(-1, Math.min(1, v));
  data.writeInt16LE(Math.round(c * 32767), i * 2);
});

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);          // PCM
header.writeUInt16LE(1, 22);          // mono
header.writeUInt32LE(RATE, 24);
header.writeUInt32LE(RATE * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);

fs.writeFileSync('/tmp/fake-voice.wav', Buffer.concat([header, data]));
console.log('wrote /tmp/fake-voice.wav',
  (samples.length / RATE).toFixed(1) + 's,',
  Math.round((header.length + data.length) / 1024) + 'KB');
