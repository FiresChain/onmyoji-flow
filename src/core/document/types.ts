export type UnknownRecord = Record<string, unknown>;

export interface Transform {
  SCALE_X: number;
  SCALE_Y: number;
  TRANSLATE_X: number;
  TRANSLATE_Y: number;
  [key: string]: unknown;
}

export interface NodeTextStyle {
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  lineHeight?: number;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  letterSpacing?: number;
  padding?: [number, number, number, number];
  background?: string;
  [key: string]: unknown;
}

export interface NodeStyle {
  width?: number;
  height?: number;
  rotate?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number | [number, number, number, number];
  opacity?: number;
  shadow?: {
    color?: string;
    blur?: number;
    offsetX?: number;
    offsetY?: number;
    [key: string]: unknown;
  };
  textStyle?: NodeTextStyle;
  [key: string]: unknown;
}

export interface NodeMeta {
  /** @deprecated Compatibility input only. Use GraphNode.zIndex. */
  z?: number;
  /** @deprecated Compatibility input only. Use GraphNode.zIndex. */
  zIndex?: number;
  locked?: boolean;
  visible?: boolean;
  groupId?: string;
  name?: string;
  assetNameOwnerId?: string;
  createdAt?: number;
  updatedAt?: number;
  [key: string]: unknown;
}

export interface NodeProperties {
  style?: NodeStyle;
  meta?: NodeMeta;
  children?: string[];
  groupMeta?: UnknownRecord;
  assetLibrary?: string;
  selectedAsset?: UnknownRecord | null;
  assetName?: UnknownRecord;
  image?: UnknownRecord;
  text?: UnknownRecord;
  vector?: UnknownRecord;
  shikigami?: UnknownRecord;
  yuhun?: UnknownRecord;
  property?: UnknownRecord;
  [key: string]: unknown;
}

export interface GraphTextData {
  value: string;
  x?: number;
  y?: number;
  editable?: boolean;
  draggable?: boolean;
  [key: string]: unknown;
}

export interface GraphNode {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  zIndex?: number;
  children?: string[];
  properties?: NodeProperties;
  text?: string | GraphTextData;
  [key: string]: unknown;
}

export interface GraphEdge {
  id: string;
  type?: string;
  sourceNodeId: string;
  targetNodeId: string;
  properties?: UnknownRecord;
  text?: string | GraphTextData;
  [key: string]: unknown;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  [key: string]: unknown;
}

export type GraphDocument = GraphData;

export interface FlowFile {
  id: string;
  label: string;
  name: string;
  visible: boolean;
  type: string;
  graphRawData: GraphData;
  transform: Transform;
  createdAt?: number;
  updatedAt?: number;
  [key: string]: unknown;
}

export interface RootDocument {
  schemaVersion: string;
  fileList: FlowFile[];
  activeFile: string;
  activeFileId?: string;
  [key: string]: unknown;
}

type DefaultNodeStyleShape = Required<
  Pick<
    NodeStyle,
    | "width"
    | "height"
    | "rotate"
    | "fill"
    | "stroke"
    | "strokeWidth"
    | "radius"
    | "opacity"
  >
> &
  Pick<NodeStyle, "shadow" | "textStyle">;

const defaultTextPadding = Object.freeze([8, 8, 8, 8]) as unknown as [
  number,
  number,
  number,
  number,
];

export const DefaultNodeStyle = Object.freeze({
  width: 180,
  height: 120,
  rotate: 0,
  fill: "#ffffff",
  stroke: "#dcdfe6",
  strokeWidth: 1,
  radius: 4,
  opacity: 1,
  shadow: Object.freeze({
    color: "rgba(0,0,0,0.1)",
    blur: 4,
    offsetX: 0,
    offsetY: 2,
  }),
  textStyle: Object.freeze({
    color: "#303133",
    fontFamily: "system-ui",
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.4,
    align: "left",
    verticalAlign: "top",
    letterSpacing: 0,
    padding: defaultTextPadding,
  }),
}) as DefaultNodeStyleShape;
