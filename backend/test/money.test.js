const { safePercentage, round2, toNumber } = require('../src/utils/money');

describe('money utils', () => {
  test('safePercentage returns 0 when denominator is 0, never NaN/Infinity', () => {
    expect(safePercentage(500, 0)).toBe(0);
    expect(Number.isFinite(safePercentage(500, 0))).toBe(true);
  });

  test('safePercentage computes normal ratio', () => {
    expect(safePercentage(50, 200)).toBe(25);
  });

  test('toNumber parses NUMERIC strings from pg safely', () => {
    expect(toNumber('123.45')).toBe(123.45);
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
  });

  test('round2 rounds to two decimals', () => {
    expect(round2(10.126)).toBe(10.13);
    expect(round2('19.999')).toBe(20);
  });
});
