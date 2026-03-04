import { reactive, ref } from "vue";
import { ASSET_LIBRARIES } from "@/types/nodeTypes";
import {
  createCustomAssetFromFile,
  deleteCustomAsset,
  listCustomAssets,
  subscribeCustomAssetStore,
  type CustomAssetItem,
} from "@/utils/customAssets";

type MessageType = "success" | "warning" | "info" | "error";

type ShowMessage = (type: MessageType, message: string) => void;

interface ToolbarAssetManagementState {
  showAssetManagerDialog: boolean;
}

interface UseToolbarAssetManagementOptions {
  state: ToolbarAssetManagementState;
  showMessage: ShowMessage;
}

export function useToolbarAssetManagement(
  options: UseToolbarAssetManagementOptions,
) {
  const { state, showMessage } = options;
  const assetLibraries = ASSET_LIBRARIES.map((item) => ({
    id: item.id,
    label: `${item.label}素材`,
  }));
  const assetManagerLibrary = ref(assetLibraries[0]?.id || "shikigami");
  const assetUploadInputRef = ref<HTMLInputElement | null>(null);
  const managedAssets = reactive<Record<string, CustomAssetItem[]>>({});

  assetLibraries.forEach((item) => {
    managedAssets[item.id] = [];
  });

  let unsubscribeAssetStore: (() => void) | null = null;

  const refreshManagedAssets = (library?: string) => {
    if (library) {
      managedAssets[library] = listCustomAssets(library);
      return;
    }

    assetLibraries.forEach((item) => {
      managedAssets[item.id] = listCustomAssets(item.id);
    });
  };

  const mountAssetManagement = () => {
    refreshManagedAssets();
    unsubscribeAssetStore = subscribeCustomAssetStore(() => {
      refreshManagedAssets();
    });
  };

  const disposeAssetManagement = () => {
    unsubscribeAssetStore?.();
    unsubscribeAssetStore = null;
  };

  const openAssetManager = () => {
    refreshManagedAssets();
    state.showAssetManagerDialog = true;
  };

  const getManagedAssets = (libraryId: string) => {
    return managedAssets[libraryId] || [];
  };

  const triggerAssetManagerUpload = () => {
    assetUploadInputRef.value?.click();
  };

  const handleAssetManagerUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0];
    if (!file) {
      if (target) target.value = "";
      return;
    }

    try {
      await createCustomAssetFromFile(assetManagerLibrary.value, file);
      refreshManagedAssets(assetManagerLibrary.value);
      showMessage("success", "素材上传成功");
    } catch (error) {
      console.error("素材上传失败:", error);
      showMessage("error", "素材上传失败");
    } finally {
      if (target) target.value = "";
    }
  };

  const removeManagedAsset = (libraryId: string, item: CustomAssetItem) => {
    deleteCustomAsset(libraryId, item);
    refreshManagedAssets(libraryId);
  };

  return {
    assetLibraries,
    assetManagerLibrary,
    assetUploadInputRef,
    mountAssetManagement,
    disposeAssetManagement,
    openAssetManager,
    getManagedAssets,
    triggerAssetManagerUpload,
    handleAssetManagerUpload,
    removeManagedAsset,
  };
}
