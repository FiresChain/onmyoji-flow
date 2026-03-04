import { beforeEach, describe, expect, it, vi } from "vitest";
import { useToolbarAssetManagement } from "@/components/composables/useToolbarAssetManagement";
import {
  createCustomAssetFromFile,
  deleteCustomAsset,
  listCustomAssets,
  subscribeCustomAssetStore,
} from "@/utils/customAssets";

vi.mock("@/types/nodeTypes", () => ({
  ASSET_LIBRARIES: [
    { id: "shikigami", label: "式神" },
    { id: "yuhun", label: "御魂" },
  ],
}));

vi.mock("@/utils/customAssets", () => ({
  createCustomAssetFromFile: vi.fn(),
  deleteCustomAsset: vi.fn(),
  listCustomAssets: vi.fn(),
  subscribeCustomAssetStore: vi.fn(),
}));

interface ToolbarAssetTestContext {
  state: {
    showAssetManagerDialog: boolean;
  };
  showMessage: ReturnType<typeof vi.fn>;
  composable: ReturnType<typeof useToolbarAssetManagement>;
}

const createContext = (): ToolbarAssetTestContext => {
  const state = {
    showAssetManagerDialog: false,
  };
  const showMessage = vi.fn();

  const composable = useToolbarAssetManagement({
    state,
    showMessage,
  });

  return {
    state,
    showMessage,
    composable,
  };
};

describe("useToolbarAssetManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listCustomAssets).mockImplementation((libraryId: string) => {
      if (libraryId === "shikigami") {
        return [
          {
            id: "a1",
            name: "阿修罗",
            avatar: "/a.png",
            library: "shikigami",
            __userAsset: true as const,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ];
      }
      return [];
    });
  });

  it("mount/open/dispose keeps refresh+subscription orchestration behavior", () => {
    const unsubscribe = vi.fn();
    let subscriber: (() => void) | null = null;
    vi.mocked(subscribeCustomAssetStore).mockImplementation(
      (callback: () => void) => {
        subscriber = callback;
        return unsubscribe;
      },
    );

    const context = createContext();

    context.composable.mountAssetManagement();
    expect(subscribeCustomAssetStore).toHaveBeenCalledTimes(1);
    expect(context.composable.getManagedAssets("shikigami")).toHaveLength(1);

    subscriber?.();
    expect(listCustomAssets).toHaveBeenCalledTimes(4);

    context.composable.openAssetManager();
    expect(context.state.showAssetManagerDialog).toBe(true);
    expect(listCustomAssets).toHaveBeenCalledTimes(6);

    context.composable.disposeAssetManagement();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("handleAssetManagerUpload keeps upload-success behavior", async () => {
    vi.mocked(createCustomAssetFromFile).mockResolvedValue(undefined as never);
    const context = createContext();
    const file = new File(["asset"], "asset.png", { type: "image/png" });
    const target = {
      files: [file],
      value: "selected",
    } as unknown as HTMLInputElement;

    await context.composable.handleAssetManagerUpload({
      target,
    } as unknown as Event);

    expect(createCustomAssetFromFile).toHaveBeenCalledWith("shikigami", file);
    expect(context.showMessage).toHaveBeenCalledWith("success", "素材上传成功");
    expect(target.value).toBe("");
  });

  it("handleAssetManagerUpload keeps upload-error behavior", async () => {
    vi.mocked(createCustomAssetFromFile).mockRejectedValue(
      new Error("upload fail"),
    );
    const context = createContext();
    const file = new File(["asset"], "asset.png", { type: "image/png" });
    const target = {
      files: [file],
      value: "selected",
    } as unknown as HTMLInputElement;

    await context.composable.handleAssetManagerUpload({
      target,
    } as unknown as Event);

    expect(context.showMessage).toHaveBeenCalledWith("error", "素材上传失败");
    expect(target.value).toBe("");
  });

  it("removeManagedAsset keeps delete+refresh behavior", () => {
    const context = createContext();
    const targetAsset = {
      id: "y1",
      name: "破势",
      avatar: "/y.png",
      library: "yuhun",
      __userAsset: true as const,
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    context.composable.removeManagedAsset("yuhun", targetAsset);

    expect(deleteCustomAsset).toHaveBeenCalledWith("yuhun", targetAsset);
    expect(listCustomAssets).toHaveBeenCalledWith("yuhun");
  });
});
