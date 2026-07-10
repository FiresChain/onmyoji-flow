import { reactive, ref, shallowRef, type Ref, type ShallowRef } from "vue";

import type { EditorPort, LogicFlowRuntime } from "@/core/logicflow/types";
import type { SelectorConfig } from "@/types/selector";

export type EditorLocale = "zh" | "ja" | "en";
export type EditorAssetUrlResolver = (path: string) => string;
export type EditorContextDisposer = () => void;

export interface EditorSettings {
  selectionEnabled: Ref<boolean>;
  snapGridEnabled: Ref<boolean>;
  snaplineEnabled: Ref<boolean>;
  keyboardEnabled: Ref<boolean>;
}

export interface EditorDialogEntry {
  show: boolean;
  data: unknown;
  node: unknown;
  config: SelectorConfig | null;
  callback: ((value: unknown) => void) | null;
}

export type EditorDialogType = "property" | "generic";

export interface EditorDialogState {
  property: EditorDialogEntry;
  generic: EditorDialogEntry;
}

export interface EditorDialogs {
  state: EditorDialogState;
  open(
    type: EditorDialogType,
    data?: unknown,
    node?: unknown,
    callback?: ((value: unknown) => void) | null,
  ): void;
  close(type: EditorDialogType): void;
  openGeneric(config: SelectorConfig, callback: (value: unknown) => void): void;
  closeGeneric(): void;
  closeAll(): void;
}

export interface EditorContext {
  readonly runtime: ShallowRef<LogicFlowRuntime | null>;
  readonly port: ShallowRef<EditorPort | null>;
  readonly settings: EditorSettings;
  readonly dialogs: EditorDialogs;
  readonly locale: Ref<EditorLocale>;
  readonly resolveAssetUrl: EditorAssetUrlResolver;
  readonly disposed: boolean;
  setRuntime(runtime: LogicFlowRuntime | null): void;
  clearRuntime(expectedRuntime: LogicFlowRuntime): boolean;
  setLocale(locale: string): void;
  setAssetBaseUrl(baseUrl?: string | null): void;
  addDisposer(disposer: EditorContextDisposer): EditorContextDisposer;
  dispose(): void;
}

export interface CreateEditorContextOptions {
  runtime?: LogicFlowRuntime | null;
  settings?: Partial<{
    selectionEnabled: boolean;
    snapGridEnabled: boolean;
    snaplineEnabled: boolean;
    keyboardEnabled: boolean;
  }>;
  locale?: string;
  assetBaseUrl?: string | null;
  assetResolver?: EditorAssetUrlResolver;
}

const EDITOR_CONTEXT_GRAPH_KEY = Symbol("onmyoji-flow:editor-context");
const ASSET_PATH_PREFIX = "/assets/";
const URL_PROTOCOL_RE = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//;

type EditorContextGraphModel = object & {
  [EDITOR_CONTEXT_GRAPH_KEY]?: EditorContext;
};

const normalizeLocale = (locale: unknown): EditorLocale => {
  if (typeof locale !== "string") return "zh";
  const normalized = locale.trim().toLowerCase().split("-")[0];
  if (normalized === "ja" || normalized === "en") return normalized;
  return "zh";
};

const normalizeAssetBaseUrl = (baseUrl?: string | null): string => {
  const trimmed = baseUrl?.trim() ?? "";
  if (!trimmed || trimmed === "/") return "/";
  if (URL_PROTOCOL_RE.test(trimmed)) {
    return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
  }
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
};

export function createEditorAssetUrlResolver(
  baseUrl?: string | null,
): EditorAssetUrlResolver {
  const normalizedBaseUrl = normalizeAssetBaseUrl(baseUrl);
  return (path) => {
    if (!path.startsWith(ASSET_PATH_PREFIX) || normalizedBaseUrl === "/") {
      return path;
    }
    return `${normalizedBaseUrl}${path.slice(1)}`;
  };
}

const createDialogEntry = (): EditorDialogEntry => ({
  show: false,
  data: null,
  node: null,
  config: null,
  callback: null,
});

const createEditorDialogs = (): EditorDialogs => {
  const state = reactive<EditorDialogState>({
    property: createDialogEntry(),
    generic: createDialogEntry(),
  });

  const close = (type: EditorDialogType) => {
    Object.assign(state[type], createDialogEntry());
  };

  return {
    state,
    open(type, data = null, node = null, callback = null) {
      Object.assign(state[type], {
        ...createDialogEntry(),
        show: true,
        data,
        node,
        callback,
      });
    },
    close,
    openGeneric(config, callback) {
      Object.assign(state.generic, {
        ...createDialogEntry(),
        show: true,
        config,
        callback,
      });
    },
    closeGeneric() {
      close("generic");
    },
    closeAll() {
      close("property");
      close("generic");
    },
  };
};

