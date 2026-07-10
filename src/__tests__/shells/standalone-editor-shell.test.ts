import { defineComponent, h, nextTick, type Ref } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import appSource from "@/App.vue?raw";
import StandaloneEditorShell from "@/shells/standalone/StandaloneEditorShell.vue";

const shellState = vi.hoisted(() => ({
  initializeResult: { restored: true } as {
    restored: boolean;
    error?: Error;
  },
  context: null as null | {
    runtime: Ref<unknown>;
    port: Ref<unknown>;
    locale: Ref<"zh" | "ja" | "en">;
    resolveAssetUrl: (path: string) => string;
    dispose: ReturnType<typeof vi.fn>;
  },
  store: {
    activeFileId: "file-1",
    visibleFiles: [
      { id: "file-1", label: "File 1" },
      { id: "file-2", label: "File 2" },
    ],
  },
  persistence: { kind: "local-storage" },
}));

const shellSpies = vi.hoisted(() => ({
  createEditorContext: vi.fn(),
  provideEditorContext: vi.fn(),
  createWorkspaceSession: vi.fn(),
  provideWorkspaceSession: vi.fn(),
  initialize: vi.fn(),
  startAutoSave: vi.fn(),
  renderActiveFile: vi.fn(),
  setActiveFile: vi.fn(),
  removeTab: vi.fn(),
  addTab: vi.fn(),
  workspaceDispose: vi.fn(),
  contextDispose: vi.fn(),
  showUpdateLog: vi.fn(),
  showFeedbackForm: vi.fn(),
  message: vi.fn(),
}));

vi.mock("@/editor/context/EditorContext", async () => {
  const { ref } = await import("vue");
  shellState.context = {
    runtime: ref(null),
    port: ref(null),
    locale: ref("ja"),
    resolveAssetUrl: (path: string) => `/base${path}`,
    dispose: shellSpies.contextDispose,
  };
  shellSpies.createEditorContext.mockImplementation(() => shellState.context);
  return { createEditorContext: shellSpies.createEditorContext };
});

vi.mock("@/editor/context/useEditorContext", () => ({
  provideEditorContext: (context: unknown) => {
    shellSpies.provideEditorContext(context);
    return context;
  },
}));

vi.mock("@/features/assets/public", () => ({
  getAssetBaseUrl: () => "/base",
}));

vi.mock("@/features/locale/public", () => ({
  resolveInitialEditorLocale: () => "ja",
  createEditorI18n: () => ({
    t: (key: string) => `translated:${key}`,
  }),
}));

vi.mock("@/features/workspace/public", () => {
  const session = {
    initialize: shellSpies.initialize,
    startAutoSave: shellSpies.startAutoSave,
    renderActiveFile: shellSpies.renderActiveFile,
    setActiveFile: shellSpies.setActiveFile,
    removeTab: shellSpies.removeTab,
    addTab: shellSpies.addTab,
    dispose: shellSpies.workspaceDispose,
  };
  return {
    createLocalStorageFilesPersistence: () => shellState.persistence,
    useFilesStore: () => shellState.store,
    createWorkspaceSession: (options: unknown) => {
      shellSpies.createWorkspaceSession(options);
      return session;
    },
    provideWorkspaceSession: (value: unknown) => {
      shellSpies.provideWorkspaceSession(value);
      return value;
    },
  };
});

vi.mock("element-plus", async (importOriginal) => {
  const actual = await importOriginal<typeof import("element-plus")>();
  return { ...actual, ElMessage: shellSpies.message };
});

const ToolbarStub = defineComponent({
  name: "EditorToolbar",
  emits: ["show-update-log", "show-feedback"],
  setup(_, { emit }) {
    return () =>
      h("div", { "data-shell-toolbar": "true" }, [
        h(
          "button",
          {
            "data-about-command": "update-log",
            onClick: () => emit("show-update-log"),
          },
          "update log",
        ),
        h(
          "button",
          {
            "data-about-command": "feedback",
            onClick: () => emit("show-feedback"),
          },
          "feedback",
        ),
      ]);
  },
});

const AboutDialogsStub = defineComponent({
  name: "AboutDialogs",
  props: {
    contactImageUrl: String,
    translate: Function,
  },
  setup(props, { expose }) {
    expose({
      showUpdateLog: shellSpies.showUpdateLog,
      showFeedbackForm: shellSpies.showFeedbackForm,
    });
    return () =>
      h("div", {
        "data-about-dialogs": "true",
        "data-contact-image": props.contactImageUrl,
      });
  },
});

