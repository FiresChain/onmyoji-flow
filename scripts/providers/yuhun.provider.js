const { fetchText } = require("../lib/http");

const SUIT_BASE_URL = "https://cbg-yys.res.netease.com/game_res/suit";
const RANGE_START = 300000;
const RANGE_END = 300099;
const CHECK_TIMEOUT_MS = 5000;
const CHECK_CONCURRENCY = 8;

const probeSuitImage = async (id) => {
  const url = `${SUIT_BASE_URL}/${id}.png`;
  try {
    await fetchText(url, {
      method: "HEAD",
      timeout: CHECK_TIMEOUT_MS,
    });
    return {
      id,
      url,
    };
  } catch (error) {
    return null;
  }
};

const collectSuitImages = async () => {
  const ids = [];
  for (let id = RANGE_START; id <= RANGE_END; id += 1) {
    ids.push(id);
  }

  const found = [];
  let cursor = 0;

  const workers = Array.from({ length: CHECK_CONCURRENCY }, async () => {
    while (cursor < ids.length) {
      const current = ids[cursor];
      cursor += 1;
      const hit = await probeSuitImage(current);
      if (hit) {
        found.push(hit);
      }
    }
  });

  await Promise.all(workers);
  found.sort((a, b) => a.id - b.id);
  return found;
};

const collectYuhunAssets = async () => {
  // 连通性探测：确保目标站点可访问。
  await fetchText("https://yys.163.com/");

  const discovered = await collectSuitImages();
  if (discovered.length === 0) {
    throw new Error("No official yuhun suit image found in range 300000-300099");
  }

  const images = discovered.map((item) => ({
    url: item.url,
    relativePath: `/assets/Yuhun/${item.id}.png`,
  }));

  return {
    source: "official-image-only",
    assets: [],
    images,
    foundIds: discovered.map((item) => String(item.id)),
    warnings: [
      `official suit probe range=${RANGE_START}-${RANGE_END}, found=${discovered.length}`,
      "yuhun sync is image-only; yuhun.json remains manually maintained",
    ],
  };
};

module.exports = {
  collectYuhunAssets,
};
