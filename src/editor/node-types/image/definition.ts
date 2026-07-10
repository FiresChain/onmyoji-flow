import type { FlowNodeRegistration } from "@/core/logicflow/types";

import ImageNode from "./Node.vue";

export const IMAGE_NODE_TYPE = "imageNode";

export interface ImageNodeProperties extends Record<string, unknown> {
  url: string;
  width: number;
  height: number;
}

export const createImageNodeProperties = (): ImageNodeProperties => ({
  url: "",
  width: 180,
  height: 120,
});

export const createImageNodeRegistration = (): FlowNodeRegistration => ({
  type: IMAGE_NODE_TYPE,
  component: ImageNode,
});
