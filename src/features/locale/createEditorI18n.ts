import type { Ref } from "vue";

import en from "./messages/en.json";
import ja from "./messages/ja.json";
import zh from "./messages/zh.json";
import { normalizeEditorLocale, type EditorLocale } from "./locale";

export type EditorMessageTree = Record<string, unknown>;
export type EditorLocaleMessages = Readonly<
  Record<EditorLocale, EditorMessageTree>
>;

export const EDITOR_LOCALE_MESSAGES: EditorLocaleMessages = Object.freeze({
  zh: Object.freeze({ ...zh }),
  ja: Object.freeze({ ...ja }),
  en: Object.freeze({ ...en }),
});

export interface EditorLocalePort {
  readonly locale: Ref<EditorLocale>;
  setLocale(locale: string): void;
}

export interface CreateEditorI18nOptions {
  messages?: EditorLocaleMessages;
  fallbackLocale?: EditorLocale;
}

export interface SafeEditorI18n {
  t(key: string, values?: unknown, ...args: unknown[]): string;
  getLocale(): EditorLocale;
  setLocale(locale: string): void;
}

const isLocalePort = (
  source: Ref<EditorLocale> | EditorLocalePort,
): source is EditorLocalePort => "locale" in source;

const resolveMessageValue = (
  messages: EditorMessageTree,
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

const resolveMessage = (
  messages: EditorLocaleMessages,
  locale: EditorLocale,
  fallbackLocale: EditorLocale,
  key: string,
): string => {
  const localized = resolveMessageValue(messages[locale], key);
  if (typeof localized === "string" && localized) return localized;
  const fallback = resolveMessageValue(messages[fallbackLocale], key);
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

export const createEditorI18n = (
  source: Ref<EditorLocale> | EditorLocalePort,
  options: CreateEditorI18nOptions = {},
): SafeEditorI18n => {
  const port = isLocalePort(source) ? source : null;
  const locale: Ref<EditorLocale> = port
    ? port.locale
    : (source as Ref<EditorLocale>);
  const messages = options.messages ?? EDITOR_LOCALE_MESSAGES;
  const fallbackLocale = options.fallbackLocale ?? "zh";

  return {
    t(key, values) {
      const message = resolveMessage(
        messages,
        normalizeEditorLocale(locale.value),
        fallbackLocale,
        key,
      );
      return interpolate(message, values);
    },
    getLocale() {
      return normalizeEditorLocale(locale.value);
    },
    setLocale(nextLocale) {
      if (port) {
        port.setLocale(nextLocale);
        return;
      }
      locale.value = normalizeEditorLocale(nextLocale);
    },
  };
};
