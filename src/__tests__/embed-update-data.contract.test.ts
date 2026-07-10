import { describe, expect, it, vi } from "vitest";
import { defineComponent, h, onBeforeUnmount } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, getActivePinia, setActivePinia } from "pinia";
import YysEditorEmbed, { type GraphData } from "@/YysEditorEmbed.vue";
import flowEditorSource from "@/editor/components/FlowEditor.vue?raw";
import bindEditorEventsSource from "@/editor/runtime/bindEditorEvents.ts?raw";
import keyboardShortcutsSource from "@/editor/runtime/keyboardShortcuts.ts?raw";
import mountEditorRuntimeSource from "@/editor/runtime/mountEditorRuntime.ts?raw";
import { useLogicFlowScope } from "@/ts/useLogicFlow";
import type { LogicFlowRuntime } from "@/core/logicflow/types";

const normalizeQuoteStyle = (text: string) => text.replace(/['"]/g, '"');

const expectContainsIgnoringQuoteStyle = (source: string, snippet: string) => {
  expect(normalizeQuoteStyle(source)).toContain(normalizeQuoteStyle(snippet));
};

const createFlowEditorStub = (payload: GraphData) =>
  defineComponent({
    name: "FlowEditor",
    props: {
      showPropertyPanel: {
        type: Boolean,
        default: true,
      },
      height: {
        type: String,
        default: "100%",
      },
      enableLabel: {
        type: Boolean,
        default: false,
      },
      configSnapGridEnabled: {
        type: Boolean,
        default: true,
      },
      configSnaplineEnabled: {
        type: Boolean,
        default: true,
      },
      configKeyboardEnabled: {
        type: Boolean,
        default: true,
      },
    },
    emits: ["graph-data-change"],
    setup(props, { emit, expose }) {
      expose({
        resizeCanvas: () => {},
        getGraphData: () => payload,
        setGraphData: () => {},
      });
      return () =>
        h(
          "button",
          {
            class: "flow-editor-stub",
            "data-show-property-panel": String(props.showPropertyPanel),
            "data-config-snap-grid-enabled": String(
              props.configSnapGridEnabled,
            ),
            "data-config-snapline-enabled": String(props.configSnaplineEnabled),
            "data-config-keyboard-enabled": String(props.configKeyboardEnabled),
            onClick: () => emit("graph-data-change", payload),
          },
          "emit-graph-data-change",
        );
    },
  });

const createFlowEditorMultiChangeStub = (payloads: GraphData[]) =>
  defineComponent({
    name: "FlowEditor",
    props: {
      showPropertyPanel: {
        type: Boolean,
        default: true,
      },
      height: {
        type: String,
        default: "100%",
      },
      enableLabel: {
        type: Boolean,
        default: false,
      },
      configSnapGridEnabled: {
        type: Boolean,
        default: true,
      },
      configSnaplineEnabled: {
        type: Boolean,
        default: true,
      },
      configKeyboardEnabled: {
        type: Boolean,
        default: true,
      },
    },
    emits: ["graph-data-change"],
    setup(props, { emit, expose }) {
      expose({
        resizeCanvas: () => {},
        getGraphData: () =>
          payloads[payloads.length - 1] ?? { nodes: [], edges: [] },
        setGraphData: () => {},
      });
      return () =>
        h(
          "div",
          {
            class: "flow-editor-multi-stub",
            "data-show-property-panel": String(props.showPropertyPanel),
            "data-config-snap-grid-enabled": String(
              props.configSnapGridEnabled,
            ),
            "data-config-snapline-enabled": String(props.configSnaplineEnabled),
            "data-config-keyboard-enabled": String(props.configKeyboardEnabled),
          },
          payloads.map((payload, index) =>
            h(
              "button",
              {
                class: `flow-editor-stub-${index}`,
                onClick: () => emit("graph-data-change", payload),
              },
              `emit-graph-data-change-${index}`,
            ),
          ),
        );
    },
  });

describe("YysEditorEmbed update:data contract", () => {
  it("restores the active Pinia when the host app has no Pinia plugin", () => {
    const activePinia = createPinia();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    setActivePinia(activePinia);

    try {
      const wrapper = mount(YysEditorEmbed, {
        props: {
          mode: "edit",
          showToolbar: false,
          showComponentPanel: false,
        },
        global: {
          stubs: {
            FlowEditor: true,
            Toolbar: true,
            NodePalette: true,
            EditorDialogHost: true,
          },
        },
      });

      expect(getActivePinia()).toBe(activePinia);
      wrapper.unmount();
      expect(getActivePinia()).toBe(activePinia);
      expect(
        warnSpy.mock.calls.some(([message]) =>
          String(message).includes('injection "Symbol(pinia)" not found'),
        ),
      ).toBe(false);
    } finally {
      warnSpy.mockRestore();
      setActivePinia(undefined);
    }
  });

  it("lets the FlowEditor runtime destroy its instance exactly once on unmount", () => {
    const destroy = vi.fn();
    const RuntimeOwnerStub = defineComponent({
      name: "FlowEditor",
      setup() {
        const scope = useLogicFlowScope();
        const runtime = {
          instance: { graphModel: {} },
          port: {
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
            dispose: destroy,
          },
          dispose: destroy,
        } as unknown as LogicFlowRuntime;
        scope.setRuntime(runtime);
        onBeforeUnmount(() => {
          scope.clearRuntime(runtime);
        });
        return () => h("div", { class: "runtime-owner-stub" });
      },
    });

    const wrapper = mount(YysEditorEmbed, {
      props: {
        mode: "edit",
        showToolbar: false,
        showComponentPanel: false,
      },
      global: {
        stubs: {
          FlowEditor: RuntimeOwnerStub,
          Toolbar: true,
          NodePalette: true,
          EditorDialogHost: true,
        },
      },
    });

    wrapper.unmount();

    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it("emits update:data in edit mode when FlowEditor reports graph data change", async () => {
    const payload: GraphData = {
      nodes: [
        {
          id: "node-1",
          type: "rect",
          x: 120,
          y: 240,
        },
      ],
      edges: [],
    };

    const wrapper = mount(YysEditorEmbed, {
      props: {
        mode: "edit",
        showToolbar: false,
        showComponentPanel: false,
      },
      global: {
        stubs: {
          FlowEditor: createFlowEditorStub(payload),
          Toolbar: true,
          NodePalette: true,
          EditorDialogHost: true,
        },
      },
    });

    await wrapper.find(".flow-editor-stub").trigger("click");

    expect(wrapper.emitted("update:data")).toEqual([[payload]]);
  });

  it("forwards every graph-data-change emission in edit mode without dropping events", async () => {
    const payloads: GraphData[] = [
      {
        nodes: [{ id: "node-drop-path", type: "rect", x: 100, y: 120 }],
        edges: [],
      },
      {
        nodes: [
          {
            id: "text-update-path",
            type: "text",
            x: 120,
            y: 140,
            text: { value: "changed" },
          },
        ],
        edges: [],
      },
      {
        nodes: [{ id: "edge-adjust-path", type: "rect", x: 150, y: 180 }],
        edges: [
          {
            id: "edge-1",
            type: "polyline",
            sourceNodeId: "edge-adjust-path",
            targetNodeId: "edge-adjust-path",
          },
        ],
      },
    ];

    const wrapper = mount(YysEditorEmbed, {
      props: {
        mode: "edit",
        showToolbar: false,
        showComponentPanel: false,
      },
      global: {
        stubs: {
          FlowEditor: createFlowEditorMultiChangeStub(payloads),
          Toolbar: true,
          NodePalette: true,
          EditorDialogHost: true,
        },
      },
    });

    await wrapper.find(".flow-editor-stub-0").trigger("click");
    await wrapper.find(".flow-editor-stub-1").trigger("click");
    await wrapper.find(".flow-editor-stub-2").trigger("click");

    expect(wrapper.emitted("update:data")).toEqual(
      payloads.map((payload) => [payload]),
    );
  });

  it("keeps FlowEditor runtime wiring for initialization and core mutation event paths", () => {
    const flowEditorRequiredSnippets = [
      "useFlowEditorRuntime",
      "mountFlowEditorRuntime({",
      "configSnapGridEnabled?: boolean;",
      "configSnaplineEnabled?: boolean;",
      "configKeyboardEnabled?: boolean;",
      "() => props.configSnapGridEnabled",
      "() => props.configSnaplineEnabled",
      "() => props.configKeyboardEnabled",
    ];
    flowEditorRequiredSnippets.forEach((snippet) => {
      expect(flowEditorSource).toContain(snippet);
    });

    const mountRequiredSnippets = [
      "const runtime = createLogicFlowRuntime({",
      "defaultNodeRegistrations: getDefaultNodeRegistrations(),",
      "lf.value = runtime.instance;",
      "logicFlowScope.setRuntime(runtime);",
      "logicFlowScope.clearRuntime(runtime);",
    ];
    mountRequiredSnippets.forEach((snippet) => {
      expectContainsIgnoringQuoteStyle(mountEditorRuntimeSource, snippet);
    });

    const eventRequiredSnippets = [
      "eventDisposers.push(() => instance.off(event, handler));",
      "bind(EventType.NODE_ADD",
      "bind('node:dnd-add'",
      "bind(EventType.NODE_PROPERTIES_CHANGE",
      "bind(EventType.NODE_PROPERTIES_DELETE",
      "bind(EventType.NODE_DROP",
      "bind(EventType.TEXT_UPDATE",
      "bind(EventType.LABEL_UPDATE",
      "bind(EventType.EDGE_ADD",
      "bind(EventType.EDGE_DELETE",
      "bind(EventType.EDGE_ADJUST",
      "bind(EventType.EDGE_EXCHANGE_NODE",
      "bind(EventType.HISTORY_CHANGE",
    ];
    eventRequiredSnippets.forEach((snippet) => {
      expectContainsIgnoringQuoteStyle(bindEditorEventsSource, snippet);
    });

    expectContainsIgnoringQuoteStyle(
      keyboardShortcutsSource,
      "disposers.push(() => instance.keyboard.off(keys));",
    );
  });

  it("applies showPropertyPanel and config(grid/snapline/keyboard) in edit mode", async () => {
    const payload: GraphData = {
      nodes: [
        {
          id: "node-legacy",
          type: "rect",
          x: 10,
          y: 20,
        },
      ],
      edges: [],
    };

    const wrapper = mount(YysEditorEmbed, {
      props: {
        mode: "edit",
        showToolbar: false,
        showComponentPanel: false,
        showPropertyPanel: false,
        config: {
          grid: false,
          snapline: false,
          keyboard: false,
        },
      },
      global: {
        stubs: {
          FlowEditor: createFlowEditorStub(payload),
          Toolbar: true,
          NodePalette: true,
          EditorDialogHost: true,
        },
      },
    });

    expect(wrapper.find(".flow-editor-stub").exists()).toBe(true);
    expect(
      wrapper.find(".flow-editor-stub").attributes("data-show-property-panel"),
    ).toBe("false");
    expect(
      wrapper
        .find(".flow-editor-stub")
        .attributes("data-config-snap-grid-enabled"),
    ).toBe("false");
    expect(
      wrapper
        .find(".flow-editor-stub")
        .attributes("data-config-snapline-enabled"),
    ).toBe("false");
    expect(
      wrapper
        .find(".flow-editor-stub")
        .attributes("data-config-keyboard-enabled"),
    ).toBe("false");

    await wrapper.find(".flow-editor-stub").trigger("click");
    expect(wrapper.emitted("update:data")).toEqual([[payload]]);

    await wrapper.setProps({
      showPropertyPanel: true,
      config: {
        grid: true,
        snapline: true,
        keyboard: true,
      },
    });
    expect(
      wrapper.find(".flow-editor-stub").attributes("data-show-property-panel"),
    ).toBe("true");
    expect(
      wrapper
        .find(".flow-editor-stub")
        .attributes("data-config-snap-grid-enabled"),
    ).toBe("true");
    expect(
      wrapper
        .find(".flow-editor-stub")
        .attributes("data-config-snapline-enabled"),
    ).toBe("true");
    expect(
      wrapper
        .find(".flow-editor-stub")
        .attributes("data-config-keyboard-enabled"),
    ).toBe("true");
  });
});
