import { ref, type Ref } from "vue";

import zh from "@/locales/zh.json";
import ja from "@/locales/ja.json";
import en from "@/locales/en.json";
import {
  type EditorLocale,
  type EditorContext,
} from "@/editor/context/EditorContext";
import { tryUseEditorContext } from "@/editor/context/useEditorContext";

export const LOCALE_STORAGE_KEY = "yys-editor.locale";

const MESSAGES: Record<EditorLocale, Record<string, unknown>> = { zh, ja, en };

export const normalizeEditorLocale = (input: unknown): EditorLocale => {
  if (typeof input !== "string") return "zh";
  const short = input.trim().toLowerCase().split("-")[0];
  return short === "ja" || short === "en" ? short : "zh";
};

export const resolveInitialEditorLocale = (): EditorLocale => {
  if (typeof window !== "undefined") {
    const queryLocale = new URLSearchParams(window.location.search).get("lang");
    if (queryLocale) return normalizeEditorLocale(queryLocale);
  }
  if (typeof localStorage !== "undefined") {
    try {
      const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (storedLocale) return normalizeEditorLocale(storedLocale);
    } catch {
      // Storage is optional in embedded/private-mode environments.
    }
  }
  if (typeof navigator !== "undefined") {
    return normalizeEditorLocale(navigator.language);
  }
  return "zh";
};

const resolveMessageValue = (
  messages: Record<string, unknown>,
  key: string,
): unknown => {
  if (Object.prototype.hasOwnProperty.call(messages, key)) {
    return messages[key];
  }
  return key.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, messages);
};

const resolveMessage = (locale: EditorLocale, key: string): string => {
  const localized = resolveMessageValue(MESSAGES[locale], key);
  if (typeof localized === "string" && localized) return localized;
  const fallback = resolveMessageValue(MESSAGES.zh, key);
  return typeof fallback === "string" && fallback ? fallback : key;
};

const interpolate = (message: string, values: unknown): string => {
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    return message;
  }
  return message.replace(/\{([^}]+)\}/g, (match, key: string) => {
    const value = (values as Record<string, unknown>)[key];
    return value == null ? match : String(value);
  });
};

export interface SafeEditorI18n {
  t(key: string, values?: unknown, ...args: unknown[]): string;
  getLocale(): EditorLocale;
  setLocale(locale: string): void;
}

const createLocalLocale = (): Ref<EditorLocale> =>
  ref(resolveInitialEditorLocale());

export function useSafeI18n(): SafeEditorI18n {
  const context: EditorContext | null = tryUseEditorContext();
  const locale = context?.locale ?? createLocalLocale();

  return {
    t(key, values) {
      return interpolate(resolveMessage(locale.value, key), values);
    },
    getLocale() {
      return locale.value;
    },
    setLocale(nextLocale) {
      if (context) {
        context.setLocale(nextLocale);
      } else {
        locale.value = normalizeEditorLocale(nextLocale);
      }
    },
  };
}
