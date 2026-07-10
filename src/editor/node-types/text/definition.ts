import type { FlowNodeRegistration } from "@/core/logicflow/types";

import TextNodeModel from "./Model";
import TextNode from "./Node.vue";

export const TEXT_NODE_TYPE = "textNode";
export const DEFAULT_TEXT_NODE_HTML = "<p>请输入文本</p>";

export interface TextNodeProperties extends Record<string, unknown> {
  text: {
    content: string;
    rich: boolean;
  };
  width: number;
  height: number;
}

export const createTextNodeProperties = (
  content = DEFAULT_TEXT_NODE_HTML,
): TextNodeProperties => ({
  text: {
    content,
    rich: true,
  },
  width: 200,
  height: 120,
});

export const createTextNodeRegistration = (): FlowNodeRegistration => ({
  type: TEXT_NODE_TYPE,
  component: TextNode,
  model: TextNodeModel,
});
