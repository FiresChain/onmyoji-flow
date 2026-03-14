import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import PropertyPanel from "@/components/flow/PropertyPanel.vue";

vi.mock("@/ts/useLogicFlow", () => ({
  useLogicFlowScope: vi.fn(() => Symbol("property-panel-scope")),
  getLogicFlowInstance: vi.fn(() => ({
    setProperties: vi.fn(),
  })),
}));

vi.mock("@/ts/useSafeI18n", () => ({
  useSafeI18n: vi.fn(() => ({
    t: (key: string) => key,
  })),
}));

function mountPanel() {
  return mount(PropertyPanel, {
    props: {
      node: null,
      height: "100%",
    },
    global: {
      stubs: {
        ElTabs: {
          template: "<div><slot /></div>",
        },
        ElTabPane: {
          template: "<div><slot /></div>",
        },
        ElSelect: {
          template: "<div><slot /></div>",
        },
        ElOption: {
          template: "<div />",
        },
      },
    },
  });
}

describe("PropertyPanel resize", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  });

  it("expands width when dragging the left resize handle outward", async () => {
    const wrapper = mountPanel();

    await wrapper.find(".resize-handle").trigger("mousedown", {
      button: 0,
      clientX: 300,
    });
    window.dispatchEvent(
      new MouseEvent("mousemove", {
        bubbles: true,
        clientX: 240,
      }),
    );
    await nextTick();

    expect(wrapper.find(".property-panel").attributes("style")).toContain(
      "width: 340px;",
    );

    window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  });

  it("clamps width within the configured bounds", async () => {
    const wrapper = mountPanel();

    await wrapper.find(".resize-handle").trigger("mousedown", {
      button: 0,
      clientX: 300,
    });
    window.dispatchEvent(
      new MouseEvent("mousemove", {
        bubbles: true,
        clientX: 600,
      }),
    );
    await nextTick();

    expect(wrapper.find(".property-panel").attributes("style")).toContain(
      "width: 240px;",
    );

    window.dispatchEvent(
      new MouseEvent("mousemove", {
        bubbles: true,
        clientX: -200,
      }),
    );
    await nextTick();

    expect(wrapper.find(".property-panel").attributes("style")).toContain(
      "width: 460px;",
    );

    window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  });
});
