import LogicFlow from "@logicflow/core";

import { captureGraphData, clearGraphData, renderGraphData } from "./graphIO";
import { resolveFlowPlugins } from "./pluginPresets";
import {
  registerFlowNodes,
  resolveFlowNodeRegistrations,
} from "./registerNodes";
import type {
  CreateLogicFlowRuntimeOptions,
  EditorPort,
  LogicFlowRuntime,
} from "./types";
import {
  centerViewport,
  fitView,
  getViewport,
  resetViewportTranslate,
  resetViewportZoom,
  setViewport,
  zoomViewport,
} from "./viewport";

const getCapabilityOptions = (
  capability: CreateLogicFlowRuntimeOptions["capability"],
): Record<string, unknown> => {
  if (capability !== "render-only") {
    return {};
  }

  return {
    grid: false,
    keyboard: { enabled: false },
    isSilentMode: true,
    stopScrollGraph: true,
    stopZoomGraph: true,
    stopMoveGraph: true,
    adjustNodePosition: false,
  };
};

export function createEditorPort(
  instance: LogicFlow,
  dispose: () => void,
): EditorPort {
  return {
    render: (data) => renderGraphData(instance, data),
    capture: () => captureGraphData(instance),
    clear: () => clearGraphData(instance),
    resize: (width, height) => instance.resize(width, height),
    getViewport: () => getViewport(instance),
    setViewport: (transform) => setViewport(instance, transform),
    zoom: (zoomSize, point) => zoomViewport(instance, zoomSize, point),
    resetZoom: () => resetViewportZoom(instance),
    resetTranslate: () => resetViewportTranslate(instance),
    translateCenter: () => centerViewport(instance),
    fitView: (verticalOffset, horizontalOffset) =>
      fitView(instance, verticalOffset, horizontalOffset),
    dispose,
  };
}

export function createLogicFlowRuntime(
  options: CreateLogicFlowRuntimeOptions,
): LogicFlowRuntime {
  const capability = options.capability ?? "interactive";
  const plugins = resolveFlowPlugins(capability, options.plugins, {
    enableLabel: options.enableLabel,
  });
  const instance = new LogicFlow({
    ...getCapabilityOptions(capability),
    ...options.logicFlowOptions,
    container: options.container,
    plugins: plugins as never[],
  });

  let disposed = false;
  const dispose = () => {
    if (disposed) {
      return;
    }
    disposed = true;
    instance.destroy();
  };

  try {
    const registrations = resolveFlowNodeRegistrations(
      options.nodeRegistrations,
      options.defaultNodeRegistrations,
    );
    registerFlowNodes(instance, registrations);

    if (options.initialData) {
      renderGraphData(instance, options.initialData);
    }
  } catch (error) {
    dispose();
    throw error;
  }

  return {
    instance,
    port: createEditorPort(instance, dispose),
    dispose,
  };
}

export const createRuntime = createLogicFlowRuntime;
