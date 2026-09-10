function pad(n) {
  return String(n).padStart(2, '0');
}

function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayISO() {
  return toISODate(new Date());
}

function startOfWeekISO(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1; // week starts Monday
  d.setDate(d.getDate() - diff);
  return toISODate(d);
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function elapsedDaysInMonth(year, month) {
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  return isCurrentMonth ? now.getDate() : daysInMonth(year, month);
}

function previousMonth(year, month) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

module.exports = {
  toISODate,
  todayISO,
  startOfWeekISO,
  daysInMonth,
  elapsedDaysInMonth,
  previousMonth,
};
