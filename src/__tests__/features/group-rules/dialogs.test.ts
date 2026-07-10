import { defineComponent, h, nextTick, ref } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ExpressionRuleDefinition,
  GroupRulesConfig,
} from "@/features/group-rules/public";
import GroupRuleDialogHost from "@/features/group-rules/ui/GroupRuleDialogHost.vue";
import RuleEditorDialog from "@/features/group-rules/ui/RuleEditorDialog.vue";
import RuleManagerDialog from "@/features/group-rules/ui/RuleManagerDialog.vue";

const managerSpies = vi.hoisted(() => ({
  openRuleManager: vi.fn(),
  addExpressionRule: vi.fn(),
  addRuleVariable: vi.fn(),
  exportRuleBundle: vi.fn(),
  reloadRuleManagerDraft: vi.fn(),
  applyRuleManagerConfig: vi.fn(),
  restoreDefaultRuleConfig: vi.fn(),
  handleRuleBundleImport: vi.fn(),
  openExpressionRuleEditor: vi.fn(),
  removeExpressionRule: vi.fn(),
  removeRuleVariable: vi.fn(),
  cancelRuleEditor: vi.fn(),
  saveRuleEditor: vi.fn(),
}));

vi.mock("@/features/group-rules/ui/useRuleManager", () => ({
  useRuleManager: vi.fn(
    (options: { state: { showRuleManagerDialog: boolean } }) => ({
      ruleManagerTab: ref("rules"),
      ruleConfigDraft: ref(createRuleConfig()),
      ruleEditorVisible: ref(false),
      ruleEditorDraft: ref<ExpressionRuleDefinition | null>(null),
      ruleScopeDoc: "scope docs",
      ruleContextDoc: "context docs",
      ruleSyntaxDoc: "syntax docs",
      ruleFunctionDoc: "function docs",
      ruleExamplesDoc: "example docs",
      openRuleManager: () => {
        managerSpies.openRuleManager();
        options.state.showRuleManagerDialog = true;
      },
      addExpressionRule: managerSpies.addExpressionRule,
      addRuleVariable: managerSpies.addRuleVariable,
      exportRuleBundle: managerSpies.exportRuleBundle,
      reloadRuleManagerDraft: managerSpies.reloadRuleManagerDraft,
      applyRuleManagerConfig: managerSpies.applyRuleManagerConfig,
      restoreDefaultRuleConfig: managerSpies.restoreDefaultRuleConfig,
      handleRuleBundleImport: managerSpies.handleRuleBundleImport,
      openExpressionRuleEditor: managerSpies.openExpressionRuleEditor,
      removeExpressionRule: managerSpies.removeExpressionRule,
      removeRuleVariable: managerSpies.removeRuleVariable,
      cancelRuleEditor: managerSpies.cancelRuleEditor,
      saveRuleEditor: managerSpies.saveRuleEditor,
    }),
  ),
}));

const createRuleConfig = (): GroupRulesConfig => ({
  version: 4,
  fireShikigamiWhitelist: [],
  shikigamiYuhunBlacklist: [],
  shikigamiConflictPairs: [],
  expressionRules: [],
  ruleVariables: [{ key: "var_1", value: "a,b" }],
});

const translate = (key: string) => `translated:${key}`;

const ButtonStub = defineComponent({
  name: "ElButton",
  inheritAttrs: false,
  emits: ["click"],
  setup(_, { attrs, emit, slots }) {
    return () =>
      h(
        "button",
        {
          "data-action": attrs["data-action"],
          onClick: () => emit("click"),
        },
        slots.default?.(),
      );
  },
});

const DialogStub = defineComponent({
  name: "ElDialog",
  inheritAttrs: false,
  props: {
    modelValue: Boolean,
    title: String,
    width: String,
  },
  emits: ["update:modelValue"],
  setup(props, { attrs, slots }) {
    return () =>
      h(
        "section",
        {
          "data-dialog": attrs["data-dialog"],
          "data-visible": String(props.modelValue),
          "data-title": props.title,
          "data-width": props.width,
        },
        [slots.default?.(), slots.footer?.()],
      );
  },
});

const PassThroughStub = defineComponent({
  inheritAttrs: false,
  setup(_, { slots }) {
    return () => h("div", slots.default?.());
  },
});

const TabPaneStub = defineComponent({
  name: "ElTabPane",
  inheritAttrs: false,
  props: { name: String },
  setup(props, { slots }) {
    return () => h("section", { "data-tab": props.name }, slots.default?.());
  },
});

const FieldStub = defineComponent({
  inheritAttrs: false,
  props: { modelValue: { type: [String, Boolean], default: "" } },
  emits: ["update:modelValue"],
  setup(_, { attrs }) {
    return () => h("div", { "data-field": attrs["data-field"] });
  },
});

