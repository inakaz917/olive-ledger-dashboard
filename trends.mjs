import { CATEGORY_META, categoryFor } from "./categories.mjs?v=20260907-trends1";
import { jstDateKey } from "./periods.mjs?v=20260907-1";
import { filteredPayments, comparePeriod, trendSeries } from "./trend-data.mjs?v=1";

const yen = (value) => new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(value);
const signed = (value) => `${value > 0 ? "+" : ""}${yen(value)}`;
const cards = { olive: "Olive", epos: "エポス", paypay_card: "PayPay", aeon: "イオン" };
const RENT = 120000, WANT = 280000, MUST = 320000;
const VARIABLE_WANT = WANT - RENT, VARIABLE_MUST = MUST - RENT;
const CATEGORY_BUDGETS = { "食費": 65000, "生活・買い物": 15000, "移動": 25000, "健康・自己投資": 45000, "余暇・旅行": 8000, "その他・不明": 2000 };
const FOOD_BUDGETS = { "コンビニ・自販機・売店": 8000, "カフェ・軽食": 5000, "外食（ランチ・ディナー）": 22000, "飲み会・酒": 18000, "スーパー・食料品": 12000 };
function node(tag, text, cls) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (cls) el.className = cls;
  return el;
}
const rangeLabel = (b, mode) => mode === "month"
  ? `${b.start.slice(0, 4)}年${Number(b.start.slice(5, 7))}月`
  : `${b.start.replaceAll("-", "/")}〜${b.end.replaceAll("-", "/")}`;
const dateFromKey = (key) => new Date(`${key}T00:00:00Z`);
const dayCount = (start, end) => Math.round((dateFromKey(end) - dateFromKey(start)) / 86400000) + 1;
const daysInMonth = (key) => new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)), 0)).getUTCDate();
function prorated(monthly, start, end) {
  let total = 0, cursor = dateFromKey(start), final = dateFromKey(end);
  while (cursor <= final) { const key = cursor.toISOString().slice(0, 10); total += monthly / daysInMonth(key); cursor.setUTCDate(cursor.getUTCDate() + 1); }
  return Math.round(total);
}
function isBudgetItem(payment) {
  const category = categoryFor(payment);
  return !["旅行・帰省・宿泊", "投資", "返金・取消"].includes(category)
    && !(category === "スポーツ" && payment.amount >= 100000 && (payment.merchant_raw ?? "").toUpperCase().includes("GOLFTEC"));
}
const categoryMajor = (payment) => CATEGORY_META.find((item) => item.name === categoryFor(payment))?.major ?? "その他・不明";

