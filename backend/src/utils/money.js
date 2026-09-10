/**
 * Money is stored and computed as PostgreSQL NUMERIC, returned by `pg` as strings.
 * All arithmetic here works on Numbers only at the point of computing a ratio/display
 * value for the API response - never as the source of truth for storage.
 */

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}

/** Safe percentage: never returns NaN/Infinity. */
function safePercentage(numerator, denominator) {
  const denom = toNumber(denominator);
  if (denom === 0) return 0;
  return (toNumber(numerator) / denom) * 100;
}

/** Round to 2 decimals for API responses. */
function round2(value) {
  return Math.round(toNumber(value) * 100) / 100;
}

module.exports = { toNumber, safePercentage, round2 };
