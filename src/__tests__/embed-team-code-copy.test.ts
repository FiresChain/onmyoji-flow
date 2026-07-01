import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import YysEditorEmbed, { type GraphData } from "@/YysEditorEmbed.vue";

const render = vi.fn();
const on = vi.fn();
const destroy = vi.fn();
const resize = vi.fn();
const getTransform = vi.fn(() => ({
  SCALE_X: 1,
  SCALE_Y: 1,
  TRANSLATE_X: 0,
  TRANSLATE_Y: 0,
}));
const getGraphRawData = vi.fn(() => ({ nodes: [], edges: [] }));

vi.mock("@logicflow/core", async () => {
  const actual =
    await vi.importActual<typeof import("@logicflow/core")>("@logicflow/core");
  return {
    ...actual,
    default: vi.fn().mockImplementation(function LogicFlowMock() {
      return {
        render,
        on,
        destroy,
        resize,
        getTransform,
        getGraphRawData,
      };
    }),
  };
});

vi.mock("@/flowRuntime", async () => {
  const actual =
    await vi.importActual<typeof import("@/flowRuntime")>("@/flowRuntime");
  return {
    ...actual,
    registerFlowNodes: vi.fn(),
    resolveFlowPlugins: vi.fn(() => []),
  };
});

const graphData: GraphData = {
  nodes: [
    {
      id: "team-group-1",
      type: "dynamic-group",
      x: 300,
      y: 220,
      properties: {
        width: 420,
        height: 250,
        groupMeta: {
          version: 1,
          groupKind: "team",
          groupName: "冲榜队",
          teamCode: {
            enabled: true,
            shortCode: "SHORT-CODE",
            longCode: "LONG-CODE",
            preferred: "long",
            label: "复制冲榜队",
          },
        },
      },
    },
    {
      id: "unit-group-1",
      type: "dynamic-group",
      x: 100,
      y: 100,
      properties: {
        groupMeta: {
          version: 1,
          groupKind: "shikigami",
          teamCode: {
            enabled: true,
            longCode: "IGNORED",
          },
        },
      },
    },
  ],
  edges: [],
};

describe("YysEditorEmbed team code copy overlay", () => {
  beforeEach(() => {
    render.mockClear();
    on.mockClear();
    destroy.mockClear();
    resize.mockClear();
    getTransform.mockClear();
    getGraphRawData.mockClear();
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
  });

  it("renders preview copy button and copies preferred team code", async () => {
    const wrapper = mount(YysEditorEmbed, {
      props: {
        mode: "preview",
        data: graphData,
        config: {
          teamCodeCopy: {
            enabled: true,
            visibility: "always",
          },
        },
      },
      attachTo: document.body,
      global: {
        stubs: {
          Toolbar: true,
          ComponentsPanel: true,
          FlowEditor: true,
          DialogManager: true,
        },
      },
    });

    await wrapper.vm.$nextTick();
    const button = wrapper.find(".team-code-copy-button");

    expect(button.exists()).toBe(true);
    expect(button.text()).toBe("复制冲榜队");

    await button.trigger("click");
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("LONG-CODE");

    wrapper.unmount();
  });

  it("does not render copy overlay when disabled", async () => {
    const wrapper = mount(YysEditorEmbed, {
      props: {
        mode: "preview",
        data: graphData,
      },
      global: {
        stubs: {
          Toolbar: true,
          ComponentsPanel: true,
          FlowEditor: true,
          DialogManager: true,
        },
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.find(".team-code-copy-button").exists()).toBe(false);

    wrapper.unmount();
  });

  it("exposes preview resizeCanvas for host fitView scheduling", async () => {
    const wrapper = mount(YysEditorEmbed, {
      props: {
        mode: "preview",
        data: graphData,
      },
      attachTo: document.body,
      global: {
        stubs: {
          Toolbar: true,
          ComponentsPanel: true,
          FlowEditor: true,
          DialogManager: true,
        },
      },
    });

    const container = wrapper.find(".preview-container .container").element;
    Object.defineProperty(container, "offsetWidth", {
      configurable: true,
      value: 640,
    });
    Object.defineProperty(container, "offsetHeight", {
      configurable: true,
      value: 360,
    });

    expect((wrapper.vm as any).resizeCanvas()).toBe(true);
    expect(resize).toHaveBeenCalledWith(640, 360);

    wrapper.unmount();
  });
});
