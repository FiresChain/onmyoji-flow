import {
  Control,
  DynamicGroup,
  Label,
  Menu,
  MiniMap,
  SelectionSelect,
  Snapshot,
} from "@logicflow/extension";

import type {
  FlowCapabilityLevel,
  FlowPlugin,
  FlowPluginPresetOptions,
} from "./types";

export function getFlowPluginsByCapability(
  capability: FlowCapabilityLevel,
  options: FlowPluginPresetOptions = {},
): FlowPlugin[] {
  if (capability === "render-only") {
    return [DynamicGroup, Snapshot];
  }

  const enableLabel = options.enableLabel ?? true;
  return [
    DynamicGroup,
    Menu,
    ...(enableLabel ? [Label] : []),
    Snapshot,
    SelectionSelect,
    MiniMap,
    Control,
  ];
}

export function resolveFlowPlugins(
  capability: FlowCapabilityLevel,
  plugins?: readonly FlowPlugin[],
  options: FlowPluginPresetOptions = {},
): FlowPlugin[] {
  if (Array.isArray(plugins) && plugins.length > 0) {
    return plugins as FlowPlugin[];
  }

  return getFlowPluginsByCapability(capability, options);
}

export const getPluginPreset = getFlowPluginsByCapability;
