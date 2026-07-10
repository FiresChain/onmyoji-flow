import {
  ASSET_LIBRARY_IDS,
  type AssetLibraryId,
  type AssetLocale,
} from "./types";
import type { GraphNode } from "@/core/document/types";

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
  hun_ling: "hunling",
};

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const inferLibraryFromAvatar = (avatar: string): string => {
  if (!avatar) return "";
  if (avatar.includes("/Yuhun/")) return "yuhun";
  if (avatar.includes("/Shikigami/")) return "shikigami";
  if (avatar.includes("/HunLing/")) return "hunling";
  if (avatar.includes("/hero_")) return "onmyoji";
  return "";
};

const createStableHash = (seed: string): string => {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

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

export const normalizeSelectedAssetRecord = (
  input: unknown,
  preferredLibrary = "",
): Record<string, unknown> | null => {
  if (!input || typeof input !== "object") {
    return null;
  }

  const raw = input as Record<string, unknown>;
  const name = normalizeText(raw.name);
  const avatar = normalizeText(raw.avatar);
  const existingAssetId = normalizeText(raw.assetId);
  const fallbackLibraryFromPayload = normalizeText(raw.skillId)
    ? "onmyojiSkill"
    : "";
  const library =
    normalizeAssetLibraryId(raw.library) ||
    normalizeAssetLibraryId(preferredLibrary) ||
    normalizeAssetLibraryId(fallbackLibraryFromPayload) ||
    normalizeAssetLibraryId(inferLibraryFromAvatar(avatar)) ||
    "shikigami";
  const sourceId =
    normalizeText(raw.id) ||
    normalizeText(raw.skillId) ||
    normalizeText(raw.onmyojiId);
  const identitySeed = sourceId || `${name}|${avatar}|${library}`;
  const assetId = existingAssetId
    ? existingAssetId
    : sourceId
      ? `${library || "asset"}:${sourceId}`
      : `asset_${createStableHash(identitySeed || String(Date.now()))}`;

  return {
    ...raw,
    ...(name ? { name } : {}),
    ...(avatar ? { avatar } : {}),
    library,
    assetId,
  };
};

export const normalizeAssetSelectorNode = (node: GraphNode): GraphNode => {
  if (node.type !== "assetSelector") {
    return node;
  }

  const properties =
    node.properties && typeof node.properties === "object"
      ? { ...node.properties }
      : {};
  const normalizedLibrary = normalizeAssetLibraryId(properties.assetLibrary);
  const selectedAsset = normalizeSelectedAssetRecord(
    properties.selectedAsset,
    normalizedLibrary,
  );
  const selectedAssetLibrary = normalizeAssetLibraryId(selectedAsset?.library);

  return {
    ...node,
    properties: {
      ...properties,
      assetLibrary: selectedAssetLibrary || normalizedLibrary || "shikigami",
      selectedAsset,
    },
  };
};
