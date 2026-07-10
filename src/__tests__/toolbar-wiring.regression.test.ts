import { defineComponent, h, nextTick, reactive } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ImportDialog from "@/features/workspace/ui/ImportDialog.vue";
import WorkspaceDialogHost from "@/features/workspace/ui/WorkspaceDialogHost.vue";
import EditorCommandBar from "@/shells/common/EditorCommandBar.vue";

const documentCommandSpies = vi.hoisted(() => ({
  handleExport: vi.fn(),
  handlePreviewData: vi.fn(),
  copyDataToClipboard: vi.fn(),
  openImportDialog: vi.fn(),
  triggerJsonFileImport: vi.fn(),
  handleTeamCodeImport: vi.fn(),
  handleTeamCodeQrImport: vi.fn(),
  dispose: vi.fn(),
}));

vi.mock("@/features/workspace/useDocumentCommands", () => ({
  useDocumentCommands: vi.fn(
    (options: {
      state: { showImportDialog: boolean };
      importSource: { value: "json" | "teamCode" };
      teamCodeInput: { value: string };
      teamCodeValidationEnabled?: { value: boolean };
    }) => ({
      handleExport: documentCommandSpies.handleExport,
      handlePreviewData: documentCommandSpies.handlePreviewData,
      copyDataToClipboard: documentCommandSpies.copyDataToClipboard,
      openImportDialog: () => {
        documentCommandSpies.openImportDialog();
        options.importSource.value = "json";
        options.teamCodeInput.value = "";
        if (options.teamCodeValidationEnabled) {
          options.teamCodeValidationEnabled.value = false;
        }
        options.state.showImportDialog = true;
      },
      triggerJsonFileImport: documentCommandSpies.triggerJsonFileImport,
      handleTeamCodeImport: documentCommandSpies.handleTeamCodeImport,
      handleTeamCodeQrImport: documentCommandSpies.handleTeamCodeQrImport,
      disposeImportExportCommands: documentCommandSpies.dispose,
    }),
  ),
}));

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
  setup(_, { slots }) {
    return () => h("div", [slots.default?.(), slots.dropdown?.()]);
  },
});

const PassThroughStub = defineComponent({
  setup(_, { slots }) {
    return () => h("div", slots.default?.());
  },
});

const DialogStub = defineComponent({
  name: "ElDialog",
  setup(_, { slots }) {
    return () => h("section", [slots.default?.(), slots.footer?.()]);
  },
});

const commandBarStubs = {
  ElButton: ButtonStub,
  ElDropdown: DropdownStub,
  ElDropdownItem: ButtonStub,
  ElDropdownMenu: PassThroughStub,
  ElSwitch: true,
  ElSelect: true,
  ElOption: true,
};

