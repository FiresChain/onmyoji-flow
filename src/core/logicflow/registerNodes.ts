import type LogicFlow from "@logicflow/core";
import { register } from "@logicflow/vue-node-registry";

import type { FlowNodeRegistration } from "./types";

export type FlowNodeRegistrar = (
  registration: FlowNodeRegistration,
  instance: LogicFlow,
) => void;

export function resolveFlowNodeRegistrations(
  registrations?: readonly FlowNodeRegistration[],
  fallbackRegistrations: readonly FlowNodeRegistration[] = [],
): FlowNodeRegistration[] {
  if (Array.isArray(registrations) && registrations.length > 0) {
    return registrations as FlowNodeRegistration[];
  }

  return fallbackRegistrations.map((registration) => ({ ...registration }));
}

export function registerFlowNodes(
  instance: LogicFlow,
  registrations: readonly FlowNodeRegistration[],
  registrar: FlowNodeRegistrar = register,
): void {
  registrations.forEach((registration) => {
    registrar(registration, instance);
  });
}

export const resolveFlowNodes = resolveFlowNodeRegistrations;
