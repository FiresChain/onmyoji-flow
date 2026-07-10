import type LogicFlow from "@logicflow/core";
import type { VueNodeConfig } from "@logicflow/vue-node-registry";

import type { GraphData, Transform } from "@/core/document/types";

export type FlowCapabilityLevel = "render-only" | "interactive";

export type FlowPlugin = LogicFlow["plugins"][number];

export interface FlowNodeRegistration extends VueNodeConfig {
  type: string;
}

export interface EditorPort {
  render(data: GraphData): void;
  capture(): GraphData;
  clear(): void;
  getViewport(): Transform;
  setViewport(transform: Transform): void;
  fitView(): void;
  dispose(): void;
}

export interface LogicFlowRuntime {
  instance: LogicFlow;
  port: EditorPort;
  dispose(): void;
}

export interface FlowPluginPresetOptions {
  enableLabel?: boolean;
}

export interface CreateLogicFlowRuntimeOptions {
  container: HTMLElement;
  capability?: FlowCapabilityLevel;
  enableLabel?: boolean;
  plugins?: readonly FlowPlugin[];
  nodeRegistrations?: readonly FlowNodeRegistration[];
  defaultNodeRegistrations?: readonly FlowNodeRegistration[];
  logicFlowOptions?: Record<string, unknown>;
  initialData?: GraphData;
}
