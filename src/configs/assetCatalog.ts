import type { AssetLibraryId, AssetLocale } from "@/types/assets";
import {
  resolveAssetLocale,
  normalizeAssetLibraryIdWithFallback,
} from "@/utils/assetLibrary";
import shikigamiAssets from "@/data/assets/shikigami.json";
import yuhunAssets from "@/data/assets/yuhun.json";
import onmyojiAssets from "@/data/assets/onmyoji.json";
import onmyojiSkillAssets from "@/data/assets/onmyojiSkill.json";

type LocalizedText = Record<string, string>;

type DisplayShikigami = {
  id: string;
  library: "shikigami";
  avatar: string;
  name: string;
  rarity: string;
};

type DisplayYuhun = {
  id: string;
  library: "yuhun";
  avatar: string;
  name: string;
  shortName: string;
  type: string;
};

type DisplayOnmyoji = {
  id: string;
  library: "onmyoji";
  avatar: string;
  name: string;
};

type DisplayOnmyojiSkill = {
  id: string;
  library: "onmyojiSkill";
  avatar: string;
  name: string;
  onmyojiId: string;
  skillId: string;
  onmyojiName: string;
};

export type DisplayAssetRecord =
  | DisplayShikigami
  | DisplayYuhun
  | DisplayOnmyoji
  | DisplayOnmyojiSkill;

const pickLocalizedText = (
  value: LocalizedText | undefined,
  locale: AssetLocale,
  fallbackId: string,
): string => {
  if (!value || typeof value !== "object") {
    return fallbackId;
  }
  const preferred = value[locale];
  if (typeof preferred === "string" && preferred.trim()) {
    return preferred;
  }
  const fallbackOrder = ["zh", "en", "ja"];
  for (const key of fallbackOrder) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }
  return fallbackId;
};

const buildOnmyojiNameMap = (locale: AssetLocale): Record<string, string> => {
  const map: Record<string, string> = {};
  (onmyojiAssets as any[]).forEach((item) => {
    const id = String(item?.id || "").trim();
    if (!id) {
      return;
    }
    map[id] = pickLocalizedText(item?.names, locale, id);
  });
  return map;
};

const toShikigami = (locale: AssetLocale): DisplayShikigami[] =>
  (shikigamiAssets as any[]).map((item) => {
    const id = String(item?.id || "").trim();
    return {
      id,
      library: "shikigami",
      avatar: String(item?.avatar || ""),
      name: pickLocalizedText(item?.names, locale, id),
      rarity: String(item?.rarity || ""),
    };
  });

const toYuhun = (locale: AssetLocale): DisplayYuhun[] =>
  (yuhunAssets as any[]).map((item) => {
    const id = String(item?.id || "").trim();
    return {
      id,
      library: "yuhun",
      avatar: String(item?.avatar || ""),
      name: pickLocalizedText(item?.names, locale, id),
      shortName: pickLocalizedText(item?.shortNames, locale, id),
      type: String(item?.type || ""),
    };
  });

const toOnmyoji = (locale: AssetLocale): DisplayOnmyoji[] =>
  (onmyojiAssets as any[]).map((item) => {
    const id = String(item?.id || "").trim();
    return {
      id,
      library: "onmyoji",
      avatar: String(item?.avatar || ""),
      name: pickLocalizedText(item?.names, locale, id),
    };
  });

const toOnmyojiSkill = (locale: AssetLocale): DisplayOnmyojiSkill[] => {
  const onmyojiNameMap = buildOnmyojiNameMap(locale);
  return (onmyojiSkillAssets as any[]).map((item) => {
    const id = String(item?.id || "").trim();
    const onmyojiId = String(item?.onmyojiId || "").trim();
    return {
      id,
      library: "onmyojiSkill",
      avatar: String(item?.avatar || ""),
      name: pickLocalizedText(item?.names, locale, id),
      onmyojiId,
      skillId: String(item?.skillId || ""),
      onmyojiName: onmyojiNameMap[onmyojiId] || onmyojiId || "Unknown",
    };
  });
};

export const getAssetDataSource = (
  library: AssetLibraryId,
  localeInput?: unknown,
): DisplayAssetRecord[] => {
  const locale = resolveAssetLocale(localeInput);
  const normalizedLibrary = normalizeAssetLibraryIdWithFallback(library);
  if (normalizedLibrary === "shikigami") {
    return toShikigami(locale);
  }
  if (normalizedLibrary === "yuhun") {
    return toYuhun(locale);
  }
  if (normalizedLibrary === "onmyoji") {
    return toOnmyoji(locale);
  }
  return toOnmyojiSkill(locale);
};
