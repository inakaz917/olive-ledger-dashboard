import { jstDateKey, weekBounds } from "./periods.mjs?v=20260907-1";
import { categoryFor } from "./categories.mjs?v=20260907-trends1";

const key = (date) => date.toISOString().slice(0, 10);
const date = (value) => new Date(`${value}T00:00:00Z`);
const shift = (value, days) => { const d = date(value); d.setUTCDate(d.getUTCDate() + days); return key(d); };

export function periodBounds(mode, offset = 0, now = new Date()) {
  const today = jstDateKey(now);
  if (mode === "week") return weekBounds(`week:${offset}`, now);
  const d = date(today);
  const start = key(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1)));
  const end = key(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset + 1, 0)));
  return { start, end, offset };
}

export function filteredPayments(payments, { source = "all", category = "all", investment = false } = {}) {
  return payments.filter((p) => (source === "all" || p.source === source)
    && (investment || categoryFor(p) !== "投資")
    && (category === "all" || categoryFor(p) === category));
}

export function inRange(payments, start, end) {
  return payments.filter((p) => {
    const day = jstDateKey(p.paid_at);
    return day >= start && day <= end;
  });
}
export const total = (payments) => payments.reduce((sum, p) => sum + Number(p.amount), 0);
export function categories(payments) {
  const sums = new Map();
  for (const p of payments) {
    const category = categoryFor(p);
    sums.set(category, (sums.get(category) ?? 0) + Number(p.amount));
  }
  return [...sums].sort((a, b) => b[1] - a[1]);
}

export function comparePeriod(payments, mode, offset = 0, now = new Date()) {
  const current = periodBounds(mode, offset, now);
  const previous = periodBounds(mode, offset - 1, now);
  const today = jstDateKey(now);
  const partial = current.start <= today && current.end >= today;
  const currentEnd = partial ? today : current.end;
  const elapsedDays = Math.round((date(currentEnd) - date(current.start)) / 86400000);
  const previousEnd = partial
    ? [shift(previous.start, elapsedDays), previous.end].sort()[0]
    : previous.end;
  const items = inRange(payments, current.start, currentEnd);
  const previousItems = inRange(payments, previous.start, previousEnd);
  const amount = total(items), previousAmount = total(previousItems);
  const currentCats = new Map(categories(items)), previousCats = new Map(categories(previousItems));
  const changes = [...new Set([...currentCats.keys(), ...previousCats.keys()])]
    .map((name) => ({ name, amount: currentCats.get(name) ?? 0,
      previous: previousCats.get(name) ?? 0,
      difference: (currentCats.get(name) ?? 0) - (previousCats.get(name) ?? 0) }))
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  return { ...current, currentEnd, previous, previousEnd, partial, items, previousItems,
    amount, previousAmount, difference: amount - previousAmount,
    percent: previousAmount > 0 ? (amount - previousAmount) / previousAmount * 100 : null,
    changes };
}

export function trendSeries(payments, mode, endOffset = 0, now = new Date()) {
  return Array.from({ length: 12 }, (_, i) => {
    const bounds = periodBounds(mode, endOffset - 11 + i, now);
    const today = jstDateKey(now);
    const end = [bounds.end, today].sort()[0];
    return { ...bounds, amount: total(inRange(payments, bounds.start, end)),
      partial: bounds.start <= today && bounds.end >= today };
  });
}
