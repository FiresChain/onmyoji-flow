import type { FlowNodeRegistration } from "@/core/logicflow/types";

import VectorNodeModel from "./Model";
import VectorNode from "./Node.vue";

export const VECTOR_NODE_TYPE = "vectorNode";

export interface VectorNodeProperties extends Record<string, unknown> {
  vector: {
    kind: string;
    tileWidth: number;
    tileHeight: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
  };
  width: number;
  height: number;
}

export const createVectorNodeProperties = (): VectorNodeProperties => ({
  vector: {
    kind: "rect",
    tileWidth: 50,
    tileHeight: 50,
    fill: "#409EFF",
    stroke: "#303133",
    strokeWidth: 1,
  },
  width: 200,
  height: 200,
});

export const createVectorNodeRegistration = (): FlowNodeRegistration => ({
  type: VECTOR_NODE_TYPE,
  component: VectorNode,
  model: VectorNodeModel,
});
