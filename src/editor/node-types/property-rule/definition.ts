import type { FlowNodeRegistration } from "@/core/logicflow/types";

import PropertyRuleNode from "./Node.vue";

export const PROPERTY_RULE_NODE_TYPE = "propertySelect";

export interface PropertyRuleNodeProperties extends Record<string, unknown> {
  property: {
    type: string;
    priority: string;
    value: string;
    description: string;
  };
  width: number;
  height: number;
}

export const createPropertyRuleNodeProperties =
  (): PropertyRuleNodeProperties => ({
    property: {
      type: "未选择",
      priority: "optional",
      value: "",
      description: "",
    },
    width: 180,
    height: 180,
  });

export const createPropertyRuleNodeRegistration = (): FlowNodeRegistration => ({
  type: PROPERTY_RULE_NODE_TYPE,
  component: PropertyRuleNode,
});
