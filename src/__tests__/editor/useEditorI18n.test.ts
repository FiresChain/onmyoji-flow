import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  normalizeEditorLocale,
  type EditorLocale,
} from "@/features/locale/public";

const contextMock = vi.hoisted(() => ({ current: null as any }));

vi.mock("@/editor/context/useEditorContext", () => ({
  tryUseEditorContext: () => contextMock.current,
}));

import { useEditorI18n } from "@/editor/context/useEditorI18n";

describe("useEditorI18n", () => {
  beforeEach(() => {
    contextMock.current = null;
    localStorage.setItem("yys-editor.locale", "zh");
    window.history.replaceState({}, "", "/");
  });

  it("uses the current EditorContext locale port", () => {
    const locale = ref<EditorLocale>("ja");
    const setLocale = vi.fn((nextLocale: string) => {
      locale.value = normalizeEditorLocale(nextLocale);
    });
    contextMock.current = { locale, setLocale };

    const i18n = useEditorI18n();
    i18n.setLocale("en-US");

    expect(setLocale).toHaveBeenCalledWith("en-US");
    expect(i18n.getLocale()).toBe("en");
  });

  it("creates an isolated fallback ref for each call without a context", () => {
    const first = useEditorI18n();
    const second = useEditorI18n();

    first.setLocale("ja");

    expect(first.getLocale()).toBe("ja");
    expect(second.getLocale()).toBe("zh");
  });
});
