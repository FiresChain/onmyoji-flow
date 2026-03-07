<script setup lang="ts">
import { computed } from "vue";
import { useDialogs } from "@/ts/useDialogs";
import { getLogicFlowInstance, useLogicFlowScope } from "@/ts/useLogicFlow";
import { getSelectorPreset } from "@/configs/selectorPresets";
import type { SelectorConfig } from "@/types/selector";
import {
  resolveAssetUrl,
  resolveAssetUrlsInDataSource,
} from "@/utils/assetUrl";
import { deleteCustomAsset, listCustomAssets } from "@/utils/customAssets";
import { normalizeSelectedAssetRecord } from "@/utils/graphSchema";
import { useSafeI18n } from "@/ts/useSafeI18n";
import {
  readNodeCreateSizeConfig,
  resolveAssetThemeConfig,
  resolveAssetThemeEnabled,
} from "@/utils/nodeCreateSizeConfig";

const props = defineProps<{
  node: any;
}>();

const { openGenericSelector } = useDialogs();
const logicFlowScope = useLogicFlowScope();
const { t, getLocale } = useSafeI18n();

const currentLibrary = computed(
  () => props.node.properties?.assetLibrary || "shikigami",
);

const currentAsset = computed(() => {
  return props.node.properties?.selectedAsset || { name: "未选择" };
});

const nameVisible = computed(() => {
  const config = readNodeCreateSizeConfig();
  if (!resolveAssetThemeEnabled({ config })) {
    const rawDisabled = props.node.properties?.assetName?.visible;
    return rawDisabled === true;
  }
  const themeDefault = resolveAssetThemeConfig({
    config,
    assetLibrary: currentLibrary.value,
  }).name.show;
  const raw = props.node.properties?.assetName?.visible;
  return raw == null ? themeDefault : raw !== false;
});

const handleToggleNameVisible = (nextVisible: boolean) => {
  const lf = getLogicFlowInstance(logicFlowScope);
  const node = props.node;
  if (!lf || !node) return;
  const currentAssetName = node.properties?.assetName || {};
  lf.setProperties(node.id, {
    ...node.properties,
    assetName: {
      ...currentAssetName,
      visible: nextVisible,
    },
  });
};

const handleOpenSelector = () => {
  const lf = getLogicFlowInstance(logicFlowScope);
  const node = props.node;
  if (!lf || !node) return;

  const library = currentLibrary.value;
  const preset = getSelectorPreset(library, {
    locale: getLocale(),
    t,
  });

  if (!preset) {
    console.error("未找到资产库配置:", library);
    return;
  }

  const imageField = preset.itemRender.imageField;
  const selectedAsset = node.properties?.selectedAsset || null;
  const normalizedSelectedAssetRecord = normalizeSelectedAssetRecord(
    selectedAsset,
    library,
  );
  const normalizedSelectedAsset = normalizedSelectedAssetRecord
    ? {
        ...normalizedSelectedAssetRecord,
        [imageField]: resolveAssetUrl((selectedAsset as any)?.[imageField]),
      }
    : null;

  const customAssets = listCustomAssets(library);
  const mergedDataSource = [...(preset.dataSource as any[]), ...customAssets];
  const mergedGroups = [
    ...preset.groups,
    {
      label: t("selector.group.custom"),
      name: "__CUSTOM__",
      filter: (item: any) => !!item?.__userAsset,
    },
  ];

  const config: SelectorConfig = {
    ...preset,
    groups: mergedGroups,
    dataSource: resolveAssetUrlsInDataSource(mergedDataSource, imageField),
    currentItem: normalizedSelectedAsset,
    assetLibrary: library,
    allowUserAssetUpload: true,
    onDeleteUserAsset: (item: any) => {
      deleteCustomAsset(library, item);
    },
    onUserAssetUploaded: () => {
      // 上传后的数据刷新由选择器内部完成，这里保留扩展钩子。
    },
  };

  openGenericSelector(config, (selectedItem) => {
    const normalizedSelectedRecord = normalizeSelectedAssetRecord(
      selectedItem,
      library,
    );
    const normalizedSelected = normalizedSelectedRecord
      ? {
          ...normalizedSelectedRecord,
          [imageField]: resolveAssetUrl((selectedItem as any)?.[imageField]),
        }
      : null;

    lf.setProperties(node.id, {
      ...node.properties,
      selectedAsset: normalizedSelected,
      assetLibrary: library,
    });
  });
};
</script>

<template>
  <div class="property-section">
    <div class="section-header">{{ t("assetPanel.title") }}</div>

    <div class="property-item">
      <div class="property-label">{{ t("assetPanel.current") }}</div>
      <span>{{ currentAsset.name }}</span>
      <el-button
        type="primary"
        @click="handleOpenSelector"
        style="width: 100%; margin-top: 8px"
      >
        {{ t("assetPanel.pick") }}
      </el-button>
    </div>

    <div class="property-item">
      <div class="property-label">{{ t("assetPanel.nameVisible") }}</div>
      <el-switch
        :model-value="nameVisible"
        @change="(value: unknown) => handleToggleNameVisible(value !== false)"
      />
    </div>
  </div>
</template>

<style scoped>
.property-section {
  padding: 12px;
}

.section-header {
  font-weight: bold;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.property-item {
  margin-bottom: 16px;
}

.property-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}
</style>
