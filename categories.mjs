export const MAJOR_CATEGORIES = [
  "食費",
  "生活・買い物",
  "移動",
  "余暇・旅行",
  "健康・自己投資",
  "その他・不明",
];

export const CATEGORY_META = [
  {
    name: "コンビニ・自販機・売店",
    major: "食費",
    color: "#d98b45",
    keywords: [
      "セブン-イレブン", "セブンイレブン", "7-ELEVEN", "ファミリーマート",
      "FAMILY MART", "ファミマ", "ローソン", "LAWSON", "ミニストップ",
      "MINISTOP", "デイリーヤマザキ", "NEWDAYS", "KIOSK", "売店",
      "自販機", "COKE ON"
    ],
  },
  {
    name: "カフェ・軽食",
    major: "食費",
    color: "#c99a55",
    keywords: [
      "スターバックス", "STARBUCKS", "ドトール", "DOUTOR", "タリーズ",
      "TULLY", "エクセルシオール", "コメダ", "サンマルクカフェ", "カフェ",
      "CAFE", "COFFEE", "喫茶", "ベーカリー", "BAKERY", "リーベンハウス"
    ],
  },
  {
    name: "外食（ランチ・ディナー）",
    major: "食費",
    color: "#e06f48",
    keywords: [
      "レストラン", "RESTAURANT", "DINING", "食堂", "ラーメン", "寿司",
      "すし", "焼肉", "蕎麦", "そば", "うどん", "マクドナルド", "MCDONALD",
      "モスバーガー", "ケンタッキー", "KFC", "サイゼリヤ", "ガスト",
      "すき家", "吉野家", "松屋", "丸亀製麺", "UBER EATS", "出前館"
    ],
  },
  {
    name: "飲み会・酒",
    major: "食費",
    color: "#b45f50",
    keywords: [
      "居酒屋", "BAR", "ビール", "酒", "ワイン", "鳥貴族", "磯丸水産",
      "HUB", "ダイニングバー", "宴会"
    ],
  },
  {
    name: "スーパー・食料品",
    major: "食費",
    color: "#8aaa62",
    keywords: [
      "スーパー", "SUPERMARKET", "GROCERY", "食料品", "食品", "生協",
      "まいばすけっと", "MYB", "西友", "SEIYU", "ライフ", "マルエツ",
      "イトーヨーカドー", "成城石井", "業務スーパー", "OKストア",
      "オーケー", "イオンスタイル", "AEON STYLE"
    ],
  },
  {
    name: "日用品・ドラッグ・家電",
    major: "生活・買い物",
    color: "#5f8f87",
    keywords: [
      "ドラッグ", "DRUG", "薬局", "マツモトキヨシ", "ウエルシア",
      "スギ薬局", "ココカラファイン", "サンドラッグ", "ホームセンター",
      "ニトリ", "無印良品", "MUJI", "ビックカメラ", "ヨドバシカメラ",
      "ヤマダデンキ", "ケーズデンキ", "LOHACO"
    ],
  },
  {
    name: "ショッピング（EC・商業施設）",
    major: "生活・買い物",
    color: "#5c7f72",
    keywords: [
      "AMAZON", "アマゾン", "楽天市場", "RAKUTEN", "YAHOO ショッピング",
      "PAYPAYモール", "ZOZOTOWN", "メルカリ", "百貨店", "デパート",
      "高島屋", "三越", "伊勢丹", "PARCO", "ルミネ", "丸井", "OIOI",
      "ららぽーと", "ショッピング"
    ],
  },
  {
    name: "衣類",
    major: "生活・買い物",
    color: "#738f76",
    keywords: [
      "ユニクロ", "UNIQLO", "GU ", "ジーユー", "ZARA", "H&M", "無印衣料",
      "BEAMS", "UNITED ARROWS", "アパレル", "衣料", "CLOTHING"
    ],
  },
  {
    name: "美容・身だしなみ",
    major: "生活・買い物",
    color: "#b26883",
    keywords: [
      "美容", "美容室", "理容", "サロン", "SALON", "ヘア", "NAIL",
      "ネイル", "コスメ", "化粧品", "SEPHORA", "＠COSME", "アットコスメ"
    ],
  },
  {
    name: "通信・光熱・住居サービス",
    major: "生活・買い物",
    color: "#8a7a58",
    keywords: [
      "DOCOMO", "ドコモ", "SOFTBANK", "ソフトバンク", "KDDI", "AU ",
      "Y!MOBILE", "ワイモバイル", "楽天モバイル", "INTERNET", "通信",
      "電気", "電力", "ガス", "水道", "ENERGY", "POWER", "UTILITY",
      "家賃", "管理費", "住居"
    ],
  },
  {
    name: "電車・ICチャージ",
    major: "移動",
    color: "#5d79a8",
    keywords: [
      "JR", "鉄道", "電鉄", "地下鉄", "メトロ", "METRO", "SUICA",
      "PASMO", "ICOCA", "ICチャージ", "モバイルSUICA", "駅"
    ],
  },
  {
    name: "タクシー・配車",
    major: "移動",
    color: "#4d6e9d",
    keywords: [
      "タクシー", "TAXI", "UBER", "GOタクシー", "GO TAXI", "S.RIDE",
      "DIDI", "配車"
    ],
  },
  {
    name: "車・シェアモビリティ",
    major: "移動",
    color: "#6d88a5",
    keywords: [
      "ENEOS", "出光", "シェル", "ガソリン", "駐車", "パーキング",
      "高速", "ETC", "レンタカー", "カーシェア", "TIMES CAR", "LUUP",
      "HELLO CYCLING", "シェアサイクル"
    ],
  },
  {
    name: "旅行・帰省・宿泊",
    major: "余暇・旅行",
    color: "#7a68a8",
    keywords: [
      "ホテル", "HOTEL", "旅館", "宿泊", "AIRBNB", "BOOKING.COM",
      "AGODA", "じゃらん", "楽天トラベル", "JAL", "ANA", "航空",
      "AIRLINES", "新幹線", "旅行", "TRAVEL"
    ],
  },
  {
    name: "娯楽・レジャー",
    major: "余暇・旅行",
    color: "#8b63a4",
    keywords: [
      "映画", "シネマ", "CINEMA", "TOHO", "カラオケ", "KARAOKE",
      "テーマパーク", "ディズニー", "USJ", "チケット", "TICKET",
      "美術館", "博物館", "レジャー", "ゲームセンター"
    ],
  },
  {
    name: "健康・医療",
    major: "健康・自己投資",
    color: "#b65b54",
    keywords: [
      "病院", "医院", "クリニック", "歯科", "眼科", "診療", "医療",
      "HOSPITAL", "CLINIC", "DENTAL", "整体", "接骨", "鍼灸"
    ],
  },
  {
    name: "スポーツ・サウナ",
    major: "健康・自己投資",
    color: "#4f8f79",
    keywords: [
      "ジム", "GYM", "フィットネス", "FITNESS", "スポーツ", "SPORTS",
      "サウナ", "SAUNA", "銭湯", "温浴", "E-MOSHICOM", "MOSHICOM",
      "ホイッスル"
    ],
  },
  {
    name: "デジタル・サブスク",
    major: "余暇・旅行",
    color: "#6f68a6",
    keywords: [
      "NETFLIX", "SPOTIFY", "YOUTUBE", "DISNEY+", "HULU", "U-NEXT",
      "AMAZON PRIME", "APPLE.COM/BILL", "GOOGLE PLAY", "PLAYSTATION",
      "NINTENDO", "KINDLE", "サブスク"
    ],
  },
  {
    name: "その他・不明",
    major: "その他・不明",
    color: "#9da39b",
    keywords: [],
  },
];

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/[・･]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeMerchant(payment) {
  return normalizeText(
    [payment.merchant_norm, payment.merchant_raw]
      .filter(Boolean)
      .join(" ")
  )
    .replace(/\bMYB\b/g, "まいばすけっと")
    .replace(
      /(?:ンハウス|ペンハウス|べンハウス|ベンハウス)/g,
      "リーベンハウス"
    );
}

export function categoryFor(payment) {
  const explicit = payment.category_mid ?? payment.category;
  if (
    explicit &&
    CATEGORY_META.some((category) => category.name === explicit)
  ) {
    return explicit;
  }

  const merchant = normalizeMerchant(payment);
  if (merchant.includes("ROCKYKANAI")) {
    return "飲み会・酒";
  }
  const matched = CATEGORY_META.find(
    (category) =>
      category.name !== "その他・不明" &&
      category.keywords.some(
        (keyword) => merchant.includes(normalizeText(keyword))
      )
  );
  return matched?.name ?? "その他・不明";
}

export function categoryMeta(name) {
  return (
    CATEGORY_META.find((category) => category.name === name) ??
    CATEGORY_META[CATEGORY_META.length - 1]
  );
}