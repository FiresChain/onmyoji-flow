import type { GraphData } from "@/core/document/types";
import type { FlowCapabilityLevel } from "@/core/logicflow/types";
import type { FlowNodeRegistration, FlowPlugin } from "@/flowRuntime";

export interface EmbedEditorConfig {
  grid?: boolean;
  snapline?: boolean;
  keyboard?: boolean;
  theme?: "light" | "dark";
  locale?: "zh" | "ja" | "en";
}

export interface EmbedEditorShellProps {
  data?: GraphData;
  mode?: "preview" | "edit";
  capability?: FlowCapabilityLevel;
  width?: string | number;
  height?: string | number;
  showToolbar?: boolean;
  showPropertyPanel?: boolean;
  showComponentPanel?: boolean;
  config?: EmbedEditorConfig;
  plugins?: FlowPlugin[];
  nodeRegistrations?: FlowNodeRegistration[];
  assetBaseUrl?: string;
}

export interface EmbedEditorShellExpose {
  getGraphData(): GraphData | null;
  setGraphData(data: GraphData): void;
  resizeCanvas(): void;
  fitView(verticalOffset?: number, horizontalOffset?: number): boolean;
  zoom(zoomSize?: number | boolean, point?: [number, number]): boolean;
  resetZoom(): boolean;
  resetTranslate(): boolean;
  translateCenter(): boolean;
  getTransform(): Record<string, number> | null;
}
