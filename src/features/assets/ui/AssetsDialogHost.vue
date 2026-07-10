<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";

import {
  createCustomAssetFromFile,
  deleteCustomAsset,
  listCustomAssets,
  subscribeCustomAssetStore,
  type CustomAssetItem,
} from "../customAssetsRepository";
import { ASSET_LIBRARIES } from "../model/libraries";
import {
  normalizeNodeCreateSizeConfig,
  readNodeCreateSizeConfig,
  resolveAssetThemeEnabled,
  writeNodeCreateSizeConfig,
  type NodeCreateSizeConfig,
} from "../nodeAppearanceRepository";
import AssetManagerDialog from "./AssetManagerDialog.vue";
import NodeThemeDialog from "./NodeThemeDialog.vue";
import type {
  ApplyNodeThemeToCurrent,
  AssetsDialogHostExpose,
  AssetsDialogNotify,
  AssetsDialogTranslate,
} from "./types";

const props = withDefaults(
  defineProps<{
    translate?: AssetsDialogTranslate;
    notify?: AssetsDialogNotify;
    resolveAssetUrl?: (value: unknown) => unknown;
    applyNodeThemeToCurrent?: ApplyNodeThemeToCurrent;
  }>(),
  {
    translate: (key: string) => key,
    resolveAssetUrl: (value: unknown) => value,
  },
);

const assetLibraries = ASSET_LIBRARIES.map((item) => ({
  id: item.id,
  label: `${item.label}素材`,
}));
const assetManagerVisible = ref(false);
const assetManagerLibrary = ref(assetLibraries[0]?.id ?? "shikigami");
const managedAssets = reactive<Record<string, CustomAssetItem[]>>({});
const nodeThemeVisible = ref(false);
const nodeThemeConfig = ref(readNodeCreateSizeConfig());
const applyingThemeToCurrent = ref(false);
let disposeAssetSubscription: (() => void) | null = null;

assetLibraries.forEach(({ id }) => {
  managedAssets[id] = [];
});

const notify: AssetsDialogNotify = (type, message) => {
  if (props.notify) {
    props.notify(type, message);
    return;
  }
  ElMessage({ type, message });
};

const refreshManagedAssets = (libraryId?: string) => {
  if (libraryId) {
    managedAssets[libraryId] = listCustomAssets(libraryId);
    return;
  }
  assetLibraries.forEach(({ id }) => {
    managedAssets[id] = listCustomAssets(id);
  });
};

const openAssetManager = () => {
  refreshManagedAssets();
  assetManagerVisible.value = true;
};

const openNodeTheme = () => {
  nodeThemeConfig.value = readNodeCreateSizeConfig();
  nodeThemeVisible.value = true;
};

const uploadAsset = async (file: File, complete: () => void) => {
  try {
    await createCustomAssetFromFile(assetManagerLibrary.value, file);
    refreshManagedAssets(assetManagerLibrary.value);
    notify("success", "素材上传成功");
  } catch {
    notify("error", "素材上传失败");
  } finally {
    complete();
  }
};

const removeAsset = (libraryId: string, item: CustomAssetItem) => {
  deleteCustomAsset(libraryId, item);
  refreshManagedAssets(libraryId);
};

const resetNodeTheme = () => {
  notify("success", props.translate("nodeSize.message.reset"));
};

const confirmNodeTheme = (config: NodeCreateSizeConfig) => {
  nodeThemeConfig.value = writeNodeCreateSizeConfig(config);
  notify("success", props.translate("nodeSize.message.applied"));
};

const applyNodeTheme = async (config: NodeCreateSizeConfig) => {
  if (!resolveAssetThemeEnabled({ config })) {
    notify("warning", props.translate("nodeSize.message.themeDisabled"));
    return;
  }

  applyingThemeToCurrent.value = true;
  try {
    const normalized = normalizeNodeCreateSizeConfig(config);
    nodeThemeConfig.value = normalized;
    const applied = await props.applyNodeThemeToCurrent?.(normalized);
    if (applied === false || !props.applyNodeThemeToCurrent) {
      notify("error", props.translate("nodeSize.message.applyCurrentFailed"));
      return;
    }
    notify("success", props.translate("nodeSize.message.applyCurrentSuccess"));
  } catch {
    notify("error", props.translate("nodeSize.message.applyCurrentFailed"));
  } finally {
    applyingThemeToCurrent.value = false;
  }
};

onMounted(() => {
  refreshManagedAssets();
  disposeAssetSubscription = subscribeCustomAssetStore(() => {
    refreshManagedAssets();
  });
});

onBeforeUnmount(() => {
  disposeAssetSubscription?.();
  disposeAssetSubscription = null;
});

defineExpose<AssetsDialogHostExpose>({
  openAssetManager,
  openNodeTheme,
});
</script>

<template>
  <NodeThemeDialog
    v-model="nodeThemeVisible"
    :config="nodeThemeConfig"
    :applying-to-current="applyingThemeToCurrent"
    :t="translate"
    @reset="resetNodeTheme"
    @apply-current="applyNodeTheme"
    @confirm="confirmNodeTheme"
  />
  <AssetManagerDialog
    v-model="assetManagerVisible"
    v-model:library="assetManagerLibrary"
    :libraries="assetLibraries"
    :assets="managedAssets"
    :resolve-asset-url="resolveAssetUrl"
    :t="translate"
    @upload="uploadAsset"
    @remove="removeAsset"
  />
</template>
