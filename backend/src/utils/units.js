// Gems are stored as INTEGER "units" (1 Gem = 100 units) so 0.5 Gem = 50 units.
// This avoids floating point drift (e.g. 0.1 + 0.2) in balances and ledger rows.
export const UNITS_PER_GEM = 100;
export const toUnits = (gems) => Math.round(Number(gems) * UNITS_PER_GEM);
export const toGems = (units) => units / UNITS_PER_GEM;
