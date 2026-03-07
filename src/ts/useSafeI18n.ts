import { useI18n } from "vue-i18n";
import zh from "@/locales/zh.json";
import ja from "@/locales/ja.json";
import en from "@/locales/en.json";

type ComposerTranslateFn = ReturnType<typeof useI18n>["t"];
type ComposerTranslateArgs = Parameters<ComposerTranslateFn>;
type ComposerTranslateArg1 = ComposerTranslateArgs extends [
  unknown,
  infer A,
  ...unknown[],
]
  ? A
  : unknown;
type ComposerTranslateArg2 = ComposerTranslateArgs extends [
  unknown,
  unknown,
  infer B,
  ...unknown[],
]
  ? B
  : unknown;
type ComposerTranslateRestArgs = [
  ComposerTranslateArg1?,
  ComposerTranslateArg2?,
];
type TranslateFn = (key: string, ...args: ComposerTranslateRestArgs) => string;

type SupportedLocale = "zh" | "ja" | "en";

const FALLBACK_LOCALE_STORAGE_KEY = "yys-editor.locale";
const FALLBACK_MESSAGES: Record<SupportedLocale, Record<string, unknown>> = {
  zh,
  ja,
  en,
};

const normalizeLocale = (input: unknown): SupportedLocale => {
  if (typeof input !== "string") return "zh";
  const normalized = input.trim().toLowerCase();
  if (!normalized) return "zh";
  const short = normalized.split("-")[0];
  if (short === "ja") return "ja";
  if (short === "en") return "en";
  return "zh";
};

const resolveInitialFallbackLocale = (): SupportedLocale => {
  if (typeof window !== "undefined") {
    const queryLang = new URLSearchParams(window.location.search).get("lang");
    if (queryLang) {
      return normalizeLocale(queryLang);
    }
  }

  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem(FALLBACK_LOCALE_STORAGE_KEY);
    if (stored) {
      return normalizeLocale(stored);
    }
  }

  if (typeof navigator !== "undefined") {
    return normalizeLocale(navigator.language);
  }

  return "zh";
};

let fallbackLocaleState: SupportedLocale = resolveInitialFallbackLocale();

const resolveFallbackMessage = (
  locale: SupportedLocale,
  key: string,
): string => {
  const localized = FALLBACK_MESSAGES[locale]?.[key];
  if (typeof localized === "string" && localized.length > 0) {
    return localized;
  }
  const zhMessage = FALLBACK_MESSAGES.zh?.[key];
  if (typeof zhMessage === "string" && zhMessage.length > 0) {
    return zhMessage;
  }
  return key;
};

const persistFallbackLocale = (locale: SupportedLocale) => {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(FALLBACK_LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignore private-mode/storage write errors.
  }
};

const resolveRuntimeLocale = (localeInput: unknown): SupportedLocale => {
  if (typeof localeInput === "string") {
    return normalizeLocale(localeInput);
  }

  if (
    localeInput &&
    typeof localeInput === "object" &&
    "value" in localeInput &&
    typeof (localeInput as { value?: unknown }).value === "string"
  ) {
    return normalizeLocale((localeInput as { value: string }).value);
  }

  return fallbackLocaleState;
};

export function useSafeI18n() {
  let safeT: TranslateFn = (key) =>
    resolveFallbackMessage(fallbackLocaleState, key);
  let resolveLocale = () => fallbackLocaleState;
  let updateLocale = (nextLocale: string) => {
    const normalized = normalizeLocale(nextLocale);
    fallbackLocaleState = normalized;
    persistFallbackLocale(normalized);
  };

  try {
    const { t, locale } = useI18n();
    safeT = (key: string, ...args: ComposerTranslateRestArgs) => {
      const [arg1, arg2] = args;
      const translated =
        arg2 !== undefined
          ? t(key, arg1 as never, arg2 as never)
          : arg1 !== undefined
            ? t(key, arg1 as never)
            : t(key);
      if (
        typeof translated === "string" &&
        translated.length > 0 &&
        translated !== key
      ) {
        return translated;
      }
      const currentLocale = resolveRuntimeLocale(locale);
      return resolveFallbackMessage(currentLocale, key);
    };
    resolveLocale = () => resolveRuntimeLocale(locale);
    updateLocale = (nextLocale: string) => {
      const normalized = normalizeLocale(nextLocale);
      fallbackLocaleState = normalized;
      persistFallbackLocale(normalized);
      if (typeof locale === "string") return;
      locale.value = normalized;
    };
  } catch {
    // The host app may not install vue-i18n; fallback to bundled locales.
  }

  return { t: safeT, getLocale: resolveLocale, setLocale: updateLocale };
}
