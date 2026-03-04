import { ref, type Ref } from "vue";
import { useLogicFlowScope, type LogicFlowScope } from "@/ts/useLogicFlow";

type CanvasSettingsState = {
  selectionEnabled: Ref<boolean>;
  snapGridEnabled: Ref<boolean>;
  snaplineEnabled: Ref<boolean>;
};

const canvasSettingsByScope = new Map<LogicFlowScope, CanvasSettingsState>();

const createCanvasSettingsState = (): CanvasSettingsState => ({
  selectionEnabled: ref(true),
  snapGridEnabled: ref(true),
  snaplineEnabled: ref(true),
});

const resolveScope = (scope?: LogicFlowScope): LogicFlowScope =>
  scope ?? useLogicFlowScope();

export function useCanvasSettings(scope?: LogicFlowScope) {
  const resolvedScope = resolveScope(scope);
  let state = canvasSettingsByScope.get(resolvedScope);
  if (!state) {
    state = createCanvasSettingsState();
    canvasSettingsByScope.set(resolvedScope, state);
  }
  return state;
}

export function destroyCanvasSettingsScope(scope?: LogicFlowScope) {
  canvasSettingsByScope.delete(resolveScope(scope));
}
