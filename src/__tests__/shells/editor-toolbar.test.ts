import { defineComponent, h, nextTick, ref } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EditorToolbar from "@/shells/common/EditorToolbar.vue";

const facadeSpies = vi.hoisted(() => ({
  openImportDialog: vi.fn(),
  handleExport: vi.fn(),
  handlePreviewData: vi.fn(),
  prepareCapture: vi.fn(),
  openWatermark: vi.fn(),
  openAssetManager: vi.fn(),
  openNodeTheme: vi.fn(),
  openRuleManager: vi.fn(),
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
  props: {
    isEmbed: Boolean,
    selectionEnabled: Boolean,
    snapGridEnabled: Boolean,
    snaplineEnabled: Boolean,
    locale: String,
  },
  emits: [
    "command",
    "update:selectionEnabled",
    "update:snapGridEnabled",
    "update:snaplineEnabled",
    "update:locale",
  ],
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

const createWrapper = (isEmbed = false) =>
  mount(EditorToolbar, {
    props: { isEmbed },
    global: {
      stubs: {
        EditorCommandBar: CommandBarStub,
        WorkspaceDialogHost: WorkspaceHostStub,
        CaptureDialogHost: CaptureHostStub,
        AssetsDialogHost: AssetsHostStub,
        GroupRuleDialogHost: GroupRulesHostStub,
      },
    },
  });

describe("EditorToolbar composition", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.values(facadeSpies).forEach((spy) => spy.mockReset());
  });

  it("routes feature commands and delegates app-only help commands", async () => {
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
    expect(wrapper.emitted("show-update-log")).toEqual([[]]);
    expect(wrapper.emitted("show-feedback")).toEqual([[]]);
    expect(facadeSpies.resetWorkspace).toHaveBeenCalledTimes(1);
    expect(facadeSpies.clearCanvas).toHaveBeenCalledTimes(1);

    wrapper.unmount();
    expect(facadeSpies.disposeCanvasRefresh).toHaveBeenCalledTimes(1);
  });

  it("updates instance settings and persists locale only outside embed mode", async () => {
    const standalone = createWrapper();
    const standaloneBar = standalone.getComponent(CommandBarStub);

    standaloneBar.vm.$emit("update:selectionEnabled", false);
    standaloneBar.vm.$emit("update:snapGridEnabled", false);
    standaloneBar.vm.$emit("update:snaplineEnabled", false);
    standaloneBar.vm.$emit("update:locale", "ja");
    await nextTick();

    expect(standaloneBar.props()).toMatchObject({
      selectionEnabled: false,
      snapGridEnabled: false,
      snaplineEnabled: false,
    });
    expect(facadeSpies.setLocale).toHaveBeenCalledWith("ja");
    expect(localStorage.getItem("yys-editor.locale")).toBe("ja");
    standalone.unmount();

    localStorage.clear();
    const embed = createWrapper(true);
    embed.getComponent(CommandBarStub).vm.$emit("update:locale", "en");
    await nextTick();

    expect(facadeSpies.setLocale).toHaveBeenLastCalledWith("en");
    expect(localStorage.getItem("yys-editor.locale")).toBeNull();
  });
});
