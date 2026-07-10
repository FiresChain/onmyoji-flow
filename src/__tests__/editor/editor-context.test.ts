import { createApp, defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  attachEditorContextToGraphModel,
  createEditorContext,
  getEditorContextFromGraphModel,
} from "@/editor/context/EditorContext";
import {
  provideEditorContext,
  tryUseEditorContext,
  useEditorContext,
} from "@/editor/context/useEditorContext";
import type { LogicFlowRuntime } from "@/core/logicflow/types";

const mountedApps: Array<ReturnType<typeof createApp>> = [];

const mountApp = (root: Parameters<typeof createApp>[0]) => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const app = createApp(root);
  app.mount(host);
  mountedApps.push(app);
  return host;
};

const createRuntime = () => {
  const graphModel = {};
  const port = {
    render: vi.fn(),
    capture: vi.fn(() => ({ nodes: [], edges: [] })),
    clear: vi.fn(),
    getViewport: vi.fn(() => ({
      SCALE_X: 1,
      SCALE_Y: 1,
      TRANSLATE_X: 0,
      TRANSLATE_Y: 0,
    })),
    setViewport: vi.fn(),
    fitView: vi.fn(),
    dispose: vi.fn(),
  };
  const runtime = {
    instance: { graphModel },
    port,
    dispose: vi.fn(),
  } as unknown as LogicFlowRuntime;
  return { graphModel, port, runtime };
};

afterEach(() => {
  mountedApps.splice(0).forEach((app) => app.unmount());
  document.body.innerHTML = "";
});

