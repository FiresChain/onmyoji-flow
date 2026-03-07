const { fetchText } = require("../lib/http");
const { ensureLocalizedText, toText } = require("../lib/normalize");

const API_HOST = "https://g37simulator.webapp.163.com/get_heroid_list";
const IMAGE_BASE_URL = "https://yys.res.netease.com/pc/zt/20161108171335/data/shishen";
const MIN_EXPECTED_COUNT = 200;

const RARITY_META = {
  "1": { rarity: "N", dir: "n" },
  "2": { rarity: "R", dir: "r" },
  "3": { rarity: "SR", dir: "sr" },
  "4": { rarity: "SSR", dir: "ssr" },
  "5": { rarity: "SP", dir: "sp" },
  "6": { rarity: "UR", dir: "ur" },
};

const toQueryString = (params) =>
  Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

const parseJsonp = (payload) => {
  const text = toText(payload);
  const start = text.indexOf("(");
  const end = text.lastIndexOf(")");
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("Invalid JSONP payload");
  }
  return JSON.parse(text.slice(start + 1, end));
};

const fetchAllHeroes = async () => {
  // rarity=0 + per_page=500 可一次拿到完整式神集（含 N/R/SR/SSR/SP/UR/L/G）。
  const query = { rarity: 0, page: 1, per_page: 500 };
  const url = `${API_HOST}?${toQueryString({ ...query, callback: "cb" })}`;
  const payload = await fetchText(url);
  const parsed = parseJsonp(payload);
  if (!parsed || parsed.success !== true || typeof parsed.data !== "object") {
    throw new Error("Official hero API returned invalid payload");
  }
  return parsed.data;
};

const collectShikigamiAssets = async () => {
  const allItems = [];
  const seen = new Set();
  const heroes = await fetchAllHeroes();

  Object.entries(heroes).forEach(([id, hero]) => {
    const cleanId = toText(id);
    const name = toText(hero?.name);
    if (!cleanId || !name || seen.has(cleanId)) {
      return;
    }

    let rarityInfo = RARITY_META[String(hero?.rarity)] || null;
    if (Number(hero?.interactive) === 1) {
      rarityInfo = { rarity: "L", dir: "l" };
    }
    if (Number(hero?.material_type) === 101) {
      rarityInfo = { rarity: "G", dir: "g" };
    }
    if (!rarityInfo) {
      return;
    }

    seen.add(cleanId);
    allItems.push({
      id: cleanId,
      name,
      rarity: rarityInfo.rarity,
      dir: rarityInfo.dir,
      imageUrl: `${IMAGE_BASE_URL}/${cleanId}.png?v5`,
    });
  });

  if (allItems.length < MIN_EXPECTED_COUNT) {
    throw new Error(
      `Parsed shikigami count too low: ${allItems.length} < ${MIN_EXPECTED_COUNT}`,
    );
  }

  allItems.sort((a, b) => Number(b.id) - Number(a.id));

  const assets = allItems.map((item) => ({
    id: item.id,
    library: "shikigami",
    avatar: `/assets/Shikigami/${item.dir}/${item.id}.png`,
    names: ensureLocalizedText(item.name, item.name, item.name),
    rarity: item.rarity,
  }));

  const images = allItems.map((item) => ({
    url: item.imageUrl,
    relativePath: `/assets/Shikigami/${item.dir}/${item.id}.png`,
  }));

  return {
    source: "official",
    assets,
    images,
    warnings: [],
  };
};

module.exports = {
  collectShikigamiAssets,
};
