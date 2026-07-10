import { ref } from "vue";

import {
  createEditorI18n,
  resolveInitialEditorLocale,
  type EditorLocalePort,
  type SafeEditorI18n,
} from "@/features/locale/public";
import { tryUseEditorContext } from "./useEditorContext";

export function useEditorI18n(): SafeEditorI18n {
  const context = tryUseEditorContext();
  if (!context) {
    return createEditorI18n(ref(resolveInitialEditorLocale()));
  }

  const port: EditorLocalePort = {
    locale: context.locale,
    setLocale(locale) {
      context.setLocale(locale);
    },
  };
  return createEditorI18n(port);
}
