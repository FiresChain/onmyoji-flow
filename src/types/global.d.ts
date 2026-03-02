declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

declare const global: any;

declare namespace NodeJS {
  type Timeout = number;
}

interface FlowFile {
  id?: string;
  name: string;
  label: string;
  type: string;
  visible: boolean;
  graphRawData: unknown;
  transform: {
    SCALE_X: number;
    SCALE_Y: number;
    TRANSLATE_X: number;
    TRANSLATE_Y: number;
  };
  createdAt: number;
  updatedAt: number;
}
