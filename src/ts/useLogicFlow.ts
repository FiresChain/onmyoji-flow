import type LogicFlow from "@logicflow/core";
import type { InjectionKey } from "vue";
import { getCurrentInstance, inject, provide } from "vue";

export type LogicFlowScope = symbol;

const DEFAULT_LOGIC_FLOW_SCOPE: LogicFlowScope = Symbol.for(
  "onmyoji-flow:logicflow:default-scope",
);
const LOGIC_FLOW_SCOPE_KEY: InjectionKey<LogicFlowScope> = Symbol(
  "onmyoji-flow:logicflow:scope-key",
);
const logicFlowInstances = new Map<LogicFlowScope, LogicFlow>();

const resolveLogicFlowScope = (scope?: LogicFlowScope): LogicFlowScope =>
  scope ?? DEFAULT_LOGIC_FLOW_SCOPE;

export function createLogicFlowScope(): LogicFlowScope {
  return Symbol("onmyoji-flow:logicflow:scope");
}

export function provideLogicFlowScope(scope: LogicFlowScope) {
  provide(LOGIC_FLOW_SCOPE_KEY, scope);
  return scope;
}

export function useLogicFlowScope(): LogicFlowScope {
  if (!getCurrentInstance()) {
    return DEFAULT_LOGIC_FLOW_SCOPE;
  }
  return inject(LOGIC_FLOW_SCOPE_KEY, DEFAULT_LOGIC_FLOW_SCOPE);
}

export function setLogicFlowInstance(lf: LogicFlow, scope?: LogicFlowScope) {
  logicFlowInstances.set(resolveLogicFlowScope(scope), lf);
}

export function getLogicFlowInstance(scope?: LogicFlowScope): LogicFlow | null {
  return logicFlowInstances.get(resolveLogicFlowScope(scope)) ?? null;
}

export function destroyLogicFlowInstance(scope?: LogicFlowScope) {
  const resolvedScope = resolveLogicFlowScope(scope);
  const instance = logicFlowInstances.get(resolvedScope);
  instance?.destroy();
  logicFlowInstances.delete(resolvedScope);
}
