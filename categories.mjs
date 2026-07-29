export const CATEGORY_META = [
  {
    name: "外食費",
    color: "#e48b4b",
    keywords: [
      "レストラン", "カフェ", "コーヒー", "喫茶", "居酒屋", "寿司", "すし",
      "ラーメン", "焼肉", "食堂", "スターバックス", "ドトール", "マクドナルド",
      "モスバーガー", "ケンタッキー", "サイゼリヤ", "ガスト", "すき家",
      "吉野家", "松屋", "UBER EATS", "出前館", "RESTAURANT", "CAFE",
      "COFFEE", "DINING"
    ],
  },
  {
    name: "食費",
    color: "#8aaa62",
    keywords: [
      "スーパー", "マーケット", "食品", "食料", "生協", "西友", "ライフ",
      "マルエツ", "イトーヨーカドー", "イオン", "成城石井", "業務スーパー",
      "OKストア", "SEIYU", "SUPERMARKET", "GROCERY"
    ],
  },
  {
    name: "日用品",
    color: "#5f8f87",
    keywords: [
      "ドラッグ", "薬局", "マツモトキヨシ", "ウエルシア", "スギ薬局",
      "ココカラファイン", "ホームセンター", "ニトリ", "無印良品",
      "AMAZON", "楽天市場", "LOHACO", "DRUG", "HARDWARE"
    ],
  },
  {
    name: "交通費",
    color: "#5d79a8",
    keywords: [
      "JR", "鉄道", "電鉄", "地下鉄", "メトロ", "SUICA", "PASMO",
      "タクシー", "TAXI", "バス", "高速", "駐車", "パーキング",
      "ENEOS", "出光", "シェル", "ガソリン", "交通"
    ],
  },
  {
    name: "通信費",
    color: "#7a68a8",
    keywords: [
      "DOCOMO", "ドコモ", "SOFTBANK", "ソフトバンク", "KDDI", "AU ",
      "Y!MOBILE", "ワイモバイル", "楽天モバイル", "INTERNET", "通信"
    ],
  },
  {
    name: "光熱費",
    color: "#c59a48",
    keywords: [
      "電気", "電力", "ガス", "水道", "ENERGY", "POWER", "UTILITY"
    ],
  },
  {
    name: "娯楽費",
    color: "#b26883",
    keywords: [
      "NETFLIX", "SPOTIFY", "YOUTUBE", "DISNEY", "HULU", "映画",
      "シネマ", "ゲーム", "PLAYSTATION", "NINTENDO", "書店", "BOOK"
    ],
  },
  {
    name: "医療費",
    color: "#b65b54",
    keywords: [
      "病院", "医院", "クリニック", "歯科", "眼科", "診療", "医療",
      "HOSPITAL", "CLINIC", "DENTAL"
    ],
  },
  {
    name: "その他",
    color: "#9da39b",
    keywords: [],
  },
];

export function categoryFor(payment) {
  if (payment.category) return payment.category;
  const merchant = [
    payment.merchant_norm,
    payment.merchant_raw,
  ].filter(Boolean).join(" ").toUpperCase();

  const matched = CATEGORY_META.find(
    (category) =>
      category.name !== "その他" &&
      category.keywords.some(
        (keyword) => merchant.includes(keyword.toUpperCase())
      )
  );
  return matched?.name ?? "その他";
}

export function categoryMeta(name) {
  return (
    CATEGORY_META.find((category) => category.name === name) ??
    CATEGORY_META[CATEGORY_META.length - 1]
  );
}