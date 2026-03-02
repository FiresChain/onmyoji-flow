import { useI18n } from 'vue-i18n'

type ComposerTranslateFn = ReturnType<typeof useI18n>['t']
type ComposerTranslateArgs = Parameters<ComposerTranslateFn>
type ComposerTranslateArg1 = ComposerTranslateArgs extends [unknown, infer A, ...unknown[]] ? A : unknown
type ComposerTranslateArg2 = ComposerTranslateArgs extends [unknown, unknown, infer B, ...unknown[]] ? B : unknown
type ComposerTranslateRestArgs = [ComposerTranslateArg1?, ComposerTranslateArg2?]
type TranslateFn = (key: string, ...args: ComposerTranslateRestArgs) => string

export function useSafeI18n(fallbackMap: Record<string, string> = {}) {
  let safeT: TranslateFn = (key) => fallbackMap[key] ?? key

  try {
    const { t } = useI18n()
    safeT = (key: string, ...args: ComposerTranslateRestArgs) => {
      const [arg1, arg2] = args
      const translated =
        arg2 !== undefined ? t(key, arg1 as never, arg2 as never) :
        arg1 !== undefined ? t(key, arg1 as never) :
        t(key)
      if (typeof translated === 'string' && translated.length > 0) {
        return translated
      }
      return fallbackMap[key] ?? key
    }
  } catch {
    // The host app may not install vue-i18n; fallback to key/default text.
  }

  return { t: safeT }
}
