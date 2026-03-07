const toText = (value) =>
  typeof value === "string" ? value.trim() : "";

const pickName = (names, locale, fallback) => {
  if (!names || typeof names !== "object") {
    return fallback;
  }
  const preferred = toText(names[locale]);
  if (preferred) {
    return preferred;
  }
  for (const key of ["zh", "en", "ja"]) {
    const value = toText(names[key]);
    if (value) {
      return value;
    }
  }
  return fallback;
};

const ensureLocalizedText = (nameZh, nameJa, nameEn) => {
  const zh = toText(nameZh);
  const ja = toText(nameJa) || zh;
  const en = toText(nameEn) || zh;
  return {
    zh,
    ja,
    en,
  };
};

const slugifyZh = (input) => {
  const text = toText(input).toLowerCase();
  if (!text) {
    return "";
  }
  return text
    .replace(/[\s_]+/g, "-")
    .replace(/[??]/g, "-")
    .replace(/[()????\[\]{}]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const extractIdFromAvatar = (avatar) => {
  const text = toText(avatar);
  const match = text.match(/\/(\d+)\.png$/);
  return match ? match[1] : "";
};

module.exports = {
  toText,
  pickName,
  ensureLocalizedText,
  slugifyZh,
  extractIdFromAvatar,
};
