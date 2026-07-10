import { ref } from "vue";
import { describe, expect, it, vi } from "vitest";

import {
  LOCALE_STORAGE_KEY,
  createEditorI18n,
  normalizeEditorLocale,
  resolveInitialEditorLocale,
  type EditorLocale,
  type EditorLocaleMessages,
  type EditorLocalePort,
} from "@/features/locale/public";
import type { StorageLike } from "@/shared/platform/storage";

const createStorage = (storedLocale: string | null): StorageLike => ({
  getItem: vi.fn(() => storedLocale),
  setItem: vi.fn(),
  removeItem: vi.fn(),
});

const messages: EditorLocaleMessages = {
  zh: {
    greeting: "你好，{name}",
    onlyZh: "中文回退",
    nested: { label: "嵌套文本" },
  },
  ja: {
    greeting: "こんにちは、{name}",
  },
  en: {
    greeting: "Hello, {name}",
  },
};

describe("locale resolution", () => {
  it("normalizes supported language tags and falls back to zh", () => {
    expect(normalizeEditorLocale("JA-jp")).toBe("ja");
    expect(normalizeEditorLocale("en-US")).toBe("en");
    expect(normalizeEditorLocale("unsupported")).toBe("zh");
    expect(normalizeEditorLocale(null)).toBe("zh");
  });

  it("resolves query before storage, then navigator, then zh", () => {
    const queryStorage = createStorage("ja");
    expect(
      resolveInitialEditorLocale({
        search: "?lang=en-US",
        storage: queryStorage,
        navigatorLanguage: "zh-CN",
      }),
    ).toBe("en");
    expect(queryStorage.getItem).not.toHaveBeenCalled();
    expect(
      resolveInitialEditorLocale({
        search: "",
        storage: createStorage("ja-JP"),
        navigatorLanguage: "en-US",
      }),
    ).toBe("ja");
    expect(
      resolveInitialEditorLocale({
        search: "",
        storage: null,
        navigatorLanguage: "en-US",
      }),
    ).toBe("en");
    expect(
      resolveInitialEditorLocale({
        search: "",
        storage: null,
        navigatorLanguage: null,
      }),
    ).toBe("zh");
  });

  it("preserves legacy unsupported-query behavior with an opt-in standalone mode", () => {
    expect(
      resolveInitialEditorLocale({
        search: "?lang=unsupported",
        storage: createStorage("ja"),
        navigatorLanguage: "en-US",
      }),
    ).toBe("zh");
    expect(
      resolveInitialEditorLocale({
        search: "?lang=unsupported",
        storage: createStorage("ja"),
        navigatorLanguage: null,
        unsupportedCandidate: "ignore",
      }),
    ).toBe("ja");
  });

  it("optionally persists a valid query locale without changing resolution", () => {
    const storage = createStorage("zh");

    expect(
      resolveInitialEditorLocale({
        search: "?lang=ja",
        storage,
        navigatorLanguage: null,
        persistQuery: true,
      }),
    ).toBe("ja");
    expect(storage.setItem).toHaveBeenCalledWith(LOCALE_STORAGE_KEY, "ja");
  });

  it("tolerates storage read and write failures", () => {
    const storage: StorageLike = {
      getItem: vi.fn(() => {
        throw new Error("read denied");
      }),
      setItem: vi.fn(() => {
        throw new Error("write denied");
      }),
      removeItem: vi.fn(),
    };

    expect(
      resolveInitialEditorLocale({
        search: "",
        storage,
        navigatorLanguage: "en-US",
      }),
    ).toBe("en");
    expect(() =>
      resolveInitialEditorLocale({
        search: "?lang=ja",
        storage,
        navigatorLanguage: null,
        persistQuery: true,
      }),
    ).not.toThrow();
  });
});

describe("createEditorI18n", () => {
  it("falls back to zh, resolves nested keys, and interpolates values", () => {
    const locale = ref<EditorLocale>("ja");
    const i18n = createEditorI18n(locale, { messages });

    expect(i18n.t("greeting", { name: "神楽" })).toBe("こんにちは、神楽");
    expect(i18n.t("onlyZh")).toBe("中文回退");
    expect(i18n.t("nested.label")).toBe("嵌套文本");
    expect(i18n.t("missing.key")).toBe("missing.key");
    expect(i18n.t("greeting", {})).toBe("こんにちは、{name}");
  });

  it("isolates locale refs between instances", () => {
    const firstLocale = ref<EditorLocale>("zh");
    const secondLocale = ref<EditorLocale>("en");
    const first = createEditorI18n(firstLocale, { messages });
    const second = createEditorI18n(secondLocale, { messages });

    first.setLocale("ja-JP");

    expect(first.getLocale()).toBe("ja");
    expect(second.getLocale()).toBe("en");
    expect(firstLocale.value).toBe("ja");
    expect(secondLocale.value).toBe("en");
  });

  it("delegates locale updates through an injected port", () => {
    const locale = ref<EditorLocale>("zh");
    const setLocale = vi.fn((nextLocale: string) => {
      locale.value = normalizeEditorLocale(nextLocale);
    });
    const port: EditorLocalePort = { locale, setLocale };
    const i18n = createEditorI18n(port, { messages });

    i18n.setLocale("en-US");

    expect(setLocale).toHaveBeenCalledWith("en-US");
    expect(i18n.getLocale()).toBe("en");
  });
});
