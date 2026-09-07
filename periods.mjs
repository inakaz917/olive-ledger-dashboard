const JST_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function jstDateKey(value) {
  const parts = Object.fromEntries(
    JST_PARTS.formatToParts(new Date(value))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function availableMonths(payments) {
  return [...new Set(payments.map((item) => jstDateKey(item.paid_at).slice(0, 7)))]
    .sort()
    .reverse();
}

function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function shiftedDateKey(key, days) {
  const date = dateFromKey(key);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function weekBounds(period = "week:0", now = new Date()) {
  const offset = period.startsWith("week:") ? Number(period.slice(5)) : 0;
  const today = jstDateKey(now);
  const dayFromMonday = (dateFromKey(today).getUTCDay() + 6) % 7;
  const start = shiftedDateKey(today, -dayFromMonday + offset * 7);
  return { start, end: shiftedDateKey(start, 6), offset };
}

export function dailyTotalsForWeek(payments, period = "week:0", now = new Date()) {
  const { start } = weekBounds(period, now);
  const totals = new Map();
  payments.forEach((item) => {
    const key = jstDateKey(item.paid_at);
    totals.set(key, (totals.get(key) ?? 0) + item.amount);
  });
  return ["月", "火", "水", "木", "金", "土", "日"].map((label, index) => {
    const dateKey = shiftedDateKey(start, index);
    return { label, dateKey, amount: totals.get(dateKey) ?? 0 };
  });
}

export function filterPaymentsByPeriod(payments, period, now = new Date()) {
  const nowTime = now.getTime();
  const currentYear = jstDateKey(now).slice(0, 4);
  return payments.filter((item) => {
    const itemTime = new Date(item.paid_at).getTime();
    const dateKey = jstDateKey(item.paid_at);
    if (period === "all") return true;
    if (period === "ytd") return dateKey.startsWith(`${currentYear}-`);
    if (period.startsWith("month:")) return dateKey.startsWith(period.slice(6));
    if (period.startsWith("week:")) {
      const { start, end } = weekBounds(period, now);
      return dateKey >= start && dateKey <= end;
    }
    return itemTime >= nowTime - Number(period) * 24 * 60 * 60 * 1000;
  });
}

export function periodLabel(period, now = new Date()) {
  if (period === "all") return "全期間";
  if (period === "ytd") return `${jstDateKey(now).slice(0, 4)}年`;
  if (period.startsWith("week:")) {
    const { start, end } = weekBounds(period, now);
    const [startYear, startMonth, startDay] = start.split("-").map(Number);
    const [endYear, endMonth, endDay] = end.split("-").map(Number);
    const endLabel = startYear === endYear
      ? `${endMonth}月${endDay}日`
      : `${endYear}年${endMonth}月${endDay}日`;
    return `${startYear}年${startMonth}月${startDay}日〜${endLabel}`;
  }
  if (period.startsWith("month:")) {
    const [year, month] = period.slice(6).split("-");
    return `${year}年${Number(month)}月`;
  }
  return `直近${period}日`;
}
