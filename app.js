import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { categoryFor, categoryMeta } from "./categories.mjs?v=20260730-3";

const SUPABASE_URL = "https://pfmdykcnjpnktvhqpvrx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_JuVghU9v3d12FmLlBRlOiA_n1A5xj2B";
const ALLOWED_EMAIL = "inakaz917@gmail.com";
const CARD_NAMES = {
  olive: "Olive",
  epos: "エポス",
  paypay_card: "PayPayカード",
  aeon: "イオン",
};
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
let payments = [];
let period = "30";
let source = "all";

const byId = (id) => document.getElementById(id);
const show = (id) => { byId(id).hidden = false; };
const hide = (id) => { byId(id).hidden = true; };

byId("google-signin").addEventListener("click", async () => {
  byId("signin-error").hidden = true;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: new URL("./", window.location.href).href, queryParams: { prompt: "select_account" } },
  });
  if (error) {
    byId("signin-error").textContent = "Googleログインを開始できませんでした。もう一度お試しください。";
    byId("signin-error").hidden = false;
  }
});

document.querySelectorAll(".signout").forEach((button) => button.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.replace(new URL("./", window.location.href).href);
}));

byId("period-tabs").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-period]");
  if (!button) return;
  period = button.dataset.period;
  document.querySelectorAll("#period-tabs button").forEach((item) => item.classList.toggle("active", item === button));
  render();
});


byId("source-tabs").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-source]");
  if (!button) return;
  source = button.dataset.source;
  document.querySelectorAll("#source-tabs button").forEach((item) => item.classList.toggle("active", item === button));
  render();
});
function filteredPayments() {
  const cutoff = period === "all" ? null : Date.now() - Number(period) * 24 * 60 * 60 * 1000;
  return payments.filter((item) => {
    const inPeriod = cutoff === null || new Date(item.paid_at).getTime() >= cutoff;
    const isSource = source === "all" || item.source === source;
    return inPeriod && isSource;
  });
}

function totalsBy(items, keyFn) {
  const result = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    result.set(key, (result.get(key) ?? 0) + item.amount);
  });
  return [...result.entries()].sort((a, b) => b[1] - a[1]);
}

