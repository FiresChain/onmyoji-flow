import type { LogicFlowScope } from "@/ts/useLogicFlow";
import { useEditorContext } from "@/editor/context/useEditorContext";

export function useCanvasSettings(scope?: LogicFlowScope) {
  return (scope ?? useEditorContext()).settings;
}

export function destroyCanvasSettingsScope(_scope?: LogicFlowScope): void {
  // Settings are owned and disposed by EditorContext.
}
