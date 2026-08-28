import type { AssetLibraryId, AssetLocale } from "@/types/assets";
import {
  resolveAssetLocale,
  normalizeAssetLibraryIdWithFallback,
} from "@/utils/assetLibrary";

export const DEFAULT_ASSET_BASE_URL = "https://onmyoji-assets.fireschain.org";
const DEFAULT_CATALOG_URL = `${DEFAULT_ASSET_BASE_URL}/v1/catalog.json`;
const CATALOG_LIBRARY_IDS = [
  "shikigami",
  "yuhun",
  "onmyoji",
  "onmyojiSkill",
  "hunling",
] as const;

type CatalogLibraryId = (typeof CATALOG_LIBRARY_IDS)[number];
type CatalogRecord = Record<string, any>;
type CatalogLibraries = Record<CatalogLibraryId, CatalogRecord[]>;

export type AssetCatalog = {
  schemaVersion: 1;
  catalogVersion: string;
  generatedAt: string;
  libraries: CatalogLibraries;
};

let loadedCatalog: AssetCatalog | null = null;
let catalogLoadPromise: Promise<AssetCatalog> | null = null;

const validateCatalog = (value: unknown): AssetCatalog => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Asset catalog must be an object");
  }

  const candidate = value as Partial<AssetCatalog>;
  if (candidate.schemaVersion !== 1) {
    throw new TypeError(
      `Unsupported asset catalog schema: ${String(candidate.schemaVersion)}`,
    );
  }
  if (
    typeof candidate.catalogVersion !== "string" ||
    !candidate.catalogVersion.trim()
  ) {
    throw new TypeError("Asset catalog is missing catalogVersion");
  }
  if (!candidate.libraries || typeof candidate.libraries !== "object") {
    throw new TypeError("Asset catalog is missing libraries");
  }
  for (const library of CATALOG_LIBRARY_IDS) {
    if (!Array.isArray(candidate.libraries[library])) {
      throw new TypeError(`Asset catalog library ${library} must be an array`);
    }
  }

  return candidate as AssetCatalog;
};

export const resolveAssetCatalogUrl = (
  assetBaseUrl?: string | null,
): string => {
  const baseUrl = assetBaseUrl?.trim();
  if (!baseUrl) {
    return DEFAULT_CATALOG_URL;
  }
  return `${baseUrl.replace(/\/+$/, "")}/v1/catalog.json`;
};

export const loadAssetCatalog = (
  catalogUrl = DEFAULT_CATALOG_URL,
): Promise<AssetCatalog> => {
  if (loadedCatalog) {
    return Promise.resolve(loadedCatalog);
  }
  if (catalogLoadPromise) {
    return catalogLoadPromise;
  }

  catalogLoadPromise = fetch(catalogUrl)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Failed to load asset catalog: ${response.status} ${response.statusText}`,
        );
      }
      const catalog = validateCatalog(await response.json());
      loadedCatalog = catalog;
      return catalog;
    })
    .catch((error) => {
      catalogLoadPromise = null;
      throw error;
    });

  return catalogLoadPromise;
};

export const isAssetCatalogLoaded = (): boolean => loadedCatalog !== null;

const getCatalogLibraries = (): CatalogLibraries => {
  if (!loadedCatalog) {
    throw new Error(
      "Asset catalog is not loaded; call and await loadAssetCatalog() before rendering onmyoji-flow",
    );
  }
  return loadedCatalog.libraries;
};

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

type DisplayHunLing = {
  id: string;
  library: "hunling";
  avatar: string;
  name: string;
};

export type DisplayAssetRecord =
  | DisplayShikigami
  | DisplayYuhun
  | DisplayOnmyoji
  | DisplayOnmyojiSkill
  | DisplayHunLing;

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
  getCatalogLibraries().onmyoji.forEach((item) => {
    const id = String(item?.id || "").trim();
    if (!id) {
      return;
    }
    map[id] = pickLocalizedText(item?.names, locale, id);
  });
  return map;
};

const toShikigami = (locale: AssetLocale): DisplayShikigami[] =>
  getCatalogLibraries().shikigami.map((item) => {
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
  getCatalogLibraries().yuhun.map((item) => {
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
  getCatalogLibraries().onmyoji.map((item) => {
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
  return getCatalogLibraries().onmyojiSkill.map((item) => {
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

const toHunLing = (locale: AssetLocale): DisplayHunLing[] =>
  getCatalogLibraries().hunling.map((item) => {
    const id = String(item?.id || "").trim();
    return {
      id,
      library: "hunling",
      avatar: String(item?.avatar || ""),
      name: pickLocalizedText(item?.names, locale, id),
    };
  });

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
  if (normalizedLibrary === "hunling") {
    return toHunLing(locale);
  }
  return toOnmyojiSkill(locale);
};