export function getEditorContextFromGraphModel(
  graphModel: unknown,
): EditorContext | null {
  if (!graphModel || typeof graphModel !== "object") return null;
  return (
    (graphModel as EditorContextGraphModel)[EDITOR_CONTEXT_GRAPH_KEY] ?? null
  );
}

export function attachEditorContextToGraphModel(
  graphModel: object,
  context: EditorContext,
): EditorContextDisposer {
  const target = graphModel as EditorContextGraphModel;
  Object.defineProperty(target, EDITOR_CONTEXT_GRAPH_KEY, {
    configurable: true,
    value: context,
  });

  return context.addDisposer(() => {
    if (target[EDITOR_CONTEXT_GRAPH_KEY] === context) {
      delete target[EDITOR_CONTEXT_GRAPH_KEY];
    }
  });
}

export function createEditorContext(
  options: CreateEditorContextOptions = {},
): EditorContext {
  const runtime = shallowRef<LogicFlowRuntime | null>(null);
  const port = shallowRef<EditorPort | null>(null);
  const settings: EditorSettings = {
    selectionEnabled: ref(options.settings?.selectionEnabled ?? true),
    snapGridEnabled: ref(options.settings?.snapGridEnabled ?? true),
    snaplineEnabled: ref(options.settings?.snaplineEnabled ?? true),
    keyboardEnabled: ref(options.settings?.keyboardEnabled ?? true),
  };
  const dialogs = createEditorDialogs();
  const locale = ref<EditorLocale>(normalizeLocale(options.locale));
  let assetResolver =
    options.assetResolver ?? createEditorAssetUrlResolver(options.assetBaseUrl);
  const resolveAssetUrl = (path: string): string => assetResolver(path);
  const disposers = new Set<EditorContextDisposer>();
  let runtimeGraphDisposer: EditorContextDisposer | null = null;
  let isDisposed = false;
  let context: EditorContext;

  const addDisposer = (
    disposer: EditorContextDisposer,
  ): EditorContextDisposer => {
    if (isDisposed) {
      disposer();
      return () => {};
    }

    let active = true;
    const run = () => {
      if (!active) return;
      active = false;
      disposers.delete(run);
      disposer();
    };
    disposers.add(run);
    return run;
  };

  const setRuntime = (nextRuntime: LogicFlowRuntime | null) => {
    if (isDisposed) {
      nextRuntime?.dispose();
      return;
    }
    if (runtime.value === nextRuntime) return;

    runtimeGraphDisposer?.();
    runtimeGraphDisposer = null;
    const previousRuntime = runtime.value;
    runtime.value = nextRuntime;
    port.value = nextRuntime?.port ?? null;
    previousRuntime?.dispose();

    const graphModel = nextRuntime?.instance.graphModel;
    if (graphModel) {
      runtimeGraphDisposer = attachEditorContextToGraphModel(
        graphModel,
        context,
      );
    }
  };

  const dispose = () => {
    if (isDisposed) return;
    isDisposed = true;

    runtimeGraphDisposer?.();
    runtimeGraphDisposer = null;
    const currentRuntime = runtime.value;
    runtime.value = null;
    port.value = null;
    dialogs.closeAll();
    let cleanupError: unknown;
    [...disposers].forEach((disposer) => {
      try {
        disposer();
      } catch (error) {
        cleanupError ??= error;
      }
    });
    try {
      currentRuntime?.dispose();
    } catch (error) {
      cleanupError ??= error;
    }
    if (cleanupError) {
      throw cleanupError;
    }
  };

  context = {
    runtime,
    port,
    settings,
    dialogs,
    locale,
    resolveAssetUrl,
    get disposed() {
      return isDisposed;
    },
    setRuntime,
    clearRuntime(expectedRuntime) {
      if (runtime.value !== expectedRuntime) {
        return false;
      }
      setRuntime(null);
      return true;
    },
    setLocale(nextLocale) {
      locale.value = normalizeLocale(nextLocale);
    },
    setAssetBaseUrl(nextBaseUrl) {
      assetResolver = createEditorAssetUrlResolver(nextBaseUrl);
    },
    addDisposer,
    dispose,
  };

  if (options.runtime) {
    setRuntime(options.runtime);
  }

  return context;
}
