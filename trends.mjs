import { CATEGORY_META, categoryFor } from "./categories.mjs?v=20260907-trends1";
import { jstDateKey } from "./periods.mjs?v=20260907-1";
import { filteredPayments, comparePeriod, trendSeries, categories } from "./trend-data.mjs?v=1";

const yen = (value) => new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(value);
const signed = (value) => `${value > 0 ? "+" : ""}${yen(value)}`;
const cards = { olive: "Olive", epos: "エポス", paypay_card: "PayPay", aeon: "イオン" };
const WANT = 240000, MUST = 280000;
const FOOD_BUDGETS = { "コンビニ・自販機・売店": 12000, "カフェ・軽食": 8000, "外食（ランチ・ディナー）": 30000, "飲み会・酒": 30000, "スーパー・食料品": 15000 };
function node(tag, text, cls) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (cls) el.className = cls;
  return el;
}
const rangeLabel = (b, mode) => mode === "month"
  ? `${b.start.slice(0, 4)}年${Number(b.start.slice(5, 7))}月`
  : `${b.start.replaceAll("-", "/")}〜${b.end.replaceAll("-", "/")}`;

export function setupTrends(root, getPayments) {
  let mode = "week", endOffset = 0, selected = 0, rowLimit = 30;
  root.innerHTML = `
    <div class="hero-row"><div><p class="eyebrow">SPENDING TRENDS</p><h1>支出の変化を、<br>見つける。</h1><p class="hero-copy">週と月を並べて、使い方の変化を確かめましょう。</p></div></div>
    <div class="trend-controls">
      <div class="period-tabs" aria-label="比較単位"><button type="button" data-mode="week">週ごと</button><button type="button" data-mode="month">月ごと</button></div>
      <label>カード <select id="trend-source"><option value="all">すべて</option><option value="olive">Olive</option><option value="epos">エポス</option><option value="paypay_card">PayPay</option><option value="aeon">イオン</option></select></label>
      <label>カテゴリ <select id="trend-category"><option value="all">すべて</option></select></label>
      <label class="investment-toggle"><input type="checkbox" id="trend-investment"> 投資を含める</label>
    </div>
    <p id="trend-scope" class="trend-note"></p>
    <section class="panel budget-overview"><div class="budget-heading"><div><p class="eyebrow">MONTHLY BUDGET</p><h2>今月の予算</h2></div><span id="budget-month"></span></div><div class="budget-metrics"><div><span>Want 24万円まで</span><strong id="budget-want"></strong><i><b id="budget-want-bar"></b></i></div><div><span>Must 28万円まで</span><strong id="budget-must"></strong><i><b id="budget-must-bar"></b></i></div><div><span>月末予想</span><strong id="budget-forecast"></strong><small>現在のペース</small></div></div><p id="budget-excluded" class="trend-note"></p></section>
    <section class="panel trend-summary" aria-live="polite"><div><p id="trend-selected"></p><strong id="trend-total"></strong><small id="trend-count"></small></div><div><span>前期間からの増減</span><strong id="trend-difference"></strong><small id="trend-percent"></small></div></section>
    <p id="trend-comparison" class="trend-note"></p>
    <section class="panel"><div class="panel-heading"><h2 id="trend-chart-title">12週間の推移</h2><div class="week-navigation"><button type="button" id="trend-older" aria-label="さらに古い12期間">‹</button><button type="button" id="trend-newer" aria-label="新しい12期間">›</button></div></div>
      <p class="trend-note">棒を選ぶと、その期間の内訳を表示します。薄い棒は集計途中。マイナスは返金等の差引です。</p>
      <div class="trend-chart-scroll"><div id="trend-bars" class="trend-bars" aria-label="期間別支出合計"></div></div>
      <p id="trend-coverage" class="trend-note"></p>
    </section>
    <div class="trend-details"><section class="panel food-budget"><h2>食費の予算</h2><div id="food-budget"></div></section><section class="panel"><h2>増減の大きいカテゴリ</h2><p class="trend-note">前期間との金額差（絶対値順）</p><div id="trend-changes"></div></section></div>
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
    const today = jstDateKey(now), monthKey = today.slice(0, 7);
    const budgetItems = all.filter((p) => jstDateKey(p.paid_at).startsWith(monthKey) && !["旅行・帰省・宿泊", "投資", "返金・取消"].includes(categoryFor(p)) && !(categoryFor(p) === "スポーツ" && p.amount >= 100000 && (p.merchant_raw ?? "").toUpperCase().includes("GOLFTEC")));
    const budgetSpent = budgetItems.reduce((sum, p) => sum + p.amount, 0);
    const day = Number(today.slice(-2)), days = new Date(Date.UTC(Number(today.slice(0,4)), Number(today.slice(5,7)), 0)).getUTCDate();
    const forecast = day ? Math.round(budgetSpent / day * days) : 0;
    const series = trendSeries(items, mode, endOffset, now);
    const result = comparePeriod(items, mode, selected, now);
    const firstDate = all.length ? all.map((p) => jstDateKey(p.paid_at)).sort()[0] : null;
    const lastDate = all.length ? all.map((p) => jstDateKey(p.paid_at)).sort().at(-1) : null;
    const comparable = firstDate !== null && result.previousEnd >= firstDate;
    root.querySelectorAll("[data-mode]").forEach((b) => { b.classList.toggle("active", b.dataset.mode === mode); b.setAttribute("aria-pressed", String(b.dataset.mode === mode)); });
    el("trend-scope").textContent = investment ? "投資を含む合計を表示しています。" : "生活費を表示しています（投資を除外）。返金・取消は差し引いて集計します。";
    el("budget-month").textContent = `${today.slice(0,4)}年${Number(today.slice(5,7))}月`;
    el("budget-want").textContent = budgetSpent <= WANT ? `残り ${yen(WANT - budgetSpent)}` : `超過 ${yen(budgetSpent - WANT)}`;
    el("budget-must").textContent = budgetSpent <= MUST ? `残り ${yen(MUST - budgetSpent)}` : `超過 ${yen(budgetSpent - MUST)}`;
    el("budget-forecast").textContent = yen(forecast);
    el("budget-want-bar").style.width = `${Math.min(100, budgetSpent / WANT * 100)}%`;
    el("budget-must-bar").style.width = `${Math.min(100, budgetSpent / MUST * 100)}%`;
    el("budget-excluded").textContent = "旅行・投資・ゴルフテックの高額一括払いは、通常予算とは別枠です。";
    const food = el("food-budget"); food.replaceChildren();
    for (const [name, limit] of Object.entries(FOOD_BUDGETS)) { const amount = budgetItems.filter((p) => categoryFor(p) === name).reduce((sum, p) => sum + p.amount, 0); const row = node("div", undefined, "food-budget-row"); row.append(node("span", name), node("strong", `${yen(amount)} / ${yen(limit)}`)); const bar = node("i"), fill = node("b"); fill.style.width = `${Math.min(100, amount / limit * 100)}%`; if (amount >= limit * .9) fill.classList.add("near-limit"); bar.append(fill); row.append(bar); food.append(row); }
    el("trend-selected").textContent = rangeLabel(result, mode) + (result.partial ? " · 集計途中" : "");
    el("trend-total").textContent = yen(result.amount);
    el("trend-count").textContent = `${result.items.length}件`;
    el("trend-difference").textContent = comparable ? signed(result.difference) : "比較データなし";
    el("trend-percent").textContent = comparable && result.percent !== null ? `${result.percent > 0 ? "+" : ""}${result.percent.toFixed(1)}%` : "前期間が0円または未収録のため、増減率は表示しません";
    el("trend-comparison").textContent = `比較対象：${result.previous.start}〜${result.previousEnd}。` + (result.partial ? `現在の期間は${result.currentEnd}まで。前期間も同じ経過日数まで（月末を上限）で比較します。今日の金額は更新途中です。` : "完了した期間どうしの比較です。");
    el("trend-chart-title").textContent = mode === "week" ? "12週間の推移" : "12か月の推移";
    el("trend-newer").disabled = endOffset === 0;
    el("trend-older").disabled = !firstDate || series[0].start <= firstDate;
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
      button.addEventListener("click", () => { selected = b.offset; rowLimit = 30; render(); }); bars.append(button);
    }
    const changes = el("trend-changes"); changes.replaceChildren();
    if (comparable) for (const c of result.changes.slice(0, 6)) {
      const row = node("div", undefined, "trend-detail-row"); row.append(node("span", c.name), node("strong", signed(c.difference)), node("small", `${yen(c.previous)} → ${yen(c.amount)}`)); changes.append(row);
    }
    if (!changes.children.length) changes.append(node("p", "比較できるカテゴリデータがありません。", "empty-state"));
    const rows = el("trend-rows"); rows.replaceChildren();
    const ordered = [...result.items].sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at));
    for (const p of ordered.slice(0, rowLimit)) {
      const row = node("tr"); for (const text of [jstDateKey(p.paid_at), p.merchant_raw, categoryFor(p), cards[p.source] ?? p.source, yen(p.amount)]) row.append(node("td", text)); rows.append(row);
    }
    el("trend-rows-count").textContent = `${Math.min(rowLimit, ordered.length)} / ${ordered.length}件`;
    el("trend-more").hidden = ordered.length <= rowLimit;
  }
  root.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => { mode = b.dataset.mode; selected = 0; endOffset = 0; rowLimit = 30; render(); }));
  root.querySelectorAll("select,input").forEach((input) => input.addEventListener("change", () => { rowLimit = 30; render(); }));
  el("trend-older").addEventListener("click", () => { endOffset -= 12; selected = endOffset; rowLimit = 30; render(); });
  el("trend-newer").addEventListener("click", () => { endOffset = Math.min(0, endOffset + 12); selected = endOffset; rowLimit = 30; render(); });
  el("trend-more").addEventListener("click", () => { rowLimit += 30; render(); });
  return { render };
}
