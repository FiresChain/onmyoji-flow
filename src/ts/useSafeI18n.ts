import { useI18n } from "vue-i18n";

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

export function useSafeI18n(fallbackMap: Record<string, string> = {}) {
  let safeT: TranslateFn = (key) => fallbackMap[key] ?? key;
  let resolveLocale = () => {
    if (typeof navigator !== "undefined") {
      return navigator.language || "zh";
    }
    return "zh";
  };
  let updateLocale = (_nextLocale: string) => {
    // no-op fallback when vue-i18n is unavailable
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
      if (typeof translated === "string" && translated.length > 0) {
        return translated;
      }
      return fallbackMap[key] ?? key;
    };
    resolveLocale = () => {
      const rawLocale =
        typeof locale === "string"
          ? locale
          : typeof locale?.value === "string"
            ? locale.value
            : "zh";
      return rawLocale || "zh";
    };
    updateLocale = (nextLocale: string) => {
      if (typeof nextLocale !== "string") return;
      const normalized = nextLocale.trim();
      if (!normalized) return;
      if (typeof locale === "string") return;
      locale.value = normalized;
    };
  } catch {
    // The host app may not install vue-i18n; fallback to key/default text.
  }

  return { t: safeT, getLocale: resolveLocale, setLocale: updateLocale };
}
