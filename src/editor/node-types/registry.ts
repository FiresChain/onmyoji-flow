import type { FlowNodeRegistration } from "@/core/logicflow/types";
import { createAssetSelectorNodeRegistration } from "./asset-selector/definition";
import { createImageNodeRegistration } from "./image/definition";
import { createPropertyRuleNodeRegistration } from "./property-rule/definition";
import { createTextNodeRegistration } from "./text/definition";
import { createVectorNodeRegistration } from "./vector/definition";

const freezeRegistration = (
  registration: FlowNodeRegistration,
): Readonly<FlowNodeRegistration> => Object.freeze(registration);

export const DEFAULT_NODE_REGISTRATIONS: readonly Readonly<FlowNodeRegistration>[] =
  Object.freeze([
    freezeRegistration(createPropertyRuleNodeRegistration()),
    freezeRegistration(createImageNodeRegistration()),
    freezeRegistration(createAssetSelectorNodeRegistration()),
    freezeRegistration(createTextNodeRegistration()),
    freezeRegistration(createVectorNodeRegistration()),
  ]);

export function getDefaultNodeRegistrations(): FlowNodeRegistration[] {
  return DEFAULT_NODE_REGISTRATIONS.map((registration) => ({
    ...registration,
  }));
}
