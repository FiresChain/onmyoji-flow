import { createApp, defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createEditorContext } from "@/editor/context/EditorContext";
import { useDialogs } from "@/editor/context/useDialogs";
import { provideEditorContext } from "@/editor/context/useEditorContext";
import type { SelectorConfig } from "@/features/assets/public";

const mountedApps: Array<ReturnType<typeof createApp>> = [];

const mountDialogs = (context: ReturnType<typeof createEditorContext>) => {
  let dialogsApi: ReturnType<typeof useDialogs> | null = null;
  const Consumer = defineComponent({
    setup() {
      dialogsApi = useDialogs();
      return () => null;
    },
  });
  const Root = defineComponent({
    setup() {
      provideEditorContext(context);
      return () => h(Consumer);
    },
  });
  const host = document.createElement("div");
  document.body.appendChild(host);
  const app = createApp(Root);
  app.mount(host);
  mountedApps.push(app);

  if (!dialogsApi) {
    throw new Error("Dialog API was not created");
  }
  return dialogsApi;
};

afterEach(() => {
  mountedApps.splice(0).forEach((app) => app.unmount());
  document.body.innerHTML = "";
});

describe("editor dialog context adapter", () => {
  it("routes dialog state and callbacks through the current editor instance", () => {
    const firstContext = createEditorContext();
    const secondContext = createEditorContext();
    const first = mountDialogs(firstContext);
    const second = mountDialogs(secondContext);
    const propertyCallback = vi.fn();

    first.openDialog(
      "property",
      { id: "first" },
      { id: "node-1" },
      propertyCallback,
    );

    expect(first.dialogs.property).toMatchObject({
      show: true,
      data: { id: "first" },
      node: { id: "node-1" },
      callback: propertyCallback,
    });
    expect(second.dialogs.property.show).toBe(false);

    first.closeDialog("property");
    expect(first.dialogs.property).toMatchObject({
      show: false,
      data: null,
      callback: null,
    });

    const selectorCallback = vi.fn();
    const selectorConfig = { title: "Assets" } as SelectorConfig;
    second.openGenericSelector(selectorConfig, selectorCallback);

    expect(second.dialogs.generic).toMatchObject({
      show: true,
      config: selectorConfig,
      callback: selectorCallback,
    });
    expect(first.dialogs.generic.show).toBe(false);

    second.closeGenericSelector();
    expect(second.dialogs.generic.show).toBe(false);
  });
});