export function setupTrends(root, getPayments) {
  let mode = "week", endOffset = 0, selected = 0, rowLimit = 30, alignLatest = true;
  root.innerHTML = `
    <div class="hero-row"><div><p class="eyebrow">SPENDING TRENDS</p><h1>支出の変化を、<br>見つける。</h1><p class="hero-copy">週と月を並べて、使い方の変化を確かめましょう。</p></div></div>
    <div class="trend-controls">
      <div class="period-tabs" aria-label="比較単位"><button type="button" data-mode="week">週ごと</button><button type="button" data-mode="month">月ごと</button></div>
      <label>カード <select id="trend-source"><option value="all">すべて</option><option value="olive">Olive</option><option value="epos">エポス</option><option value="paypay_card">PayPay</option><option value="aeon">イオン</option></select></label>
      <label>カテゴリ <select id="trend-category"><option value="all">すべて</option></select></label>
      <label class="investment-toggle"><input type="checkbox" id="trend-investment"> 投資を含める</label>
    </div>
    <p id="trend-scope" class="trend-note"></p>
    <section class="panel budget-overview"><div class="budget-heading"><div><p class="eyebrow">BUDGET</p><h2 id="budget-title">今週の予算</h2></div><span id="budget-period"></span></div><div class="budget-metrics"><div><span id="budget-want-label"></span><strong id="budget-want"></strong><i><b id="budget-want-bar"></b></i></div><div><span id="budget-must-label"></span><strong id="budget-must"></strong><i><b id="budget-must-bar"></b></i></div><div><span id="budget-forecast-label"></span><strong id="budget-forecast"></strong><small id="budget-spent"></small></div></div><p id="budget-excluded" class="trend-note"></p></section>
    <section class="panel"><div class="panel-heading"><h2 id="trend-chart-title">12週間の推移</h2></div>
      <p class="trend-note">棒を選ぶと、その期間の内訳を表示します。薄い棒は集計途中。マイナスは返金等の差引です。</p>
      <div class="trend-chart-scroll"><div id="trend-bars" class="trend-bars" aria-label="期間別支出合計"></div></div>
      <p id="trend-coverage" class="trend-note"></p>
    </section>
    <div class="trend-details"><section class="panel category-budget"><h2>カテゴリごと・対予算</h2><div id="category-budget"></div></section><section class="panel food-budget"><h2>食費・対予算詳細</h2><div id="food-budget"></div></section></div>
    <section class="panel payments-panel"><div class="panel-heading"><h2>選択期間の決済</h2><span id="trend-rows-count"></span></div><div class="table-wrap"><table><thead><tr><th>日付</th><th>店舗</th><th>カテゴリ</th><th>カード</th><th>金額</th></tr></thead><tbody id="trend-rows"></tbody></table></div><button type="button" id="trend-more" class="secondary-button">さらに30件表示</button></section>`;
  const el = (id) => root.querySelector(`#${id}`);
  for (const c of CATEGORY_META) {
    const option = node("option", c.name); option.value = c.name; el("trend-category").append(option);
  }
  function render() {
    const now = new Date();
    const all = getPayments();
    const investment = el("trend-investment").checked;
    const investmentOption = [...el("trend-category").options].find((o) => o.value === "投資");
    investmentOption.disabled = !investment;
    if (!investment && el("trend-category").value === "投資") el("trend-category").value = "all";
    const items = filteredPayments(all, { investment, source: el("trend-source").value, category: el("trend-category").value });
    const series = trendSeries(items, mode, endOffset, now);
    const result = comparePeriod(items, mode, selected, now);
    const budgetResult = comparePeriod(all.filter(isBudgetItem), mode, selected, now);
    const budgetItems = budgetResult.items;
    const budgetSpent = budgetResult.amount;
    const wantLimit = mode === "month" ? VARIABLE_WANT : prorated(VARIABLE_WANT, budgetResult.start, budgetResult.end);
    const mustLimit = mode === "month" ? VARIABLE_MUST : prorated(VARIABLE_MUST, budgetResult.start, budgetResult.end);
    const fullDays = dayCount(budgetResult.start, budgetResult.end);
    const elapsedDays = dayCount(budgetResult.start, budgetResult.currentEnd);
    const forecast = budgetResult.partial ? Math.round(budgetSpent / elapsedDays * fullDays) : budgetSpent;
    const firstDate = all.length ? all.map((p) => jstDateKey(p.paid_at)).sort()[0] : null;
    const lastDate = all.length ? all.map((p) => jstDateKey(p.paid_at)).sort().at(-1) : null;
    root.querySelectorAll("[data-mode]").forEach((b) => { b.classList.toggle("active", b.dataset.mode === mode); b.setAttribute("aria-pressed", String(b.dataset.mode === mode)); });
    el("trend-scope").textContent = investment ? "投資を含む合計を表示しています。" : "生活費を表示しています（投資を除外）。返金・取消は差し引いて集計します。";
    el("budget-title").textContent = mode === "week" ? "今週の予算" : "今月の予算";
    el("budget-period").textContent = rangeLabel(budgetResult, mode) + (budgetResult.partial ? " · 集計途中" : "");
    el("budget-want-label").textContent = mode === "month" ? "Want 28万円（家賃確保後16万円）" : `Want 週利用枠 ${yen(wantLimit)}`;
    el("budget-must-label").textContent = mode === "month" ? "Must 32万円（家賃確保後20万円）" : `Must 週利用枠 ${yen(mustLimit)}`;
    el("budget-want").textContent = budgetSpent <= wantLimit ? `残り ${yen(wantLimit - budgetSpent)}` : `超過 ${yen(budgetSpent - wantLimit)}`;
    el("budget-must").textContent = budgetSpent <= mustLimit ? `残り ${yen(mustLimit - budgetSpent)}` : `超過 ${yen(budgetSpent - mustLimit)}`;
    el("budget-forecast").textContent = yen(forecast);
    el("budget-forecast-label").textContent = mode === "week" ? "週末予想" : "月末予想";
    el("budget-spent").textContent = `現在 ${yen(budgetSpent)}`;
    el("budget-want-bar").style.width = `${Math.min(100, budgetSpent / wantLimit * 100)}%`;
    el("budget-must-bar").style.width = `${Math.min(100, budgetSpent / mustLimit * 100)}%`;
    el("budget-excluded").textContent = mode === "month" ? "総予算から家賃12万円を確保した利用枠です。旅行・投資・ゴルフテックの高額一括払いは別枠です。" : "家賃を除く月間利用枠を、この週の日数で按分しています。旅行・投資・高額一括払いは別枠です。";
    const factor = mode === "month" ? 1 : wantLimit / VARIABLE_WANT;
    const food = el("food-budget"); food.replaceChildren();
    for (const [name, monthlyLimit] of Object.entries(FOOD_BUDGETS)) { const limit = Math.round(monthlyLimit * factor); const amount = budgetItems.filter((p) => categoryFor(p) === name).reduce((sum, p) => sum + p.amount, 0); const row = node("div", undefined, "food-budget-row"); row.append(node("span", name), node("strong", `${yen(amount)} / ${yen(limit)}`)); const bar = node("i"), fill = node("b"); fill.style.width = `${Math.min(100, amount / limit * 100)}%`; if (amount >= limit) fill.classList.add("over-limit"); else if (amount >= limit * .9) fill.classList.add("near-limit"); bar.append(fill); row.append(bar); food.append(row); }
    const categoryBudget = el("category-budget"); categoryBudget.replaceChildren();
    for (const [name, monthlyLimit] of Object.entries(CATEGORY_BUDGETS)) { const limit = Math.round(monthlyLimit * factor); const amount = budgetItems.filter((p) => categoryMajor(p) === name).reduce((sum, p) => sum + p.amount, 0); const row = node("div", undefined, "food-budget-row"); row.append(node("span", name), node("strong", `${yen(amount)} / ${yen(limit)}`)); const bar = node("i"), fill = node("b"); fill.style.width = `${Math.min(100, amount / limit * 100)}%`; if (amount >= limit) fill.classList.add("over-limit"); else if (amount >= limit * .9) fill.classList.add("near-limit"); bar.append(fill); row.append(bar); categoryBudget.append(row); }
    el("trend-chart-title").textContent = mode === "week" ? "12週間の推移" : "12か月の推移";
    el("trend-coverage").textContent = firstDate ? `取得済み決済：${firstDate}〜${lastDate}。未収録期間は「未収録」と表示します。明細の未取得がある場合、合計・比較もその影響を受けます。` : "まだ決済データがありません。";
    const bars = el("trend-bars"); bars.replaceChildren();
    const scale = Math.max(1, ...series.map((b) => Math.abs(b.amount)));
    for (const b of series) {
      const available = firstDate && b.end >= firstDate;
      const label = mode === "week" ? `${Number(b.start.slice(5, 7))}/${Number(b.start.slice(8))}` : `${b.start.slice(2, 4)}/${b.start.slice(5, 7)}`;
      const button = node("button", undefined, "trend-bar"); button.type = "button";
      button.classList.toggle("selected", b.offset === selected); button.classList.toggle("partial", b.partial);
      button.setAttribute("aria-pressed", String(b.offset === selected));
      button.setAttribute("aria-label", `${rangeLabel(b, mode)} ${available ? yen(b.amount) : "未収録"}${b.partial ? " 集計途中" : ""}`);
      button.append(node("span", available ? yen(b.amount) : "未収録", "trend-bar-value"));
      const track = node("span", undefined, "trend-bar-track"), fill = node("i");
      fill.style.height = `${Math.abs(b.amount) / scale * 100}%`;
      if (b.amount < 0) fill.classList.add("negative");
      track.append(fill); button.append(track, node("span", label), node("small", b.partial ? "途中" : " "));
      button.addEventListener("click", () => { selected = b.offset; rowLimit = 30; alignLatest = false; render(); }); bars.append(button);
    }
    if (alignLatest) { const scroll = root.querySelector(".trend-chart-scroll"); requestAnimationFrame(() => { scroll.scrollLeft = scroll.scrollWidth; }); alignLatest = false; }
    const rows = el("trend-rows"); rows.replaceChildren();
    const ordered = [...result.items].sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at));
    for (const p of ordered.slice(0, rowLimit)) {
      const row = node("tr"); for (const text of [jstDateKey(p.paid_at), p.merchant_raw, categoryFor(p), cards[p.source] ?? p.source, yen(p.amount)]) row.append(node("td", text)); rows.append(row);
    }
    el("trend-rows-count").textContent = `${Math.min(rowLimit, ordered.length)} / ${ordered.length}件`;
    el("trend-more").hidden = ordered.length <= rowLimit;
  }
  root.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => { mode = b.dataset.mode; selected = 0; endOffset = 0; rowLimit = 30; alignLatest = true; render(); }));
  root.querySelectorAll("select,input").forEach((input) => input.addEventListener("change", () => { rowLimit = 30; render(); }));
  el("trend-more").addEventListener("click", () => { rowLimit += 30; render(); });
  return { render };
}