describe("command surface wiring", () => {
  beforeEach(() => {
    Object.values(documentCommandSpies).forEach((spy) => spy.mockReset());
  });

  it("emits stable command ids from the visible command bar", async () => {
    const wrapper = mount(EditorCommandBar, {
      global: { stubs: commandBarStubs },
    });

    for (const command of [
      "import",
      "export",
      "preview-data",
      "prepare-capture",
      "manage-rules",
      "configure-theme",
      "configure-watermark",
      "manage-assets",
      "reset-workspace",
      "clear-canvas",
    ]) {
      await wrapper.get(`[data-command="${command}"]`).trigger("click");
    }

    expect(wrapper.emitted("command")?.map(([command]) => command)).toEqual([
      "import",
      "export",
      "preview-data",
      "prepare-capture",
      "manage-rules",
      "configure-theme",
      "configure-watermark",
      "manage-assets",
      "reset-workspace",
      "clear-canvas",
    ]);
  });

  it("keeps ImportDialog source branches and qr input wiring functional", async () => {
    const state = reactive({
      open: true,
      source: "json" as "json" | "teamCode",
      teamCode: "",
      validationEnabled: false,
    });
    const chooseJson = vi.fn();
    const importTeamCode = vi.fn();
    const importTeamCodeQr = vi.fn();
    const Harness = defineComponent({
      setup() {
        return () =>
          h(ImportDialog, {
            open: state.open,
            source: state.source,
            teamCode: state.teamCode,
            validationEnabled: state.validationEnabled,
            importingTeamCode: false,
            decodingTeamCodeQr: false,
            "onUpdate:open": (value: boolean) => {
              state.open = value;
            },
            "onUpdate:source": (value: "json" | "teamCode") => {
              state.source = value;
            },
            "onUpdate:teamCode": (value: string) => {
              state.teamCode = value;
            },
            "onUpdate:validationEnabled": (value: boolean) => {
              state.validationEnabled = value;
            },
            onChooseJson: chooseJson,
            onImportTeamCode: importTeamCode,
            onImportTeamCodeQr: importTeamCodeQr,
          });
      },
    });
    const wrapper = mount(Harness, {
      global: {
        stubs: {
          ElDialog: DialogStub,
          ElButton: ButtonStub,
          ElForm: PassThroughStub,
          ElFormItem: PassThroughStub,
          ElRadioGroup: PassThroughStub,
          ElRadioButton: PassThroughStub,
          ElInput: true,
          ElCheckbox: PassThroughStub,
          ElAlert: true,
        },
      },
    });

    let footerButtons = wrapper.findAll(".dialog-footer button");
    expect(footerButtons).toHaveLength(2);
    await footerButtons[1].trigger("click");
    expect(chooseJson).toHaveBeenCalledTimes(1);
    expect(wrapper.find(".team-code-qr-actions").exists()).toBe(false);

    state.source = "teamCode";
    await nextTick();

    footerButtons = wrapper.findAll(".dialog-footer button");
    expect(footerButtons).toHaveLength(2);
    await footerButtons[1].trigger("click");
    expect(importTeamCode).toHaveBeenCalledTimes(1);

    const qrInput = wrapper.get<HTMLInputElement>('input[accept="image/*"]');
    const qrClick = vi.spyOn(qrInput.element, "click");
    await wrapper.get(".team-code-qr-actions button").trigger("click");
    expect(qrClick).toHaveBeenCalledTimes(1);

    await qrInput.trigger("change");
    expect(importTeamCodeQr).toHaveBeenCalledTimes(1);
  });

  it("keeps WorkspaceDialogHost open/reset and dispose wiring instance-local", async () => {
    const ImportHostStub = defineComponent({
      name: "ImportDialog",
      props: {
        open: Boolean,
        source: String,
        teamCode: String,
        validationEnabled: Boolean,
      },
      emits: [
        "update:open",
        "update:source",
        "update:teamCode",
        "update:validationEnabled",
      ],
      setup(props) {
        return () =>
          h("div", {
            "data-import-open": String(props.open),
            "data-import-source": props.source,
            "data-team-code": props.teamCode,
            "data-validation": String(props.validationEnabled),
          });
      },
    });
    const wrapper = mount(WorkspaceDialogHost, {
      props: {
        workspaceSession: {} as never,
        showMessage: vi.fn(),
        refreshLogicFlowCanvas: vi.fn(),
      },
      global: {
        stubs: {
          DataPreviewDialog: true,
          ImportDialog: ImportHostStub,
        },
      },
    });
    const exposed = wrapper.vm as unknown as { openImportDialog(): void };
    const importDialog = wrapper.getComponent(ImportHostStub);

    await importDialog.vm.$emit("update:source", "teamCode");
    await importDialog.vm.$emit("update:teamCode", "#TA#DIRTY");
    await importDialog.vm.$emit("update:validationEnabled", true);

    exposed.openImportDialog();
    await nextTick();

    expect(documentCommandSpies.openImportDialog).toHaveBeenCalledTimes(1);
    expect(importDialog.props()).toMatchObject({
      open: true,
      source: "json",
      teamCode: "",
      validationEnabled: false,
    });

    wrapper.unmount();
    expect(documentCommandSpies.dispose).toHaveBeenCalledTimes(1);
  });
});
