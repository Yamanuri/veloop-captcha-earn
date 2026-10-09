export const fmtGems = (n) => (n == null ? '—' : Number(n).toFixed(2));
export const fmtReward = (n) => `+${Number.isInteger(n) ? n : Number(n).toFixed(1)}`;
export const gemWord = (n) => (Number(n) === 1 ? 'Gem' : 'Gems');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
