import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GraphData } from "@/core/document/types";
import YysEditorEmbed from "@/YysEditorEmbed.vue";
import facadeSource from "@/YysEditorEmbed.vue?raw";

const facadeSpies = {
  getGraphData: vi.fn(),
  setGraphData: vi.fn(),
  resizeCanvas: vi.fn(),
  fitView: vi.fn(),
  zoom: vi.fn(),
  resetZoom: vi.fn(),
  resetTranslate: vi.fn(),
  translateCenter: vi.fn(),
  getTransform: vi.fn(),
};

const ShellStub = defineComponent({
  name: "EmbedEditorShell",
  inheritAttrs: false,
  props: {
    data: Object,
    mode: String,
    capability: String,
    width: [String, Number],
    height: [String, Number],
    showToolbar: Boolean,
    showPropertyPanel: Boolean,
    showComponentPanel: Boolean,
    config: Object,
    plugins: Array,
    nodeRegistrations: Array,
    assetBaseUrl: String,
  },
  emits: ["update:data", "save", "cancel", "error"],
  setup(props, { emit, expose }) {
    expose(facadeSpies);
    return () =>
      h("div", {
        "data-embed-shell": "true",
        "data-mode": props.mode,
        onClick: () => {
          const graph: GraphData = { nodes: [], edges: [] };
          emit("update:data", graph);
          emit("save", graph);
          emit("cancel");
          emit("error", new Error("shell-error"));
        },
      });
  },
});

describe("YysEditorEmbed facade", () => {
  beforeEach(() => {
    Object.values(facadeSpies).forEach((spy) => spy.mockReset());
    facadeSpies.getGraphData.mockReturnValue({ nodes: [], edges: [] });
    facadeSpies.fitView.mockReturnValue(true);
    facadeSpies.zoom.mockReturnValue(true);
    facadeSpies.resetZoom.mockReturnValue(true);
    facadeSpies.resetTranslate.mockReturnValue(true);
    facadeSpies.translateCenter.mockReturnValue(true);
    facadeSpies.getTransform.mockReturnValue({ SCALE_X: 1 });
  });

  it("forwards every public prop default and event through the shell", async () => {
    const wrapper = mount(YysEditorEmbed, {
      global: { stubs: { EmbedEditorShell: ShellStub } },
    });
    const shell = wrapper.getComponent(ShellStub);

    expect(shell.props()).toMatchObject({
      mode: "edit",
      width: "100%",
      height: "600px",
      showToolbar: true,
      showPropertyPanel: true,
      showComponentPanel: true,
      config: {
        grid: true,
        snapline: true,
        keyboard: true,
        theme: "light",
        locale: "zh",
      },
    });

    await wrapper.get("[data-embed-shell]").trigger("click");
    const graph = { nodes: [], edges: [] };
    expect(wrapper.emitted("update:data")).toEqual([[graph]]);
    expect(wrapper.emitted("save")).toEqual([[graph]]);
    expect(wrapper.emitted("cancel")).toEqual([[]]);
    expect(wrapper.emitted("error")?.[0]?.[0]).toEqual(
      new Error("shell-error"),
    );
  });

  it("delegates the complete exposed API without owning runtime behavior", () => {
    const wrapper = mount(YysEditorEmbed, {
      global: { stubs: { EmbedEditorShell: ShellStub } },
    });
    const facade = wrapper.vm as unknown as {
      getGraphData(): GraphData | null;
      setGraphData(data: GraphData): void;
      resizeCanvas(): void;
      fitView(vertical?: number, horizontal?: number): boolean;
      zoom(size?: number | boolean, point?: [number, number]): boolean;
      resetZoom(): boolean;
      resetTranslate(): boolean;
      translateCenter(): boolean;
      getTransform(): Record<string, number> | null;
    };
    const graph: GraphData = { nodes: [], edges: [] };

    expect(facade.getGraphData()).toEqual(graph);
    facade.setGraphData(graph);
    facade.resizeCanvas();
    expect(facade.fitView(10, 20)).toBe(true);
    expect(facade.zoom(1.5, [30, 40])).toBe(true);
    expect(facade.resetZoom()).toBe(true);
    expect(facade.resetTranslate()).toBe(true);
    expect(facade.translateCenter()).toBe(true);
    expect(facade.getTransform()).toEqual({ SCALE_X: 1 });

    expect(facadeSpies.setGraphData).toHaveBeenCalledWith(graph);
    expect(facadeSpies.resizeCanvas).toHaveBeenCalledOnce();
    expect(facadeSpies.fitView).toHaveBeenCalledWith(10, 20);
    expect(facadeSpies.zoom).toHaveBeenCalledWith(1.5, [30, 40]);
  });

  it("contains only public contract forwarding", () => {
    expect(facadeSource).toContain("EmbedEditorShell");
    expect(facadeSource).not.toMatch(
      /from ["']@logicflow|createEditorContext|createWorkspaceSession|ResizeObserver|localStorage|editorContext|port\.value|runtime\.value|\.render\(|\.capture\(/,
    );
  });
});
