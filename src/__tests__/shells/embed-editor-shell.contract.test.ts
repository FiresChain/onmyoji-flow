import {
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, getActivePinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GraphData, GraphEdge, GraphNode } from "@/core/document/types";
import type { EditorPort, LogicFlowRuntime } from "@/core/logicflow/types";
import type { EditorContext } from "@/editor/context/EditorContext";
import { useEditorContext } from "@/editor/context/useEditorContext";
import {
  setAssetBaseUrl,
  type EditorConfig as PackageEditorConfig,
  type GraphData as PackageGraphData,
  type FlowNodeRegistration,
  type FlowPlugin,
} from "@/index.js";
import EmbedEditorShell from "@/shells/embed/EmbedEditorShell.vue";
import type {
  EdgeData,
  EditorConfig,
  GraphData as FacadeGraphData,
  NodeData,
} from "@/YysEditorEmbed.vue";

interface RuntimeRecord {
  kind: "edit" | "preview";
  context: EditorContext;
  port: EditorPort;
  runtime: LogicFlowRuntime;
  render: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
}

const runtimeRecords: RuntimeRecord[] = [];

const createOwnedRuntime = (
  kind: RuntimeRecord["kind"],
  context: EditorContext,
): RuntimeRecord => {
  let graphData: GraphData = { nodes: [], edges: [] };
  let disposed = false;
  const render = vi.fn((data: GraphData) => {
    graphData = data;
  });
  const destroy = vi.fn();
  const dispose = vi.fn(() => {
    if (disposed) return;
    disposed = true;
    destroy();
  });
  const port: EditorPort = {
    render,
    capture: vi.fn(() => graphData),
    clear: vi.fn(),
    resize: vi.fn(),
    getViewport: vi.fn(() => ({
      SCALE_X: 1,
      SCALE_Y: 1,
      TRANSLATE_X: 0,
      TRANSLATE_Y: 0,
    })),
    setViewport: vi.fn(),
    zoom: vi.fn(() => true),
    resetZoom: vi.fn(() => true),
    resetTranslate: vi.fn(() => true),
    translateCenter: vi.fn(() => true),
    fitView: vi.fn(),
    dispose,
  };
  const runtime = {
    instance: { graphModel: {} },
    port,
    dispose,
  } as unknown as LogicFlowRuntime;
  const record = { kind, context, port, runtime, render, destroy };
  runtimeRecords.push(record);
  return record;
};

const FlowEditorStub = defineComponent({
  name: "FlowEditor",
  props: {
    height: String,
    enableLabel: Boolean,
    showPropertyPanel: Boolean,
    configSnapGridEnabled: Boolean,
    configSnaplineEnabled: Boolean,
    configKeyboardEnabled: Boolean,
  },
  emits: ["graph-data-change"],
  setup() {
    const context = useEditorContext();
    let record: RuntimeRecord | null = null;
    onMounted(() => {
      record = createOwnedRuntime("edit", context);
      context.setRuntime(record.runtime);
    });
    onBeforeUnmount(() => {
      if (record && !context.clearRuntime(record.runtime)) {
        record.runtime.dispose();
      }
    });
    return () => h("div", { "data-runtime-owner": "edit" });
  },
});

const PreviewCanvasStub = defineComponent({
  name: "PreviewCanvas",
  props: {
    height: String,
    capability: String,
    plugins: Array,
    nodeRegistrations: Array,
  },
  emits: ["ready"],
  setup(props, { emit }) {
    const context = useEditorContext();
    let record: RuntimeRecord | null = null;
    const disposeRuntime = () => {
      if (!record) return;
      if (!context.clearRuntime(record.runtime)) record.runtime.dispose();
      record = null;
    };
    const mountRuntime = () => {
      disposeRuntime();
      record = createOwnedRuntime("preview", context);
      context.setRuntime(record.runtime);
      emit("ready");
    };
    watch(
      [
        () => props.capability,
        () => props.plugins,
        () => props.nodeRegistrations,
      ],
      mountRuntime,
      { deep: true, flush: "post" },
    );
    onMounted(mountRuntime);
    onBeforeUnmount(disposeRuntime);
    return () => h("div", { "data-runtime-owner": "preview" });
  },
});

const editorShellStubs = {
  FlowEditor: FlowEditorStub,
  PreviewCanvas: PreviewCanvasStub,
  EditorToolbar: true,
  NodePalette: true,
  EditorDialogHost: true,
};

const mountShell = (props: Record<string, unknown> = {}) =>
  mount(EmbedEditorShell, {
    props,
    global: {
      stubs: editorShellStubs,
    },
  });