const commonStubs = {
  ElButton: ButtonStub,
  ElDialog: DialogStub,
  ElTabs: PassThroughStub,
  ElTabPane: TabPaneStub,
  ElTable: PassThroughStub,
  ElTableColumn: PassThroughStub,
  ElCheckbox: FieldStub,
  ElSelect: FieldStub,
  ElOption: PassThroughStub,
  ElForm: PassThroughStub,
  ElFormItem: PassThroughStub,
  ElInput: FieldStub,
  ElSwitch: FieldStub,
  ElEmpty: PassThroughStub,
};

describe("group-rules dialog UI", () => {
  beforeEach(() => {
    Object.values(managerSpies).forEach((spy) => spy.mockReset());
  });

  it("keeps manager actions, tabs, docs, hidden import, and width", async () => {
    const wrapper = mount(RuleManagerDialog, {
      props: {
        modelValue: true,
        tab: "rules",
        config: createRuleConfig(),
        ruleScopeDoc: "scope docs",
        ruleContextDoc: "context docs",
        ruleSyntaxDoc: "syntax docs",
        ruleFunctionDoc: "function docs",
        ruleExamplesDoc: "example docs",
        translate,
      },
      global: { stubs: commonStubs },
    });

    expect(
      wrapper.get('[data-dialog="rule-manager"]').attributes(),
    ).toMatchObject({
      "data-title": "translated:ruleManager",
      "data-width": "80%",
    });
    expect(
      wrapper.findAll("[data-tab]").map((tab) => tab.attributes("data-tab")),
    ).toEqual(["rules", "variables", "docs"]);
    expect(wrapper.text()).toContain("scope docs");
    expect(wrapper.text()).toContain("example docs");

    const importInput = wrapper.get<HTMLInputElement>(
      'input[data-input="rule-bundle"]',
    );
    expect(importInput.attributes("accept")).toBe(".json,application/json");
    const clickSpy = vi.spyOn(importInput.element, "click");
    await wrapper.get('[data-action="import-bundle"]').trigger("click");
    expect(clickSpy).toHaveBeenCalledTimes(1);

    await wrapper.get('[data-action="add-rule"]').trigger("click");
    await wrapper.get('[data-action="add-variable"]').trigger("click");
    await wrapper.get('[data-action="export-bundle"]').trigger("click");
    await wrapper.get('[data-action="reload"]').trigger("click");
    await wrapper.get('[data-action="apply"]').trigger("click");
    await wrapper.get('[data-action="restore-default"]').trigger("click");

    expect(wrapper.emitted("add-rule")).toHaveLength(1);
    expect(wrapper.emitted("add-variable")).toHaveLength(1);
    expect(wrapper.emitted("export-bundle")).toHaveLength(1);
    expect(wrapper.emitted("reload")).toHaveLength(1);
    expect(wrapper.emitted("apply")).toHaveLength(1);
    expect(wrapper.emitted("restore-default")).toHaveLength(1);
  });

  it("keeps editor fields, footer commands, and width", async () => {
    const draft: ExpressionRuleDefinition = {
      id: "rule_1",
      enabled: true,
      severity: "warning",
      scopeKind: "team",
      code: "RULE_1",
      condition: "true",
      message: "ok",
    };
    const wrapper = mount(RuleEditorDialog, {
      props: {
        modelValue: true,
        draft,
        translate,
      },
      global: { stubs: commonStubs },
    });

    expect(
      wrapper.get('[data-dialog="rule-editor"]').attributes(),
    ).toMatchObject({
      "data-title": "translated:ruleEditor.title",
      "data-width": "56%",
    });
    expect(
      wrapper
        .findAll("[data-field]")
        .map((field) => field.attributes("data-field")),
    ).toEqual([
      "enabled",
      "id",
      "severity",
      "scope",
      "code",
      "condition",
      "message",
    ]);

    await wrapper.get('[data-action="cancel"]').trigger("click");
    await wrapper.get('[data-action="save"]').trigger("click");
    expect(wrapper.emitted("cancel")).toHaveLength(1);
    expect(wrapper.emitted("save")).toHaveLength(1);
  });

  it("opens through the host expose without leaking manager state", async () => {
    const ManagerHostStub = defineComponent({
      name: "RuleManagerDialog",
      props: { modelValue: Boolean },
      setup(props) {
        return () =>
          h("div", {
            "data-host-manager-visible": String(props.modelValue),
          });
      },
    });
    const EditorHostStub = defineComponent({
      name: "RuleEditorDialog",
      setup() {
        return () => h("div");
      },
    });
    const wrapper = mount(GroupRuleDialogHost, {
      global: {
        stubs: {
          RuleManagerDialog: ManagerHostStub,
          RuleEditorDialog: EditorHostStub,
        },
      },
    });

    const exposed = wrapper.vm as unknown as { openRuleManager(): void };
    expect(
      wrapper
        .get("[data-host-manager-visible]")
        .attributes("data-host-manager-visible"),
    ).toBe("false");

    exposed.openRuleManager();
    await nextTick();

    expect(managerSpies.openRuleManager).toHaveBeenCalledTimes(1);
    expect(
      wrapper
        .get("[data-host-manager-visible]")
        .attributes("data-host-manager-visible"),
    ).toBe("true");
  });
});