describe("EditorContext instance state", () => {
  it("isolates settings, dialogs, locale, and asset resolvers per instance", () => {
    const first = createEditorContext({
      locale: "ja-JP",
      assetBaseUrl: "/first-app",
    });
    const second = createEditorContext({
      locale: "en",
      assetBaseUrl: "https://cdn.example.com/editor",
    });

    first.settings.selectionEnabled.value = false;
    first.dialogs.open("property", { id: "first" });
    first.setLocale("zh-CN");

    expect(second.settings.selectionEnabled.value).toBe(true);
    expect(second.dialogs.state.property.show).toBe(false);
    expect(first.locale.value).toBe("zh");
    expect(second.locale.value).toBe("en");
    expect(first.resolveAssetUrl("/assets/a.png")).toBe(
      "/first-app/assets/a.png",
    );
    expect(second.resolveAssetUrl("/assets/a.png")).toBe(
      "https://cdn.example.com/editor/assets/a.png",
    );

    first.setAssetBaseUrl("/updated-app");
    expect(first.resolveAssetUrl("/assets/a.png")).toBe(
      "/updated-app/assets/a.png",
    );
    expect(second.resolveAssetUrl("/assets/a.png")).toBe(
      "https://cdn.example.com/editor/assets/a.png",
    );
  });

  it("does not let a stale runtime disposer clear its replacement", () => {
    const firstRuntime = createRuntime();
    const secondRuntime = createRuntime();
    const context = createEditorContext({ runtime: firstRuntime.runtime });

    context.setRuntime(secondRuntime.runtime);

    expect(context.clearRuntime(firstRuntime.runtime)).toBe(false);
    expect(context.runtime.value).toBe(secondRuntime.runtime);
    expect(secondRuntime.runtime.dispose).not.toHaveBeenCalled();

    expect(context.clearRuntime(secondRuntime.runtime)).toBe(true);
    expect(context.runtime.value).toBeNull();
    expect(secondRuntime.runtime.dispose).toHaveBeenCalledOnce();
  });

  it("owns runtime and port refs, replaces runtimes, and disposes once", () => {
    const firstRuntime = createRuntime();
    const secondRuntime = createRuntime();
    const context = createEditorContext({ runtime: firstRuntime.runtime });
    const extraDisposer = vi.fn();
    context.addDisposer(extraDisposer);

    expect(context.runtime.value).toBe(firstRuntime.runtime);
    expect(context.port.value).toBe(firstRuntime.port);
    expect(getEditorContextFromGraphModel(firstRuntime.graphModel)).toBe(
      context,
    );

    context.setRuntime(secondRuntime.runtime);

    expect(firstRuntime.runtime.dispose).toHaveBeenCalledOnce();
    expect(getEditorContextFromGraphModel(firstRuntime.graphModel)).toBeNull();
    expect(getEditorContextFromGraphModel(secondRuntime.graphModel)).toBe(
      context,
    );
    expect(context.port.value).toBe(secondRuntime.port);

    context.dialogs.open("generic", null, null, vi.fn());
    context.dispose();
    context.dispose();

    expect(context.disposed).toBe(true);
    expect(context.runtime.value).toBeNull();
    expect(context.port.value).toBeNull();
    expect(context.dialogs.state.generic).toMatchObject({
      show: false,
      callback: null,
    });
    expect(getEditorContextFromGraphModel(secondRuntime.graphModel)).toBeNull();
    expect(secondRuntime.runtime.dispose).toHaveBeenCalledOnce();
    expect(extraDisposer).toHaveBeenCalledOnce();
  });

  it("detaches manually attached graph bridges on context disposal", () => {
    const context = createEditorContext();
    const graphModel = {};

    const detach = attachEditorContextToGraphModel(graphModel, context);
    expect(getEditorContextFromGraphModel(graphModel)).toBe(context);

    detach();
    expect(getEditorContextFromGraphModel(graphModel)).toBeNull();

    attachEditorContextToGraphModel(graphModel, context);
    context.dispose();
    expect(getEditorContextFromGraphModel(graphModel)).toBeNull();
  });

  it("finishes runtime cleanup when another disposer throws", () => {
    const runtimeFixture = createRuntime();
    const context = createEditorContext({ runtime: runtimeFixture.runtime });
    const successfulDisposer = vi.fn();
    context.addDisposer(() => {
      throw new Error("cleanup failed");
    });
    context.addDisposer(successfulDisposer);

    expect(() => context.dispose()).toThrow("cleanup failed");

    expect(successfulDisposer).toHaveBeenCalledOnce();
    expect(runtimeFixture.runtime.dispose).toHaveBeenCalledOnce();
    expect(context.disposed).toBe(true);
    expect(() => context.dispose()).not.toThrow();
  });
});

describe("EditorContext Vue injection", () => {
  it("resolves a context through normal provide/inject", () => {
    const context = createEditorContext();
    let resolved: unknown;
    const Consumer = defineComponent({
      setup() {
        resolved = useEditorContext();
        return () => null;
      },
    });
    const Root = defineComponent({
      setup() {
        provideEditorContext(context);
        return () => h(Consumer);
      },
    });

    mountApp(Root);

    expect(resolved).toBe(context);
  });

  it("uses the registry getGraph bridge from an independent createApp", () => {
    const context = createEditorContext();
    const graphModel = {};
    attachEditorContextToGraphModel(graphModel, context);
    let resolved: unknown;

    const NodeComponent = defineComponent({
      setup() {
        resolved = useEditorContext();
        return () => null;
      },
    });
    const RegistryRoot = defineComponent({
      provide() {
        return { getGraph: () => graphModel };
      },
      render() {
        return h(NodeComponent);
      },
    });

    mountApp(RegistryRoot);

    expect(resolved).toBe(context);
  });

  it("offers nullable and strict lookup variants when no context exists", () => {
    let optionalResult: unknown;
    let strictError: unknown;
    const Consumer = defineComponent({
      setup() {
        optionalResult = tryUseEditorContext();
        try {
          useEditorContext();
        } catch (error) {
          strictError = error;
        }
        return () => null;
      },
    });

    mountApp(Consumer);

    expect(optionalResult).toBeNull();
    expect(strictError).toBeInstanceOf(Error);
  });
});
