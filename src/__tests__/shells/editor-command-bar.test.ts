import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import EditorCommandBar from "@/shells/common/EditorCommandBar.vue";
import commandBarSource from "@/shells/common/EditorCommandBar.vue?raw";

const commands = [
  "import",
  "export",
  "preview-data",
  "prepare-capture",
  "load-example",
  "manage-rules",
  "configure-theme",
  "configure-watermark",
  "manage-assets",
  "show-update-log",
  "show-feedback",
  "reset-workspace",
  "clear-canvas",
] as const;

const ButtonStub = defineComponent({
  name: "ElButton",
  inheritAttrs: false,
  emits: ["click"],
  setup(_, { attrs, emit, slots }) {
    return () =>
      h(
        "button",
        {
          "data-command": attrs["data-command"],
          onClick: () => emit("click"),
        },
        slots.default?.(),
      );
  },
});

const DropdownStub = defineComponent({
  name: "ElDropdown",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h("div", { "data-menu": attrs["data-menu"] }, [
        slots.default?.(),
        slots.dropdown?.(),
      ]);
  },
});

const DropdownMenuStub = defineComponent({
  name: "ElDropdownMenu",
  setup(_, { slots }) {
    return () => h("div", slots.default?.());
  },
});

const SwitchStub = defineComponent({
  name: "ElSwitch",
  inheritAttrs: false,
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["update:modelValue"],
  setup(props, { attrs, emit }) {
    return () =>
      h("input", {
        "data-control": attrs["data-control"],
        type: "checkbox",
        checked: props.modelValue,
        onChange: (event: Event) => {
          emit("update:modelValue", (event.target as HTMLInputElement).checked);
        },
      });
  },
});

const SelectStub = defineComponent({
  name: "ElSelect",
  inheritAttrs: false,
  props: {
    modelValue: {
      type: String,
      required: true,
    },
  },
  emits: ["update:modelValue"],
  setup(props, { attrs, emit, slots }) {
    return () =>
      h(
        "select",
        {
          "data-control": attrs["data-control"],
          value: props.modelValue,
          onChange: (event: Event) => {
            emit(
              "update:modelValue",
              (event.target as HTMLSelectElement).value,
            );
          },
        },
        slots.default?.(),
      );
  },
});

const OptionStub = defineComponent({
  name: "ElOption",
  props: {
    label: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => h("option", { value: props.value }, props.label);
  },
});

const translate = (key: string) => `translated:${key}`;

const createWrapper = (props: Record<string, unknown> = {}) =>
  mount(EditorCommandBar, {
    props: {
      translate,
      ...props,
    },
    global: {
      stubs: {
        ElButton: ButtonStub,
        ElDropdown: DropdownStub,
        ElDropdownItem: ButtonStub,
        ElDropdownMenu: DropdownMenuStub,
        ElSwitch: SwitchStub,
        ElSelect: SelectStub,
        ElOption: OptionStub,
      },
    },
  });

describe("EditorCommandBar", () => {
  it("emits every visible standalone command without hidden legacy actions", async () => {
    const wrapper = createWrapper();

    for (const command of commands) {
      await wrapper.get(`[data-command="${command}"]`).trigger("click");
    }

    expect(wrapper.emitted("command")).toEqual(
      commands.map((command) => [command]),
    );
    expect(wrapper.find(".toolbar-actions-legacy").exists()).toBe(false);
  });

  it("emits controlled setting and locale updates without mutating props", async () => {
    const wrapper = createWrapper({
      selectionEnabled: true,
      snapGridEnabled: true,
      snaplineEnabled: true,
      locale: "zh",
    });

    await wrapper.get('[data-control="selection"]').setValue(false);
    await wrapper.get('[data-control="snap-grid"]').setValue(false);
    await wrapper.get('[data-control="snapline"]').setValue(false);
    await wrapper.get('[data-control="locale"]').setValue("ja");

    expect(wrapper.emitted("update:selectionEnabled")).toEqual([[false]]);
    expect(wrapper.emitted("update:snapGridEnabled")).toEqual([[false]]);
    expect(wrapper.emitted("update:snaplineEnabled")).toEqual([[false]]);
    expect(wrapper.emitted("update:locale")).toEqual([["ja"]]);
    expect(wrapper.props()).toMatchObject({
      selectionEnabled: true,
      snapGridEnabled: true,
      snaplineEnabled: true,
      locale: "zh",
    });

    await wrapper.setProps({
      selectionEnabled: false,
      snapGridEnabled: false,
      snaplineEnabled: false,
      locale: "ja",
    });

    expect(
      (wrapper.get('[data-control="selection"]').element as HTMLInputElement)
        .checked,
    ).toBe(false);
    expect(
      (wrapper.get('[data-control="snap-grid"]').element as HTMLInputElement)
        .checked,
    ).toBe(false);
    expect(
      (wrapper.get('[data-control="snapline"]').element as HTMLInputElement)
        .checked,
    ).toBe(false);
    expect(
      (wrapper.get('[data-control="locale"]').element as HTMLSelectElement)
        .value,
    ).toBe("ja");
  });

  it("keeps load-example and help commands out of embed mode", () => {
    const wrapper = createWrapper({ isEmbed: true });

    expect(wrapper.classes()).toContain("toolbar--embed");
    expect(wrapper.find('[data-menu="help"]').exists()).toBe(false);
    expect(wrapper.find('[data-command="load-example"]').exists()).toBe(false);
    expect(wrapper.find('[data-command="show-update-log"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-command="show-feedback"]').exists()).toBe(false);
    expect(wrapper.findAll("[data-command]")).toHaveLength(commands.length - 3);
  });

  it("does not import runtime, persistence, or feature services", () => {
    expect(commandBarSource).not.toMatch(
      /@\/features|useWorkspace|getLogicFlow|LogicFlow|localStorage|sessionStorage/,
    );
    expect(commandBarSource).not.toContain("toolbar-actions-legacy");
  });
});
