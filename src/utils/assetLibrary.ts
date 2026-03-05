import {
  ASSET_LIBRARY_IDS,
  type AssetLibraryId,
  type AssetLocale,
} from "@/types/assets";

const LIBRARY_SET = new Set<string>(ASSET_LIBRARY_IDS);

const CANONICAL_LIBRARY_MAP: Record<string, AssetLibraryId> = {
  shikigami: "shikigami",
  yuhun: "yuhun",
  onmyoji: "onmyoji",
  onmyojiskill: "onmyojiSkill",
  onmyoji_skill: "onmyojiSkill",
  "onmyoji-skill": "onmyojiSkill",
  hunling: "hunling",
  "hun-ling": "hunling",
  "hun_ling": "hunling",
};

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export const normalizeAssetLibraryId = (
  input: unknown,
): AssetLibraryId | "" => {
  const normalized = normalizeText(input);
  if (!normalized) {
    return "";
  }

  if (LIBRARY_SET.has(normalized)) {
    return normalized as AssetLibraryId;
  }

  const lowerCase = normalized.toLowerCase();
  return CANONICAL_LIBRARY_MAP[lowerCase] || "";
};

export const normalizeAssetLibraryIdWithFallback = (
  input: unknown,
  fallback: AssetLibraryId = "shikigami",
): AssetLibraryId => normalizeAssetLibraryId(input) || fallback;

export const resolveAssetLocale = (input: unknown): AssetLocale => {
  const normalized = normalizeText(input).toLowerCase();
  if (normalized.startsWith("ja")) {
    return "ja";
  }
  if (normalized.startsWith("en")) {
    return "en";
  }
  return "zh";
};
