import type LogicFlow from "@logicflow/core";

import {
  getFlowPluginsByCapability as getPluginPreset,
  resolveFlowPlugins as resolvePluginPreset,
} from "@/core/logicflow/pluginPresets";
import { registerFlowNodes as applyNodeRegistrations } from "@/core/logicflow/registerNodes";
import type {
  FlowCapabilityLevel as CoreFlowCapabilityLevel,
  FlowNodeRegistration as CoreFlowNodeRegistration,
  FlowPlugin as CoreFlowPlugin,
} from "@/core/logicflow/types";
import { getDefaultNodeRegistrations } from "@/editor/node-types/registry";

export type FlowCapabilityLevel = CoreFlowCapabilityLevel;

// Keep the published facade permissive for existing non-Vue registrations.
export interface FlowNodeRegistration {
  type: string;
  component?: any;
  model?: any;
  [key: string]: any;
}

export type FlowPlugin = any;

export function getFlowPluginsByCapability(
  capability: FlowCapabilityLevel,
): FlowPlugin[] {
  return getPluginPreset(capability) as FlowPlugin[];
}

export function resolveFlowPlugins(
  capability: FlowCapabilityLevel,
  plugins?: FlowPlugin[],
): FlowPlugin[] {
  if (Array.isArray(plugins) && plugins.length > 0) {
    return plugins;
  }
  return resolvePluginPreset(capability, plugins as CoreFlowPlugin[]);
}

export function getDefaultFlowNodes(): FlowNodeRegistration[] {
  return getDefaultNodeRegistrations() as FlowNodeRegistration[];
}

export function resolveFlowNodes(
  nodes?: FlowNodeRegistration[],
): FlowNodeRegistration[] {
  if (Array.isArray(nodes) && nodes.length > 0) {
    return nodes;
  }
  return getDefaultFlowNodes();
}

export function registerFlowNodes(
  lfInstance: LogicFlow,
  nodes?: FlowNodeRegistration[],
): void {
  applyNodeRegistrations(
    lfInstance,
    resolveFlowNodes(nodes) as CoreFlowNodeRegistration[],
  );
}
