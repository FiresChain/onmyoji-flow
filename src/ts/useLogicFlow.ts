import type LogicFlow from "@logicflow/core";

import { createEditorPort } from "@/core/logicflow/createRuntime";
import type {
  LogicFlowRuntime,
  CreateLogicFlowRuntimeOptions,
} from "@/core/logicflow/types";
import {
  createEditorContext,
  type CreateEditorContextOptions,
  type EditorContext,
} from "@/editor/context/EditorContext";
import {
  provideEditorContext,
  tryUseEditorContext,
  useEditorContext,
} from "@/editor/context/useEditorContext";

export type LogicFlowScope = EditorContext;

export function createLogicFlowScope(
  options: CreateEditorContextOptions = {},
): LogicFlowScope {
  return createEditorContext(options);
}

export function provideLogicFlowScope(scope: LogicFlowScope): LogicFlowScope {
  return provideEditorContext(scope);
}

export function useLogicFlowScope(): LogicFlowScope {
  return useEditorContext();
}

const createCompatibilityRuntime = (instance: LogicFlow): LogicFlowRuntime => {
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    instance.destroy();
  };
  return {
    instance,
    port: createEditorPort(instance, dispose),
    dispose,
  };
};

const resolveScope = (scope?: LogicFlowScope): LogicFlowScope | null =>
  scope ?? tryUseEditorContext();

export function setLogicFlowInstance(
  instance: LogicFlow,
  scope?: LogicFlowScope,
): void {
  const context = resolveScope(scope);
  if (!context) {
    throw new Error("EditorContext is unavailable");
  }
  context.setRuntime(createCompatibilityRuntime(instance));
}

export function getLogicFlowInstance(scope?: LogicFlowScope): LogicFlow | null {
  return resolveScope(scope)?.runtime.value?.instance ?? null;
}

export function clearLogicFlowInstance(
  scope?: LogicFlowScope,
  expectedInstance?: LogicFlow,
): void {
  const context = resolveScope(scope);
  const runtime = context?.runtime.value;
  if (!context || !runtime) return;
  if (expectedInstance && runtime.instance !== expectedInstance) return;
  context.clearRuntime(runtime);
}

export function destroyLogicFlowInstance(scope?: LogicFlowScope): void {
  const context = resolveScope(scope);
  const runtime = context?.runtime.value;
  if (context && runtime) {
    context.clearRuntime(runtime);
  }
}

export type { CreateLogicFlowRuntimeOptions };
