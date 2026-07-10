<script setup lang="ts">
import { computed, ref, watch } from "vue";

import {
  DEFAULT_NODE_CREATE_SIZE_CONFIG,
  cloneNodeCreateSizeConfig,
  type AssetThemeConfig,
  type NodeCreateSizeConfig,
} from "../nodeAppearanceRepository";
import { ASSET_LIBRARY_IDS, type AssetLibraryId } from "../model/types";
import AssetThemeDetailDialog from "./AssetThemeDetailDialog.vue";

type Translate = (key: string, values?: unknown) => string;
type ThemeDetailMode = "nodeStyle" | "name";

const props = defineProps<{
  modelValue: boolean;
  config: NodeCreateSizeConfig;
  applyingToCurrent?: boolean;
  t: Translate;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  reset: [];
  applyCurrent: [config: NodeCreateSizeConfig];
  confirm: [config: NodeCreateSizeConfig];
}>();

const draft = ref(cloneNodeCreateSizeConfig(props.config));
const detailVisible = ref(false);
const detailLibrary = ref<AssetLibraryId>("shikigami");
const detailMode = ref<ThemeDetailMode>("nodeStyle");
const detailTheme = computed(
  () => draft.value.assetThemeByLibrary[detailLibrary.value],
);
const detailTitle = computed(() => {
  const sectionKey =
    detailMode.value === "nodeStyle"
      ? "nodeSize.section.assetStyle"
      : "nodeSize.section.assetName";
  return `${props.t(`assetLibrary.${detailLibrary.value}`)} · ${props.t(sectionKey)}`;
});

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      draft.value = cloneNodeCreateSizeConfig(props.config);
      detailVisible.value = false;
    }
  },
  { immediate: true },
);

const openDetail = (library: AssetLibraryId, mode: ThemeDetailMode) => {
  detailLibrary.value = library;
  detailMode.value = mode;
  detailVisible.value = true;
};

const updateDetailTheme = (theme: AssetThemeConfig) => {
  draft.value.assetThemeByLibrary[detailLibrary.value] = theme;
};

const reset = () => {
  draft.value = cloneNodeCreateSizeConfig(DEFAULT_NODE_CREATE_SIZE_CONFIG);
  emit("reset");
};

const applyCurrent = () => {
  emit("applyCurrent", cloneNodeCreateSizeConfig(draft.value));
};

const confirm = () => {
  emit("confirm", cloneNodeCreateSizeConfig(draft.value));
  emit("update:modelValue", false);
};
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="t('nodeSize.title')"
    width="640px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="node-size-grid">
      <div class="node-size-row node-size-row--header">
        <span class="node-size-label"></span>
        <span class="node-size-dimension">{{ t("nodeSize.width") }}</span>
        <span class="node-size-dimension">{{ t("nodeSize.height") }}</span>
        <span class="node-size-dimension">{{
          t("nodeSize.section.assetStyle")
        }}</span>
        <span class="node-size-dimension">{{
          t("nodeSize.section.assetName")
        }}</span>
      </div>
      <div class="node-size-row">
        <span class="node-size-label">{{
          t("flow.components.image.name")
        }}</span>
        <el-input-number
          v-model="draft.imageNode.width"
          :min="40"
          :max="1200"
          controls-position="right"
          size="small"
        />
        <el-input-number
          v-model="draft.imageNode.height"
          :min="40"
          :max="1200"
          controls-position="right"
          size="small"
        />
        <span class="node-size-placeholder">-</span>
        <span class="node-size-placeholder">-</span>
      </div>
      <div
        v-for="library in ASSET_LIBRARY_IDS"
        :key="library"
        class="node-size-row"
      >
        <span class="node-size-label">{{ t(`assetLibrary.${library}`) }}</span>
        <el-input-number
          v-model="draft.assetSelectorByLibrary[library].width"
          :min="40"
          :max="1200"
          controls-position="right"
          size="small"
        />
        <el-input-number
          v-model="draft.assetSelectorByLibrary[library].height"
          :min="40"
          :max="1200"
          controls-position="right"
          size="small"
        />
        <el-button
          size="small"
          class="node-size-action"
          @click="openDetail(library, 'nodeStyle')"
        >
          {{ t("common.edit") }}
        </el-button>
        <el-button
          size="small"
          class="node-size-action"
          @click="openDetail(library, 'name')"
        >
          {{ t("common.edit") }}
        </el-button>
      </div>
    </div>
    <div class="node-theme-toggle">
      <span class="node-size-label">{{ t("nodeSize.enableTheme") }}</span>
      <el-switch v-model="draft.assetThemeEnabled" />
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="reset">{{ t("nodeSize.reset") }}</el-button>
        <el-button
          type="primary"
          plain
          :loading="applyingToCurrent"
          @click="applyCurrent"
        >
          {{ t("nodeSize.applyCurrent") }}
        </el-button>
        <el-button @click="emit('update:modelValue', false)">{{
          t("common.close")
        }}</el-button>
        <el-button type="primary" @click="confirm">{{
          t("common.confirm")
        }}</el-button>
      </span>
    </template>
  </el-dialog>

  <AssetThemeDetailDialog
    v-model="detailVisible"
    :title="detailTitle"
    :mode="detailMode"
    :theme="detailTheme"
    :t="t"
    @confirm="updateDetailTheme"
  />
</template>

<style scoped>
.node-size-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
  margin-bottom: 10px;
}

.node-size-row {
  display: grid;
  grid-template-columns: 1fr 120px 120px 120px 120px;
  gap: 10px;
  align-items: center;
}

.node-size-label {
  font-size: 13px;
  color: #303133;
}

.node-size-row--header {
  margin-bottom: 2px;
}

.node-size-dimension {
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.node-size-placeholder {
  text-align: center;
  color: #c0c4cc;
  font-size: 12px;
}

.node-size-action {
  width: 100%;
}

.node-theme-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0 10px;
}

@media (max-width: 900px) {
  .node-size-row {
    grid-template-columns: 1fr;
    justify-items: stretch;
  }
}
</style>
