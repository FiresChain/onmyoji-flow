const { fetchText } = require("../lib/http");
const { ensureLocalizedText, toText } = require("../lib/normalize");

const API_HOST = "https://g37simulator.webapp.163.com/get_heroid_list";
const IMAGE_BASE_URL = "https://yys.res.netease.com/pc/zt/20161108171335/data/shishen";
const MIN_EXPECTED_COUNT = 200;
const PAGE_SIZE = 25;
const MAX_PAGES = 30;
const FETCH_RETRY_LIMIT = 3;
const FETCH_RETRY_DELAY_MS = 1500;

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

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const isObjectRecord = (value) => value !== null && typeof value === "object";

const fetchHeroPage = async (page) => {
  const query = { rarity: 0, page, per_page: PAGE_SIZE };
  const url = `${API_HOST}?${toQueryString({ ...query, callback: "cb" })}`;
  let lastError = null;

  for (let attempt = 1; attempt <= FETCH_RETRY_LIMIT; attempt += 1) {
    try {
      const payload = await fetchText(url);
      const parsed = parseJsonp(payload);
      if (!parsed || parsed.success !== true) {
        throw new Error(`Official hero API returned invalid payload on page ${page}`);
      }

      if (isObjectRecord(parsed.data)) {
        return parsed.data;
      }

      const totalPage = Number(parsed.total_page) || 0;
      if (parsed.data === null && totalPage > 0 && page > totalPage) {
        return {};
      }

      throw new Error(
        `Official hero API returned empty data on page ${page}: total_num=${parsed.total_num ?? "unknown"}, total_page=${parsed.total_page ?? "unknown"}`,
      );
    } catch (error) {
      lastError = error;
      if (attempt < FETCH_RETRY_LIMIT) {
        await sleep(FETCH_RETRY_DELAY_MS);
      }
    }
  }

  throw lastError;
};

const fetchAllHeroes = async () => {
  const heroes = {};
  const pageCounts = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const pageHeroes = await fetchHeroPage(page);
    const entries = Object.entries(pageHeroes);
    pageCounts.push(entries.length);
    if (entries.length === 0) {
      break;
    }

    entries.forEach(([id, hero]) => {
      heroes[id] = hero;
    });

    if (entries.length < PAGE_SIZE) {
      break;
    }
  }

  return {
    heroes,
    pageCounts,
  };
};

const collectShikigamiAssets = async () => {
  const allItems = [];
  const seen = new Set();
  const { heroes, pageCounts } = await fetchAllHeroes();

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
    optional: true,
  }));

  return {
    source: "official",
    assets,
    images,
    warnings: [`official hero pages=${pageCounts.join(",")}`],
  };
};

module.exports = {
  collectShikigamiAssets,
};