function initials(name) {
  return [...name.replace(/\s+/g, "")].slice(0, 2).join("").toUpperCase();
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function empty(container, message = "この期間の決済はありません。") {
  container.replaceChildren(element("p", "empty-state", message));
}

function cardName(item) {
  return CARD_NAMES[item.source] ?? item.payment_method ?? "その他";
}

function render() {
  const items = filteredPayments();
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const merchants = totalsBy(items, (item) => item.merchant_norm || item.merchant_raw);
  const categories = totalsBy(items, categoryFor);
  const periodLabel = period === "all" ? "全期間" : "直近" + period + "日";
  const sourceLabel = source === "all" ? "すべてのカード" : CARD_NAMES[source];
  const label = periodLabel + "・" + sourceLabel;

  byId("total").textContent = yen.format(total);
  byId("count").textContent = `${items.length}件`;
  byId("average").textContent = yen.format(items.length ? Math.round(total / items.length) : 0);
  byId("range").textContent = label;
  byId("top-merchant").textContent = merchants[0]?.[0] ?? "—";
  byId("top-merchant-total").textContent = merchants[0] ? yen.format(merchants[0][1]) : "データなし";
  byId("payment-count").textContent = `${items.length}件`;

  const categoryList = byId("category-list");
  const categoryDonut = byId("category-donut");
  categoryList.replaceChildren();
  byId("category-total").textContent = yen.format(total);

  if (!categories.length) {
    categoryDonut.style.background = "#e9e9e2";
    empty(categoryList);
  } else {
    let cursor = 0;
    const segments = [];

    categories.forEach(([name, amount]) => {
      const meta = categoryMeta(name);
      const share = total ? amount / total : 0;
      const start = cursor;
      cursor += share * 360;
      segments.push(
        meta.color + " " + start + "deg " + cursor + "deg"
      );

      const item = element("li", "category-item");
      const identity = element("div", "category-identity");
      const dot = element("i", "category-dot");
      dot.style.backgroundColor = meta.color;
      const labels = element("div", "category-labels");
      labels.append(
        element("strong", "", name),
        element("span", "", meta.major)
      );
      identity.append(dot, labels);

      const values = element("div", "category-values");
      values.append(
        element("b", "", yen.format(amount)),
        element("span", "", (share * 100).toFixed(1) + "%")
      );

      const progress = element("span", "category-progress");
      const fill = element("i");
      fill.style.width = (share * 100).toFixed(2) + "%";
      fill.style.backgroundColor = meta.color;
      progress.append(fill);

      item.append(identity, values, progress);
      categoryList.append(item);
    });

    categoryDonut.style.background =
      "conic-gradient(" + segments.join(", ") + ")";
  }

  const merchantList = byId("merchant-list");
  merchantList.replaceChildren();
  if (!merchants.length) empty(merchantList);
  else {
    const max = merchants[0][1];
    merchants.slice(0, 5).forEach(([name, amount], index) => {
      const item = element("li");
      item.append(element("span", "rank", String(index + 1).padStart(2, "0")), element("span", "merchant-avatar", initials(name)));
      const info = element("div");
      info.append(element("strong", "", name));
      const progress = element("span", "merchant-progress");
      const fill = element("i");
      fill.style.width = `${amount / max * 100}%`;
      progress.append(fill);
      info.append(progress);
      item.append(info, element("b", "", yen.format(amount)));
      merchantList.append(item);
    });
  }

  const rows = byId("payment-rows");
  rows.replaceChildren();
  items.slice(0, 20).forEach((item) => {
    const row = element("tr");
    row.append(element("td", "", dateTime.format(new Date(item.paid_at))));
    const merchantCell = element("td");
    const merchant = element("span", "table-merchant");
    merchant.append(element("i", "", initials(item.merchant_raw)), document.createTextNode(item.merchant_raw));
    merchantCell.append(merchant);
    row.append(merchantCell);
    const methodCell = element("td");
    methodCell.append(element("span", "method-pill source-" + item.source, cardName(item)));
    row.append(methodCell, element("td", "", yen.format(item.amount)));
    rows.append(row);
  });
}

function paymentQuery() {
  return supabase
    .from("payments")
    .select("id,paid_at,amount,merchant_raw,merchant_norm,payment_method,source,category_mid,category_major,category_method,category_confidence")
    .order("paid_at", { ascending: false })
    .limit(500);
}

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

async function loadPayments() {
  const retryDelays = [0, 1000, 3000, 7000, 12000];
  let result;
  let sessionRefreshed = false;

  for (const delay of retryDelays) {
    if (delay) await wait(delay);
    result = await paymentQuery();
    if (!result.error) return result;

    if (!sessionRefreshed && result.error.code !== "PGRST002") {
      const refreshed = await supabase.auth.refreshSession();
      sessionRefreshed = true;
      if (!refreshed.error && refreshed.data.session) {
        result = await paymentQuery();
        if (!result.error) return result;
      }
    }

    if (result.error.code !== "PGRST002") return result;
  }
  return result;
}

async function start() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { show("signin"); return; }
  const email = session.user.email?.toLowerCase();
  hide("signin");
  if (email !== ALLOWED_EMAIL) { show("denied"); return; }

  byId("account-button").textContent = `${email} からログアウト`;
  show("dashboard");
  const { data, error } = await loadPayments();
  if (error) {
    const code = error.code ?? "unknown";
    byId("data-error").textContent = "支出データを取得できませんでした。ログアウトして再ログインしてください。（エラーコード: " + code + "）";
    byId("data-error").hidden = false;
    return;
  }
  payments = data ?? [];
  render();
}

start();
