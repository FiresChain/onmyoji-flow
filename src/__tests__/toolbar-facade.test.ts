import { defineComponent, h, ref } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Toolbar from "@/components/Toolbar.vue";

const facadeSpies = vi.hoisted(() => ({
  openImportDialog: vi.fn(),
  handleExport: vi.fn(),
  handlePreviewData: vi.fn(),
  prepareCapture: vi.fn(),
  openWatermark: vi.fn(),
  openAssetManager: vi.fn(),
  openNodeTheme: vi.fn(),
  openRuleManager: vi.fn(),
  showUpdateLog: vi.fn(),
  showFeedbackForm: vi.fn(),
  loadExample: vi.fn(),
  resetWorkspace: vi.fn(),
  clearCanvas: vi.fn(),
  disposeCanvasRefresh: vi.fn(),
  setLocale: vi.fn(),
  updateTab: vi.fn(),
}));

vi.mock("@/editor/context/useEditorContext", () => ({
  useEditorContext: () => ({
    settings: {
      selectionEnabled: ref(true),
      snapGridEnabled: ref(true),
      snaplineEnabled: ref(true),
      keyboardEnabled: ref(true),
    },
    runtime: ref(null),
    resolveAssetUrl: (value: string) => value,
  }),
}));

vi.mock("@/editor/context/useEditorI18n", () => ({
  useEditorI18n: () => ({
    t: (key: string) => `translated:${key}`,
    getLocale: () => "zh",
    setLocale: facadeSpies.setLocale,
  }),
}));

vi.mock("@/features/workspace/public", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/workspace/public")>();
  return {
    ...actual,
    useWorkspaceSession: () => ({
      store: { activeFileId: "file-1" },
      updateTab: facadeSpies.updateTab,
    }),
    useWorkspaceCanvasRefresh: () => ({
      refreshLogicFlowCanvas: vi.fn(),
      disposeCanvasRefresh: facadeSpies.disposeCanvasRefresh,
    }),
    useWorkspaceCommands: () => ({
      loadExample: facadeSpies.loadExample,
      handleResetWorkspace: facadeSpies.resetWorkspace,
      handleClearCanvas: facadeSpies.clearCanvas,
    }),
  };
});

vi.mock("@/editor/commands/assetTheme", () => ({
  applyAssetThemeToCurrentFile: vi.fn(),
}));

vi.mock("@/editor/commands/captureSnapshot", () => ({
  captureEditorSnapshot: vi.fn(),
}));

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

const CommandBarStub = defineComponent({
  name: "EditorCommandBar",
  emits: ["command"],
  setup(_, { emit }) {
    return () =>
      h(
        "div",
        { "data-command-bar": "true" },
        commands.map((command) =>
          h(
            "button",
            {
              "data-facade-command": command,
              onClick: () => emit("command", command),
            },
            command,
          ),
        ),
      );
  },
});

const WorkspaceHostStub = defineComponent({
  name: "WorkspaceDialogHost",
  setup(_, { expose }) {
    expose({
      openImportDialog: facadeSpies.openImportDialog,
      handleExport: facadeSpies.handleExport,
      handlePreviewData: facadeSpies.handlePreviewData,
    });
    return () => h("div", { "data-host": "workspace" });
  },
});

const CaptureHostStub = defineComponent({
  name: "CaptureDialogHost",
  setup(_, { expose }) {
    expose({
      prepareCapture: facadeSpies.prepareCapture,
      openWatermark: facadeSpies.openWatermark,
    });
    return () => h("div", { "data-host": "capture" });
  },
});

const AssetsHostStub = defineComponent({
  name: "AssetsDialogHost",
  setup(_, { expose }) {
    expose({
      openAssetManager: facadeSpies.openAssetManager,
      openNodeTheme: facadeSpies.openNodeTheme,
    });
    return () => h("div", { "data-host": "assets" });
  },
});

const GroupRulesHostStub = defineComponent({
  name: "GroupRuleDialogHost",
  setup(_, { expose }) {
    expose({ openRuleManager: facadeSpies.openRuleManager });
    return () => h("div", { "data-host": "group-rules" });
  },
});

const AboutHostStub = defineComponent({
  name: "AboutDialogs",
  setup(_, { expose }) {
    expose({
      showUpdateLog: facadeSpies.showUpdateLog,
      showFeedbackForm: facadeSpies.showFeedbackForm,
    });
    return () => h("div", { "data-host": "about" });
  },
});

const createWrapper = (isEmbed = false) =>
  mount(Toolbar, {
    props: { isEmbed },
    global: {
      stubs: {
        EditorCommandBar: CommandBarStub,
        WorkspaceDialogHost: WorkspaceHostStub,
        CaptureDialogHost: CaptureHostStub,
        AssetsDialogHost: AssetsHostStub,
        GroupRuleDialogHost: GroupRulesHostStub,
        AboutDialogs: AboutHostStub,
      },
    },
  });

describe("Toolbar composition facade", () => {
  beforeEach(() => {
    Object.values(facadeSpies).forEach((spy) => spy.mockReset());
  });

  it("routes command ids to the owning feature host or workspace command", async () => {
    const wrapper = createWrapper();

    for (const command of commands) {
      await wrapper.get(`[data-facade-command="${command}"]`).trigger("click");
    }

    expect(facadeSpies.openImportDialog).toHaveBeenCalledTimes(1);
    expect(facadeSpies.handleExport).toHaveBeenCalledTimes(1);
    expect(facadeSpies.handlePreviewData).toHaveBeenCalledTimes(1);
    expect(facadeSpies.prepareCapture).toHaveBeenCalledTimes(1);
    expect(facadeSpies.loadExample).toHaveBeenCalledTimes(1);
    expect(facadeSpies.openRuleManager).toHaveBeenCalledTimes(1);
    expect(facadeSpies.openNodeTheme).toHaveBeenCalledTimes(1);
    expect(facadeSpies.openWatermark).toHaveBeenCalledTimes(1);
    expect(facadeSpies.openAssetManager).toHaveBeenCalledTimes(1);
    expect(facadeSpies.showUpdateLog).toHaveBeenCalledTimes(1);
    expect(facadeSpies.showFeedbackForm).toHaveBeenCalledTimes(1);
    expect(facadeSpies.resetWorkspace).toHaveBeenCalledTimes(1);
    expect(facadeSpies.clearCanvas).toHaveBeenCalledTimes(1);

    wrapper.unmount();
    expect(facadeSpies.disposeCanvasRefresh).toHaveBeenCalledTimes(1);
  });

  it("does not mount standalone about dialogs in embed mode", () => {
    const wrapper = createWrapper(true);

    expect(wrapper.find('[data-host="about"]').exists()).toBe(false);
    expect(wrapper.find('[data-host="workspace"]').exists()).toBe(true);
    expect(wrapper.find('[data-host="capture"]').exists()).toBe(true);
    expect(wrapper.find('[data-host="assets"]').exists()).toBe(true);
    expect(wrapper.find('[data-host="group-rules"]').exists()).toBe(true);
  });
});