const settleRuntimeWatchers = async () => {
  await nextTick();
  await nextTick();
};

describe("EmbedEditorShell compatibility contract", () => {
  beforeEach(() => {
    runtimeRecords.length = 0;
  });

  afterEach(() => {
    setAssetBaseUrl();
    setActivePinia(undefined);
  });

  it("keeps the facade and package type aliases compatible", () => {
    expectTypeOf<FacadeGraphData>().toEqualTypeOf<GraphData>();
    expectTypeOf<PackageGraphData>().toEqualTypeOf<GraphData>();
    expectTypeOf<NodeData>().toEqualTypeOf<GraphNode>();
    expectTypeOf<EdgeData>().toEqualTypeOf<GraphEdge>();
    expectTypeOf<PackageEditorConfig>().toEqualTypeOf<EditorConfig>();

    expectTypeOf<EditorConfig>().toMatchTypeOf<{
      grid?: boolean;
      snapline?: boolean;
      keyboard?: boolean;
      theme?: "light" | "dark";
      locale?: "zh" | "ja" | "en";
    }>();
  });

  it("makes initial preview data available to the host parent onMounted", () => {
    const graph: GraphData = {
      nodes: [{ id: "mounted-node", type: "rect", x: 20, y: 30 }],
      edges: [],
    };
    let graphSeenByHost: GraphData | null = null;
    const Host = defineComponent({
      setup() {
        const shellRef = ref<{
          getGraphData(): GraphData | null;
        } | null>(null);
        onMounted(() => {
          graphSeenByHost = shellRef.value?.getGraphData() ?? null;
        });
        return () =>
          h(EmbedEditorShell, {
            ref: shellRef,
            mode: "preview",
            data: graph,
          });
      },
    });

    const wrapper = mount(Host, {
      global: { stubs: editorShellStubs },
    });

    expect(graphSeenByHost).toEqual(
      expect.objectContaining({
        nodes: [expect.objectContaining({ id: "mounted-node" })],
      }),
    );
    expect(runtimeRecords).toHaveLength(1);
    expect(runtimeRecords[0].render).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it("renders data once per mode runtime and hides dynamic groups only in preview", async () => {
    const graph: GraphData = {
      metadata: { retained: true },
      nodes: [
        { id: "group", type: "dynamic-group", x: 20, y: 20 },
        { id: "node", type: "imageNode", x: 120, y: 160 },
      ],
      edges: [
        {
          id: "group-edge",
          sourceNodeId: "group",
          targetNodeId: "node",
        },
        {
          id: "node-edge",
          sourceNodeId: "node",
          targetNodeId: "node",
        },
      ],
    };
    const wrapper = mountShell({
      mode: "edit",
      data: graph,
      showToolbar: false,
      showComponentPanel: false,
    });
    await settleRuntimeWatchers();

    const firstEdit = runtimeRecords[0];
    expect(firstEdit.kind).toBe("edit");
    expect(firstEdit.render).toHaveBeenCalledTimes(1);
    expect(
      (firstEdit.render.mock.calls[0][0] as GraphData).nodes.map(
        (node) => node.id,
      ),
    ).toEqual(["group", "node"]);

    await wrapper.setProps({ mode: "preview" });
    await settleRuntimeWatchers();

    const preview = runtimeRecords[1];
    expect(preview.kind).toBe("preview");
    expect(firstEdit.destroy).toHaveBeenCalledTimes(1);
    expect(preview.render).toHaveBeenCalledTimes(1);
    const previewData = preview.render.mock.calls[0][0] as GraphData;
    expect(previewData.metadata).toEqual({ retained: true });
    expect(previewData.nodes.map((node) => node.id)).toEqual(["node"]);
    expect(previewData.edges.map((edge) => edge.id)).toEqual(["node-edge"]);

    await wrapper.setProps({ mode: "edit" });
    await settleRuntimeWatchers();

    const secondEdit = runtimeRecords[2];
    expect(secondEdit.kind).toBe("edit");
    expect(preview.destroy).toHaveBeenCalledTimes(1);
    expect(secondEdit.render).toHaveBeenCalledTimes(1);
    expect(
      (secondEdit.render.mock.calls[0][0] as GraphData).nodes.map(
        (node) => node.id,
      ),
    ).toEqual(["group", "node"]);

    const updated: GraphData = {
      nodes: [{ id: "updated", type: "rect", x: 10, y: 10 }],
      edges: [],
    };
    await wrapper.setProps({ data: updated });
    await settleRuntimeWatchers();
    expect(secondEdit.render).toHaveBeenCalledTimes(2);
    expect(secondEdit.render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        nodes: [expect.objectContaining({ id: "updated" })],
      }),
    );

    wrapper.unmount();
    expect(secondEdit.destroy).toHaveBeenCalledTimes(1);
  });

  it("keeps preview-only extension props out of edit runtime behavior", async () => {
    const plugins: FlowPlugin[] = [{ contractPlugin: true }];
    const nodeRegistrations: FlowNodeRegistration[] = [
      { type: "contract-node", model: { contractModel: true } },
    ];
    const graph: GraphData = {
      nodes: [{ id: "extension-node", type: "rect", x: 40, y: 50 }],
      edges: [],
    };
    const wrapper = mountShell({
      mode: "edit",
      data: graph,
      plugins,
      nodeRegistrations,
      showToolbar: false,
      showComponentPanel: false,
    });
    await settleRuntimeWatchers();

    expect(
      wrapper.findComponent(FlowEditorStub).attributes(),
    ).not.toHaveProperty("plugins");
    expect(
      wrapper.findComponent(FlowEditorStub).attributes(),
    ).not.toHaveProperty("node-registrations");

    await wrapper.setProps({ mode: "preview" });
    await settleRuntimeWatchers();
    const preview = wrapper.getComponent(PreviewCanvasStub);
    expect(preview.props("plugins")).toEqual(plugins);
    expect(preview.props("nodeRegistrations")).toEqual(nodeRegistrations);

    const firstPreviewRuntime = runtimeRecords[1];
    expect(firstPreviewRuntime.render).toHaveBeenCalledTimes(1);
    const replacementPlugins: FlowPlugin[] = [{ replacementPlugin: true }];
    await wrapper.setProps({ plugins: replacementPlugins });
    await settleRuntimeWatchers();

    const replacementRuntime = runtimeRecords[2];
    expect(firstPreviewRuntime.destroy).toHaveBeenCalledTimes(1);
    expect(firstPreviewRuntime.render).toHaveBeenCalledTimes(1);
    expect(replacementRuntime.render).toHaveBeenCalledTimes(1);
    expect(wrapper.getComponent(PreviewCanvasStub).props("plugins")).toEqual(
      replacementPlugins,
    );

    wrapper.unmount();
  });

  it("restores host Pinia and snapshots asset defaults per instance", async () => {
    const hostPinia = createPinia();
    setActivePinia(hostPinia);
    setAssetBaseUrl("/first-host");

    const first = mountShell({
      mode: "edit",
      config: { locale: "ja" },
      showToolbar: false,
      showComponentPanel: false,
    });
    await settleRuntimeWatchers();
    const firstRuntime = runtimeRecords[0];
    expect(getActivePinia()).toBe(hostPinia);
    expect(firstRuntime.context.locale.value).toBe("ja");
    expect(firstRuntime.context.resolveAssetUrl("/assets/node.png")).toBe(
      "/first-host/assets/node.png",
    );

    setAssetBaseUrl("/second-host");
    const second = mountShell({
      mode: "edit",
      config: { locale: "en" },
      showToolbar: false,
      showComponentPanel: false,
    });
    await settleRuntimeWatchers();
    const secondRuntime = runtimeRecords[1];
    expect(getActivePinia()).toBe(hostPinia);
    expect(firstRuntime.context.resolveAssetUrl("/assets/node.png")).toBe(
      "/first-host/assets/node.png",
    );
    expect(secondRuntime.context.resolveAssetUrl("/assets/node.png")).toBe(
      "/second-host/assets/node.png",
    );

    await first.setProps({
      assetBaseUrl: "/first-override",
      config: { locale: "zh" },
    });
    await settleRuntimeWatchers();
    expect(firstRuntime.context.locale.value).toBe("zh");
    expect(secondRuntime.context.locale.value).toBe("en");
    expect(firstRuntime.context.resolveAssetUrl("/assets/node.png")).toBe(
      "/first-override/assets/node.png",
    );

    await first.setProps({ assetBaseUrl: undefined });
    await settleRuntimeWatchers();
    expect(firstRuntime.context.resolveAssetUrl("/assets/node.png")).toBe(
      "/first-host/assets/node.png",
    );
    expect(getActivePinia()).toBe(hostPinia);

    first.unmount();
    expect(firstRuntime.destroy).toHaveBeenCalledTimes(1);
    expect(secondRuntime.destroy).not.toHaveBeenCalled();
    expect(getActivePinia()).toBe(hostPinia);

    second.unmount();
    expect(secondRuntime.destroy).toHaveBeenCalledTimes(1);
    expect(getActivePinia()).toBe(hostPinia);
  });
});
