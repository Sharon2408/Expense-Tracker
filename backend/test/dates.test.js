const { daysInMonth, previousMonth } = require('../src/utils/dates');

describe('date utils', () => {
  test('daysInMonth handles leap years', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
  });

  test('previousMonth wraps across year boundary', () => {
    expect(previousMonth(2026, 1)).toEqual({ year: 2025, month: 12 });
    expect(previousMonth(2026, 9)).toEqual({ year: 2026, month: 8 });
  });
});
