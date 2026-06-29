import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import DynamicGroupPanel from "@/components/flow/panels/DynamicGroupPanel.vue";

const setProperties = vi.fn();

vi.mock("@/ts/useLogicFlow", () => ({
  getLogicFlowInstance: () => ({ setProperties }),
  useLogicFlowScope: () => Symbol("test-logicflow-scope"),
}));

const createElementStub = (name: string) =>
  defineComponent({
    name,
    props: ["modelValue", "label"],
    emits: ["update:modelValue", "change", "blur"],
    setup(props, { slots }) {
      return () => h("div", props, slots.default?.());
    },
  });

describe("DynamicGroupPanel team code settings", () => {
  it("shows team code controls for team groups and writes normalized config", async () => {
    setProperties.mockClear();
    const wrapper = mount(DynamicGroupPanel, {
      props: {
        node: {
          id: "team-group-1",
          properties: {
            groupMeta: {
              version: 1,
              groupKind: "team",
              groupName: "冲榜队",
              ruleEnabled: true,
              teamCode: {
                enabled: true,
                shortCode: "SHORT",
                longCode: "LONG",
                preferred: "short",
                label: "复制冲榜队",
              },
            },
          },
        },
      },
      global: {
        stubs: {
          "el-select": createElementStub("ElSelect"),
          "el-option": createElementStub("ElOption"),
          "el-switch": createElementStub("ElSwitch"),
          "el-radio-group": createElementStub("ElRadioGroup"),
          "el-radio-button": createElementStub("ElRadioButton"),
          "el-input": createElementStub("ElInput"),
        },
      },
    });

    expect(wrapper.text()).toContain("阵容码复制");
    expect(wrapper.text()).toContain("长码");
    expect(wrapper.text()).toContain("短码");

    await wrapper.findComponent({ name: "ElSwitch" }).vm.$emit("change");

    expect(setProperties).toHaveBeenCalledWith(
      "team-group-1",
      expect.objectContaining({
        groupMeta: expect.objectContaining({
          groupKind: "team",
          groupName: "冲榜队",
          teamCode: {
            enabled: true,
            shortCode: "SHORT",
            longCode: "LONG",
            preferred: "short",
            label: "复制冲榜队",
          },
        }),
      }),
    );
  });

  it("hides and removes team code config for shikigami groups", async () => {
    setProperties.mockClear();
    const wrapper = mount(DynamicGroupPanel, {
      props: {
        node: {
          id: "unit-group-1",
          properties: {
            groupMeta: {
              version: 1,
              groupKind: "shikigami",
              ruleEnabled: true,
              teamCode: {
                enabled: true,
                longCode: "SHOULD_REMOVE",
              },
            },
          },
        },
      },
      global: {
        stubs: {
          "el-select": createElementStub("ElSelect"),
          "el-option": createElementStub("ElOption"),
          "el-switch": createElementStub("ElSwitch"),
          "el-radio-group": createElementStub("ElRadioGroup"),
          "el-radio-button": createElementStub("ElRadioButton"),
          "el-input": createElementStub("ElInput"),
        },
      },
    });

    expect(wrapper.text()).not.toContain("阵容码复制");

    await wrapper.findComponent({ name: "ElSwitch" }).vm.$emit("change");

    const groupMeta = setProperties.mock.calls[0][1].groupMeta;
    expect(groupMeta.groupKind).toBe("shikigami");
    expect(groupMeta.teamCode).toBeUndefined();
  });
});
