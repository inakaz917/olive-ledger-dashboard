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

export function filterPaymentsByPeriod(payments, period, now = new Date()) {
  const nowTime = now.getTime();
  const currentYear = jstDateKey(now).slice(0, 4);
  return payments.filter((item) => {
    const itemTime = new Date(item.paid_at).getTime();
    const dateKey = jstDateKey(item.paid_at);
    if (period === "all") return true;
    if (period === "ytd") return dateKey.startsWith(`${currentYear}-`);
    if (period.startsWith("month:")) return dateKey.startsWith(period.slice(6));
    return itemTime >= nowTime - Number(period) * 24 * 60 * 60 * 1000;
  });
}

export function periodLabel(period, now = new Date()) {
  if (period === "all") return "全期間";
  if (period === "ytd") return `${jstDateKey(now).slice(0, 4)}年`;
  if (period.startsWith("month:")) {
    const [year, month] = period.slice(6).split("-");
    return `${year}年${Number(month)}月`;
  }
  return `直近${period}日`;
}