const TabsStub = defineComponent({
  name: "ElTabs",
  props: { modelValue: String },
  emits: ["update:modelValue", "edit"],
  setup(props, { slots }) {
    return () =>
      h("div", { "data-active-tab": props.modelValue }, slots.default?.());
  },
});

const TabPaneStub = defineComponent({
  name: "ElTabPane",
  props: { label: String, name: String },
  setup(props) {
    return () =>
      h("div", {
        "data-tab-name": props.name,
        "data-tab-label": props.label,
      });
  },
});

const createWrapper = () =>
  mount(StandaloneEditorShell, {
    global: {
      stubs: {
        EditorToolbar: ToolbarStub,
        AboutDialogs: AboutDialogsStub,
        ElTabs: TabsStub,
        ElTabPane: TabPaneStub,
        NodePalette: true,
        FlowEditor: true,
        EditorDialogHost: true,
      },
    },
  });

describe("StandaloneEditorShell", () => {
  beforeEach(() => {
    Object.values(shellSpies).forEach((spy) => spy.mockClear());
    shellState.initializeResult = { restored: true };
    shellSpies.initialize.mockImplementation(() => shellState.initializeResult);
    shellState.context!.runtime.value = null;
    shellState.context!.port.value = null;
  });

  it("owns standalone context, workspace lifecycle, tabs, and about dialogs", async () => {
    const wrapper = createWrapper();
    await nextTick();

    expect(shellSpies.createEditorContext).toHaveBeenCalledWith({
      locale: "ja",
      assetBaseUrl: "/base",
    });
    expect(shellSpies.provideEditorContext).toHaveBeenCalledWith(
      shellState.context,
    );
    expect(shellSpies.createWorkspaceSession).toHaveBeenCalledWith(
      expect.objectContaining({
        store: shellState.store,
        persistence: shellState.persistence,
        getEditorPort: expect.any(Function),
      }),
    );
    const sessionOptions = shellSpies.createWorkspaceSession.mock
      .calls[0][0] as {
      getEditorPort(): unknown;
    };
    shellState.context!.port.value = { kind: "editor-port" };
    expect(sessionOptions.getEditorPort()).toEqual({ kind: "editor-port" });
    expect(shellSpies.initialize).toHaveBeenCalledTimes(1);
    expect(shellSpies.startAutoSave).toHaveBeenCalledTimes(1);
    expect(shellSpies.message).toHaveBeenCalledWith({
      type: "success",
      message: "已恢复上次工作区",
    });
    expect(wrapper.findAll("[data-tab-name]")).toHaveLength(2);
    expect(
      wrapper.get("[data-about-dialogs]").attributes("data-contact-image"),
    ).toBe("/base/assets/Other/Contact.png");

    const tabs = wrapper.getComponent(TabsStub);
    tabs.vm.$emit("update:modelValue", "file-2");
    tabs.vm.$emit("edit", "file-2", "remove");
    tabs.vm.$emit("edit", undefined, "add");
    await wrapper.get('[data-about-command="update-log"]').trigger("click");
    await wrapper.get('[data-about-command="feedback"]').trigger("click");

    expect(shellSpies.setActiveFile).toHaveBeenCalledWith("file-2");
    expect(shellSpies.removeTab).toHaveBeenCalledWith("file-2");
    expect(shellSpies.addTab).toHaveBeenCalledTimes(1);
    expect(shellSpies.showUpdateLog).toHaveBeenCalledTimes(1);
    expect(shellSpies.showFeedbackForm).toHaveBeenCalledTimes(1);

    shellState.context!.runtime.value = { kind: "runtime" };
    await nextTick();
    expect(shellSpies.renderActiveFile).toHaveBeenCalledTimes(1);

    wrapper.unmount();
    expect(shellSpies.workspaceDispose).toHaveBeenCalledTimes(1);
    expect(shellSpies.contextDispose).toHaveBeenCalledTimes(1);
  });

  it("reports damaged persisted workspace data without skipping autosave", async () => {
    const error = new Error("broken workspace");
    shellState.initializeResult = { restored: false, error };
    const wrapper = createWrapper();
    await nextTick();

    expect(shellSpies.message).toHaveBeenCalledWith({
      type: "warning",
      message: "本地工作区数据损坏，已重置为默认状态",
    });
    expect(shellSpies.startAutoSave).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it("keeps App as a standalone shell facade", () => {
    expect(appSource).toContain("StandaloneEditorShell");
    expect(appSource).not.toMatch(
      /createEditorContext|createWorkspaceSession|useFilesStore|FlowEditor|NodePalette|EditorToolbar/,
    );
  });
});
