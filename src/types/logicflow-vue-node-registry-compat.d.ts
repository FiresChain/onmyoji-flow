/**
 * LogicFlow vue-node-registry compat declaration (temporary bridge).
 * Freeze policy: do not add new compat modules/symbols.
 * Exit plan: docs/2design/ADR-006-logicflow-compat-exit.md
 */
declare module "@logicflow/vue-node-registry" {
  import type LogicFlow from "@logicflow/core";

  export type VueNodeConfig = {
    type: string;
    component?: any;
    model?: any;
    effect?: string[];
    [key: string]: any;
  };

  export function register(config: VueNodeConfig, lf: LogicFlow): void;
}
