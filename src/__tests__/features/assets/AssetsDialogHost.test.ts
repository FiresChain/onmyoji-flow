import { flushPromises, shallowMount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import AssetsDialogHost from "@/features/assets/ui/AssetsDialogHost.vue";
import AssetManagerDialog from "@/features/assets/ui/AssetManagerDialog.vue";
import NodeThemeDialog from "@/features/assets/ui/NodeThemeDialog.vue";
import type { AssetsDialogHostExpose } from "@/features/assets/ui/types";
import {
  DEFAULT_NODE_CREATE_SIZE_CONFIG,
  NODE_CREATE_SIZE_STORAGE_KEY,
  cloneNodeCreateSizeConfig,
} from "@/features/assets/public";

const mocks = vi.hoisted(() => ({
  createCustomAssetFromFile: vi.fn(),
  deleteCustomAsset: vi.fn(),
  listCustomAssets: vi.fn(() => []),
  subscribeCustomAssetStore: vi.fn(),
  disposeSubscription: vi.fn(),
}));

vi.mock("@/features/assets/customAssetsRepository", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/features/assets/customAssetsRepository")
    >();
  return {
    ...actual,
    createCustomAssetFromFile: mocks.createCustomAssetFromFile,
    deleteCustomAsset: mocks.deleteCustomAsset,
    listCustomAssets: mocks.listCustomAssets,
    subscribeCustomAssetStore: mocks.subscribeCustomAssetStore,
  };
});

describe("AssetsDialogHost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem(NODE_CREATE_SIZE_STORAGE_KEY);
    mocks.listCustomAssets.mockReturnValue([]);
    mocks.subscribeCustomAssetStore.mockReturnValue(mocks.disposeSubscription);
    mocks.createCustomAssetFromFile.mockResolvedValue(undefined);
  });

  it("owns dialog state and disposes the custom-asset subscription", async () => {
    const wrapper = shallowMount(AssetsDialogHost);
    const host = wrapper.vm as unknown as AssetsDialogHostExpose;

    expect(mocks.subscribeCustomAssetStore).toHaveBeenCalledOnce();
    expect(mocks.listCustomAssets).toHaveBeenCalledTimes(5);

    host.openAssetManager();
    host.openNodeTheme();
    await nextTick();

    expect(wrapper.getComponent(AssetManagerDialog).props("modelValue")).toBe(
      true,
    );
    expect(wrapper.getComponent(NodeThemeDialog).props("modelValue")).toBe(
      true,
    );

    wrapper.unmount();
    expect(mocks.disposeSubscription).toHaveBeenCalledOnce();
  });

  it("handles upload and delete inside the feature host", async () => {
    const notify = vi.fn();
    const wrapper = shallowMount(AssetsDialogHost, { props: { notify } });
    const host = wrapper.vm as unknown as AssetsDialogHostExpose;
    host.openAssetManager();
    await nextTick();
    const manager = wrapper.getComponent(AssetManagerDialog);
    const file = new File(["asset"], "asset.png", { type: "image/png" });
    const complete = vi.fn();

    manager.vm.$emit("upload", file, complete);
    await flushPromises();

    expect(mocks.createCustomAssetFromFile).toHaveBeenCalledWith(
      "shikigami",
      file,
    );
    expect(complete).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledWith("success", "素材上传成功");

    const item = {
      id: "custom-1",
      name: "asset",
      avatar: "/asset.png",
      library: "shikigami",
      __userAsset: true as const,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    manager.vm.$emit("remove", "shikigami", item);
    expect(mocks.deleteCustomAsset).toHaveBeenCalledWith("shikigami", item);
  });

  it("persists confirmed settings and delegates current-canvas mutation", async () => {
    const notify = vi.fn();
    const applyNodeThemeToCurrent = vi.fn().mockResolvedValue(undefined);
    const wrapper = shallowMount(AssetsDialogHost, {
      props: {
        notify,
        translate: (key: string) => key,
        applyNodeThemeToCurrent,
      },
    });
    const host = wrapper.vm as unknown as AssetsDialogHostExpose;
    host.openNodeTheme();
    await nextTick();
    const dialog = wrapper.getComponent(NodeThemeDialog);
    const config = cloneNodeCreateSizeConfig(DEFAULT_NODE_CREATE_SIZE_CONFIG);
    config.imageNode.width = 360;

    dialog.vm.$emit("confirm", config);
    expect(
      JSON.parse(localStorage.getItem(NODE_CREATE_SIZE_STORAGE_KEY) || "{}"),
    ).toMatchObject({ imageNode: { width: 360 } });
    expect(notify).toHaveBeenCalledWith("success", "nodeSize.message.applied");

    dialog.vm.$emit("applyCurrent", config);
    await flushPromises();
    expect(applyNodeThemeToCurrent).toHaveBeenCalledWith(
      expect.objectContaining({ imageNode: { width: 360, height: 120 } }),
    );
    expect(notify).toHaveBeenCalledWith(
      "success",
      "nodeSize.message.applyCurrentSuccess",
    );
  });
});
