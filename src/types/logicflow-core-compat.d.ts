declare module '@logicflow/core' {
  export type Position = {
    x: number;
    y: number;
    [key: string]: any;
  };

  export type TextData = {
    value: string;
    x?: number;
    y?: number;
    editable?: boolean;
    draggable?: boolean;
    [key: string]: any;
  };

  export type NodeData = {
    id?: string;
    type: string;
    x: number;
    y: number;
    text?: string | TextData;
    zIndex?: number;
    properties?: Record<string, any>;
    [key: string]: any;
  };

  export type EdgeData = {
    id: string;
    type?: string;
    sourceNodeId: string;
    targetNodeId: string;
    text?: string | TextData;
    properties?: Record<string, any>;
    [key: string]: any;
  };

  export type GraphData = {
    nodes: NodeData[];
    edges: EdgeData[];
    [key: string]: any;
  };

  export type GraphConfigData = {
    nodes?: NodeData[];
    edges?: EdgeData[];
    [key: string]: any;
  };

  export type ResizeInfo = {
    deltaX?: number;
    deltaY?: number;
    [key: string]: any;
  };

  export type ResizeNodeData = Record<string, any>;

  export class BaseNodeModel<P = Record<string, any>> {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    visible: boolean;
    draggable: boolean;
    properties?: P;
    [key: string]: any;

    initNodeData(data: any): void;
    setAttributes(): void;
    getProperties(): P;
    setProperties(props: P): void;
    setProperty(key: string, value: any): void;
    moveTo(x: number, y: number): void;
    setZIndex(z: number): void;
    getBounds(): { minX: number; maxX: number; minY: number; maxY: number };
    setHittable(flag: boolean): void;
    setHitable(flag: boolean): void;
    setIsShowAnchor(flag: boolean): void;
    setRotatable(flag: boolean): void;
    setResizable(flag: boolean): void;
    updateProperties(props: Partial<P>): void;
  }

  export class BaseEdgeModel<P = Record<string, any>> {
    id: string;
    type: string;
    visible: boolean;
    properties?: P;
    [key: string]: any;
  }

  export class HtmlNodeModel<P = Record<string, any>> extends BaseNodeModel<P> {
    resize(deltaX: number, deltaY: number): ResizeNodeData;
  }

  export class GraphModel {
    nodes: BaseNodeModel[];
    edges: BaseEdgeModel[];
    selectNodes: BaseNodeModel[];
    selectElements: Map<string, BaseNodeModel | BaseEdgeModel>;
    [key: string]: any;

    getNodeModelById(id: string): BaseNodeModel | undefined;
    moveNodes(ids: string[], deltaX: number, deltaY: number): void;
  }

  export type GraphElementCtor = new (...args: any[]) => BaseNodeModel | BaseEdgeModel;

  export interface ExtensionDefinition {
    pluginName?: string;
    install?: (...args: any[]) => void;
    render?: (...args: any[]) => void;
    [key: string]: any;
  }

  export interface Extension {
    render?: (...args: any[]) => void;
    destroy?: () => void;
    addMenuConfig?: (...args: any[]) => void;
    setMenuByType?: (...args: any[]) => void;
    [key: string]: any;
  }

  export const EventType: {
    [key: string]: string;
    NODE_ADD: string;
    GRAPH_RENDERED: string;
    NODE_CLICK: string;
    BLANK_CLICK: string;
    NODE_PROPERTIES_CHANGE: string;
    NODE_DELETE: string;
    EDGE_ADD: string;
    EDGE_DELETE: string;
  };

  export default class LogicFlow {
    graphModel: GraphModel;
    extension: Record<string, Extension | ExtensionDefinition | any>;
    keyboard: any;
    snaplineModel?: any;
    [key: string]: any;

    constructor(options?: Record<string, any>);

    addNode(config: {
      id?: string;
      type: string;
      x: number;
      y: number;
      [key: string]: any;
    }): BaseNodeModel;
    deleteNode(id: string): boolean;
    getNodeModelById(id: string): BaseNodeModel | undefined;
    getNodeDataById(id: string): NodeData | undefined;
    getNodeEdges(id: string): BaseEdgeModel[];
    setElementZIndex(id: string, zIndex: number | 'top' | 'bottom'): void;
    setProperties(id: string, properties: Record<string, any>): void;
    deleteEdge(id: string): boolean;
    getSelectElements(ignoreCheck?: boolean): GraphData;
    clearSelectElements(): void;
    selectElementById(id: string, multiple?: boolean, toFront?: boolean): void;
    focusOn(id: string | Position): void;
    translate(x: number, y: number): void;
    resize(width?: number, height?: number): void;
    updateEditConfig(config: Record<string, any>): void;
    getGraphRawData(): GraphData;
    render(graphData: GraphConfigData): void;
    on(evt: string, cb: (...args: any[]) => void): void;
    off(evt: string | string[], cb?: (...args: any[]) => void): void;
    destroy(): void;
  }
}
