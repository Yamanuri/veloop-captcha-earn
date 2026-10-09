import crypto from 'node:crypto';

// No look-alike glyphs (0/O, 1/I/L) so the code stays readable for humans.
const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const ALL = LETTERS + DIGITS;
const pick = (s) => s[crypto.randomInt(s.length)];

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Always contains letters AND digits (>=2 of each).
export function generateText(len = 6) {
  const chars = [pick(LETTERS), pick(LETTERS), pick(DIGITS), pick(DIGITS)];
  while (chars.length < len) chars.push(pick(ALL));
  return shuffle(chars).join('');
}

const sameClassChar = (c, avoid) => {
  const pool = DIGITS.includes(c) ? DIGITS : LETTERS;
  let n;
  do n = pick(pool); while (n === c || n === avoid);
  return n;
};

// "Reasonably similar" wrong option: swap neighbours or replace 1-2 chars with the same class.
export function similarVariant(text) {
  const chars = text.split('');
  const mode = crypto.randomInt(3);
  if (mode === 0) {
    const i = crypto.randomInt(chars.length - 1);
    [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
  } else {
    const count = mode; // 1 or 2 substitutions
    const idx = shuffle([...chars.keys()]).slice(0, count);
    idx.forEach((i) => (chars[i] = sameClassChar(chars[i])));
  }
  return chars.join('');
}

// "Completely different": shares no characters with the correct code.
export function differentVariant(text) {
  const availableLetters = shuffle([...LETTERS].filter((character) => !text.includes(character)));
  const availableDigits = shuffle([...DIGITS].filter((character) => !text.includes(character)));
  if (availableLetters.length < 2 || availableDigits.length < 2 || availableLetters.length + availableDigits.length < text.length) {
    throw new Error('Not enough unused characters for a different CAPTCHA option');
  }

  const selected = [...availableLetters.slice(0, 2), ...availableDigits.slice(0, 2)];
  const remaining = shuffle([...availableLetters.slice(2), ...availableDigits.slice(2)]);
  while (selected.length < text.length) selected.push(remaining.pop());
  return shuffle(selected).join('');
}

export function buildChallenge(len = 6) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const text = generateText(len);
    const set = new Set([text]);
    let guard = 0;
    while (set.size < 3 && guard++ < 100) set.add(similarVariant(text));
    if (set.size < 3) continue;
    const different = differentVariant(text);
    if (set.has(different)) continue;
    const options = shuffle([...set, different]);
    if (new Set(options).size === 4) return { captchaText: text, correctOption: text, options };
  }
  throw new Error('Unable to generate challenge');
}
