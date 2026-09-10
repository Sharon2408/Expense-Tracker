const { percentChange } = require('../src/modules/analytics/analytics.service');

describe('percentChange (month-over-month)', () => {
  test('computes normal percentage increase', () => {
    expect(percentChange(23450, 19500)).toBeCloseTo(20.26, 1);
  });

  test('computes decrease as negative percentage', () => {
    expect(percentChange(100, 200)).toBe(-50);
  });

  test('previous month of 0 with spending now returns a safe sentinel, not Infinity/NaN', () => {
    const result = percentChange(500, 0);
    expect(result).toBeNull();
    expect(Number.isNaN(result)).toBe(false);
    expect(result).not.toBe(Infinity);
  });

  test('previous month of 0 and current month of 0 returns 0, not NaN', () => {
    expect(percentChange(0, 0)).toBe(0);
  });
});
