import AssetSelectorNode from "@/components/flow/nodes/common/AssetSelectorNode.vue";
import ImageNode from "@/components/flow/nodes/common/ImageNode.vue";
import TextNode from "@/components/flow/nodes/common/TextNode.vue";
import TextNodeModel from "@/components/flow/nodes/common/TextNodeModel";
import VectorNode from "@/components/flow/nodes/common/VectorNode.vue";
import VectorNodeModel from "@/components/flow/nodes/common/VectorNodeModel";
import PropertySelectNode from "@/components/flow/nodes/yys/PropertySelectNode.vue";
import type { FlowNodeRegistration } from "@/core/logicflow/types";

const freezeRegistration = (
  registration: FlowNodeRegistration,
): Readonly<FlowNodeRegistration> => Object.freeze(registration);

export const DEFAULT_NODE_REGISTRATIONS: readonly Readonly<FlowNodeRegistration>[] =
  Object.freeze([
    freezeRegistration({
      type: "propertySelect",
      component: PropertySelectNode,
    }),
    freezeRegistration({ type: "imageNode", component: ImageNode }),
    freezeRegistration({
      type: "assetSelector",
      component: AssetSelectorNode,
    }),
    freezeRegistration({
      type: "textNode",
      component: TextNode,
      model: TextNodeModel,
    }),
    freezeRegistration({
      type: "vectorNode",
      component: VectorNode,
      model: VectorNodeModel,
    }),
  ]);

export function getDefaultNodeRegistrations(): FlowNodeRegistration[] {
  return DEFAULT_NODE_REGISTRATIONS.map((registration) => ({
    ...registration,
  }));
}
