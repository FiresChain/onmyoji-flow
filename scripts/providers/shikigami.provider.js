const { fetchText } = require("../lib/http");
const { ensureLocalizedText, toText } = require("../lib/normalize");

const RARITY_TYPES = [
  { urlParam: "ssr", dir: "ssr", rarity: "SSR" },
  { urlParam: "sp", dir: "sp", rarity: "SP" },
  { urlParam: "ur", dir: "ur", rarity: "UR" },
  { urlParam: "sr", dir: "sr", rarity: "SR" },
  { urlParam: "r", dir: "r", rarity: "R" },
  { urlParam: "n", dir: "n", rarity: "N" },
  { urlParam: "ld", dir: "l", rarity: "L" },
  { urlParam: "gt", dir: "g", rarity: "G" },
];

const normalizeImageUrl = (value, baseUrl) => {
  const src = toText(value);
  if (!src) {
    return "";
  }
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  if (src.startsWith("//")) {
    return `https:${src}`;
  }
  return new URL(src, baseUrl).toString();
};

const parseShikigamiFromHtml = (html, pageUrl, rarity) => {
  const regex =
    /<div class="shishen_item">[\s\S]*?<a href="(\d+)\.html">[\s\S]*?<img src="([^"]+)"[\s\S]*?<span class="name">([^<]+)<\/span>/g;
  const items = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    const id = toText(m[1]);
    const imageUrl = normalizeImageUrl(m[2], pageUrl);
    const name = toText(m[3]);
    if (!id || !imageUrl || !name) {
      continue;
    }
    items.push({ id, imageUrl, name, rarity: rarity.rarity, dir: rarity.dir });
  }
  return items;
};

const collectShikigamiAssets = async () => {
  const allItems = [];
  const seen = new Set();

  for (const rarity of RARITY_TYPES) {
    const url = `https://yys.163.com/shishen/index.html?type=${rarity.urlParam}`;
    const html = await fetchText(url);
    const items = parseShikigamiFromHtml(html, url, rarity);
    for (const item of items) {
      if (seen.has(item.id)) {
        continue;
      }
      seen.add(item.id);
      allItems.push(item);
    }
  }

  if (allItems.length === 0) {
    throw new Error("No shikigami data parsed from official pages");
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
