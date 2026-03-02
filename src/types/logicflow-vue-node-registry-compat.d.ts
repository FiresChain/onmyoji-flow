declare module '@logicflow/vue-node-registry' {
  import type LogicFlow from '@logicflow/core';

  export type VueNodeConfig = {
    type: string;
    component?: any;
    model?: any;
    effect?: string[];
    [key: string]: any;
  };

  export function register(config: VueNodeConfig, lf: LogicFlow): void;
}
