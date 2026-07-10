import type { BaseNodeModel, default as LogicFlow } from "@logicflow/core";
import type { Ref } from "vue";

import { createLogicFlowRuntime } from "@/core/logicflow/createRuntime";
import { getDefaultNodeRegistrations } from "@/editor/node-types/registry";
import type { LogicFlowScope } from "@/ts/useLogicFlow";

import { bindEditorEvents } from "./bindEditorEvents";
import { configureEditorContextMenu } from "./contextMenu";
import {
  bindEditorKeyboardShortcuts,
  type ShortcutHandler,
} from "./keyboardShortcuts";

export interface FlowEditorRuntimeOptions {
  lf: Ref<LogicFlow | null>;
  containerRef: Ref<HTMLElement | null>;
  logicFlowScope: LogicFlowScope;
  enableLabel: boolean;
  configSnapGridEnabled: boolean;
  configSnaplineEnabled: boolean;
  configKeyboardEnabled: boolean;
  snaplineEnabled: Ref<boolean>;
  snapGridEnabled: Ref<boolean>;
  selectionEnabled: Ref<boolean>;
  selectedNode: Ref<any>;
  bringToFront: (nodeId?: string) => void;
  bringForward: (nodeId?: string) => void;
  sendBackward: (nodeId?: string) => void;
  sendToBack: (nodeId?: string) => void;
  deleteNode: (nodeId: string) => void;
  deleteSelectedElements: ShortcutHandler;
  groupSelectedNodes: ShortcutHandler;
  ungroupSelectedNodes: ShortcutHandler;
  toggleLockSelected: ShortcutHandler;
  toggleVisibilitySelected: ShortcutHandler;
  handleArrowMove: (
    direction: "left" | "right" | "up" | "down",
    event?: KeyboardEvent,
  ) => boolean | void;
  normalizeNodeModel: (model: BaseNodeModel) => void;
  scheduleGroupRuleValidation: (delay?: number) => void;
  emitGraphDataChange: () => void;
  sanitizeGraphLabels: () => void;
  updateSelectedCount: () => void;
  normalizeAllNodes: () => void;
  applyKeyboardEnabled: (enabled: boolean) => void;
  applySelectionSelect: (enabled: boolean) => void;
}

const runDisposers = (disposers: Array<() => void>): unknown => {
  let cleanupError: unknown;
  disposers.forEach((dispose) => {
    try {
      dispose();
    } catch (error) {
      cleanupError ??= error;
    }
  });
  return cleanupError;
};

export function mountFlowEditorRuntime(
  options: FlowEditorRuntimeOptions,
): () => void {
  const {
    lf,
    containerRef,
    logicFlowScope,
    enableLabel,
    configSnapGridEnabled,
    configSnaplineEnabled,
    configKeyboardEnabled,
    snaplineEnabled,
    snapGridEnabled,
    selectionEnabled,
    selectedNode,
    bringToFront,
    bringForward,
    sendBackward,
    sendToBack,
    deleteNode,
    deleteSelectedElements,
    groupSelectedNodes,
    ungroupSelectedNodes,
    toggleLockSelected,
    toggleVisibilitySelected,
    handleArrowMove,
    normalizeNodeModel,
    scheduleGroupRuleValidation,
    emitGraphDataChange,
    sanitizeGraphLabels,
    updateSelectedCount,
    normalizeAllNodes,
    applyKeyboardEnabled,
    applySelectionSelect,
  } = options;

  if (!containerRef.value) return () => {};

  const runtime = createLogicFlowRuntime({
    container: containerRef.value,
    capability: "interactive",
    enableLabel,
    defaultNodeRegistrations: getDefaultNodeRegistrations(),
    logicFlowOptions: {
      grid: { type: "dot", size: 10 },
      stopMoveGraph: true,
      allowResize: true,
      allowRotate: true,
      overlapMode: -1,
      snapline: snaplineEnabled.value,
      keyboard: { enabled: true },
      style: {
        text: {
          color: "#333333",
          fontSize: 14,
          background: {
            fill: "#ffffff",
            stroke: "#dcdfe6",
            strokeWidth: 1,
            radius: 4,
          },
        },
        nodeText: {
          color: "#333333",
          fontSize: 14,
        },
      },
      pluginsOptions: {
        label: {
          isMultiple: false,
          textOverflowMode: "wrap",
        },
        miniMap: {
          isShowHeader: false,
          isShowCloseIcon: true,
          width: 200,
          height: 140,
          rightPosition: 16,
          bottomPosition: 16,
        },
      },
    },
  });
  lf.value = runtime.instance;
  const instance = lf.value;
  if (!instance) {
    runtime.dispose();
    return () => {};
  }

  const previousSnapGridEnabled = snapGridEnabled.value;
  const previousSnaplineEnabled = snaplineEnabled.value;
  let disposeKeyboard: (() => void) | null = null;
  let disposeEvents: (() => void) | null = null;
  let settingsChanged = false;

  try {
    disposeKeyboard = bindEditorKeyboardShortcuts({
      instance,
      deleteSelectedElements,
      groupSelectedNodes,
      ungroupSelectedNodes,
      toggleLockSelected,
      toggleVisibilitySelected,
      handleArrowMove,
    });

    configureEditorContextMenu({
      instance,
      bringToFront,
      bringForward,
      sendBackward,
      sendToBack,
      deleteNode,
      deleteSelectedElements,
      groupSelectedNodes,
      ungroupSelectedNodes,
      toggleLockSelected,
      toggleVisibilitySelected,
    });

    logicFlowScope.setRuntime(runtime);
    settingsChanged = true;
    snapGridEnabled.value = configSnapGridEnabled;
    snaplineEnabled.value = configSnaplineEnabled;
    applyKeyboardEnabled(configKeyboardEnabled);
    applySelectionSelect(selectionEnabled.value);

    disposeEvents = bindEditorEvents({
      instance,
      selectionEnabled,
      selectedNode,
      normalizeNodeModel,
      scheduleGroupRuleValidation,
      emitGraphDataChange,
      sanitizeGraphLabels,
      updateSelectedCount,
      normalizeAllNodes,
      applySelectionSelect,
    });
  } catch (error) {
    runDisposers(
      [disposeEvents, disposeKeyboard].filter(
        (dispose): dispose is () => void => dispose !== null,
      ),
    );
    let cleared = false;
    try {
      cleared = logicFlowScope.clearRuntime(runtime);
    } catch {
      // Runtime disposal below is still required.
    }
    if (!cleared) {
      try {
        runtime.dispose();
      } catch {
        // Preserve the mount error.
      }
    }
    if (settingsChanged) {
      snapGridEnabled.value = previousSnapGridEnabled;
      snaplineEnabled.value = previousSnaplineEnabled;
    }
    if (lf.value === instance) {
      lf.value = null;
    }
    throw error;
  }

  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;

    let cleanupError = runDisposers([disposeEvents, disposeKeyboard]);
    try {
      logicFlowScope.clearRuntime(runtime);
    } catch (error) {
      cleanupError ??= error;
    }
    if (lf.value === instance) {
      lf.value = null;
    }
    if (cleanupError) throw cleanupError;
  };
}

export function useFlowEditorRuntime() {
  return { mountFlowEditorRuntime };
}
