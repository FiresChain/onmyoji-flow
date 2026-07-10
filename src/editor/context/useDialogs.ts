import type { SelectorConfig } from "@/features/assets/public";

import type { EditorDialogType } from "./EditorContext";
import { useEditorContext } from "./useEditorContext";

export function useDialogs() {
  const dialogs = useEditorContext().dialogs;
  return {
    dialogs: dialogs.state,
    openDialog(
      type: EditorDialogType,
      data: unknown = null,
      node: unknown = null,
      callback: ((value: unknown) => void) | null = null,
    ) {
      dialogs.open(type, data, node, callback);
    },
    closeDialog(type: EditorDialogType) {
      dialogs.close(type);
    },
    openGenericSelector(config: SelectorConfig, callback: (item: any) => void) {
      dialogs.openGeneric(config, callback);
    },
    closeGenericSelector() {
      dialogs.closeGeneric();
    },
  };
}
