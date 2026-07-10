import type { StorageLike } from "@/shared/platform/storage";

export const LOCALE_STORAGE_KEY = "yys-editor.locale";

export const SUPPORTED_EDITOR_LOCALES = ["zh", "ja", "en"] as const;

export type EditorLocale = (typeof SUPPORTED_EDITOR_LOCALES)[number];

export interface ResolveInitialEditorLocaleOptions {
  search?: string | null;
  storage?: StorageLike | null;
  navigatorLanguage?: string | null;
  persistQuery?: boolean;
  unsupportedCandidate?: "fallback" | "ignore";
}

const parseEditorLocale = (input: unknown): EditorLocale | null => {
  if (typeof input !== "string") return null;
  const short = input.trim().toLowerCase().split("-")[0];
  return short === "zh" || short === "ja" || short === "en" ? short : null;
};

export const normalizeEditorLocale = (input: unknown): EditorLocale =>
  parseEditorLocale(input) ?? "zh";

const getBrowserStorage = (): StorageLike | null => {
  try {
    return typeof globalThis === "undefined"
      ? null
      : (globalThis.localStorage ?? null);
  } catch {
    return null;
  }
};

const getBrowserSearch = (): string => {
  try {
    return typeof window === "undefined" ? "" : window.location.search;
  } catch {
    return "";
  }
};

const getBrowserLanguage = (): string => {
  try {
    return typeof navigator === "undefined" ? "" : navigator.language;
  } catch {
    return "";
  }
};

const resolveCandidate = (
  input: unknown,
  unsupportedCandidate: "fallback" | "ignore",
): EditorLocale | null => {
  if (typeof input !== "string" || !input.trim()) return null;
  return (
    parseEditorLocale(input) ??
    (unsupportedCandidate === "fallback" ? "zh" : null)
  );
};

const readStoredLocale = (
  storage: StorageLike | null,
  unsupportedCandidate: "fallback" | "ignore",
): EditorLocale | null => {
  try {
    return resolveCandidate(
      storage?.getItem(LOCALE_STORAGE_KEY),
      unsupportedCandidate,
    );
  } catch {
    return null;
  }
};

const persistLocale = (
  storage: StorageLike | null,
  locale: EditorLocale,
): void => {
  try {
    storage?.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Storage is optional in embedded/private-mode environments.
  }
};

export const resolveInitialEditorLocale = (
  options: ResolveInitialEditorLocaleOptions = {},
): EditorLocale => {
  const search =
    options.search === undefined ? getBrowserSearch() : (options.search ?? "");
  const unsupportedCandidate = options.unsupportedCandidate ?? "fallback";
  const queryLocale = resolveCandidate(
    new URLSearchParams(search).get("lang"),
    unsupportedCandidate,
  );

  if (queryLocale && !options.persistQuery) {
    return queryLocale;
  }

  const storage =
    options.storage === undefined ? getBrowserStorage() : options.storage;
  const storedLocale = readStoredLocale(storage, unsupportedCandidate);

  if (queryLocale) {
    if (options.persistQuery && queryLocale !== storedLocale) {
      persistLocale(storage, queryLocale);
    }
    return queryLocale;
  }

  if (storedLocale) {
    return storedLocale;
  }

  const navigatorLanguage =
    options.navigatorLanguage === undefined
      ? getBrowserLanguage()
      : (options.navigatorLanguage ?? "");
  return parseEditorLocale(navigatorLanguage) ?? "zh";
};
