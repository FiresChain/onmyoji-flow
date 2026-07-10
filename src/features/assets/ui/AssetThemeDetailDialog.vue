<script setup lang="ts">
import { ref, watch } from "vue";

import type { AssetThemeConfig } from "../nodeAppearanceRepository";

type Translate = (key: string, values?: unknown) => string;
type ThemeDetailMode = "nodeStyle" | "name";

const props = defineProps<{
  modelValue: boolean;
  title: string;
  mode: ThemeDetailMode;
  theme: AssetThemeConfig;
  t: Translate;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [theme: AssetThemeConfig];
}>();

const cloneTheme = (value: AssetThemeConfig): AssetThemeConfig => ({
  nodeStyle: { ...value.nodeStyle },
  name: {
    ...value.name,
    textStyle: { ...value.name.textStyle },
  },
});

const draft = ref<AssetThemeConfig>(cloneTheme(props.theme));
const lastOpaqueFill = ref("#ffffff");

const resetDraft = () => {
  draft.value = cloneTheme(props.theme);
  const fill = draft.value.nodeStyle.fill;
  if (fill && fill !== "transparent") {
    lastOpaqueFill.value = fill;
  }
};

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) resetDraft();
  },
  { immediate: true },
);

const handleFillColorChange = (nextFill: string) => {
  if (nextFill && nextFill !== "transparent") {
    lastOpaqueFill.value = nextFill;
  }
};

const handleTransparentChange = (checked: boolean) => {
  if (checked) {
    const currentFill = draft.value.nodeStyle.fill;
    if (currentFill && currentFill !== "transparent") {
      lastOpaqueFill.value = currentFill;
    }
    draft.value.nodeStyle.fill = "transparent";
    return;
  }
  draft.value.nodeStyle.fill = lastOpaqueFill.value;
};

const confirm = () => {
  emit("confirm", cloneTheme(draft.value));
  emit("update:modelValue", false);
};
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="620px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="mode === 'nodeStyle'" class="node-theme-grid">
      <div class="node-theme-item">
        <span class="node-size-label">{{ t("flow.style.fill") }}</span>
        <div class="node-theme-inline">
          <el-color-picker
            v-model="draft.nodeStyle.fill"
            show-alpha
            @change="
              (value: unknown) => handleFillColorChange(String(value || ''))
            "
          />
          <el-checkbox
            :model-value="draft.nodeStyle.fill === 'transparent'"
            @change="
              (value: unknown) => handleTransparentChange(Boolean(value))
            "
          >
            {{ t("flow.style.transparent") }}
          </el-checkbox>
        </div>
      </div>
      <div class="node-theme-item">
        <span class="node-size-label">{{ t("flow.style.stroke") }}</span>
        <el-color-picker v-model="draft.nodeStyle.stroke" />
      </div>
      <div class="node-theme-item">
        <span class="node-size-label">{{ t("flow.style.stroke") }} px</span>
        <el-input-number
          v-model="draft.nodeStyle.strokeWidth"
          :min="0"
          :max="20"
          controls-position="right"
          size="small"
        />
      </div>
      <div class="node-theme-item">
        <span class="node-size-label">{{ t("flow.style.radius") }}</span>
        <el-input-number
          v-model="draft.nodeStyle.radius"
          :min="0"
          :max="200"
          controls-position="right"
          size="small"
        />
      </div>
      <div class="node-theme-item node-theme-item--full">
        <span class="node-size-label">{{ t("flow.style.opacity") }}</span>
        <el-slider
          v-model="draft.nodeStyle.opacity"
          :min="0"
          :max="1"
          :step="0.05"
          show-input
          :show-input-controls="false"
        />
      </div>
    </div>
    <div v-else class="node-theme-grid">
      <div class="node-theme-item">
        <span class="node-size-label">{{ t("assetPanel.nameVisible") }}</span>
        <el-switch v-model="draft.name.show" />
      </div>
      <div class="node-theme-item">
        <span class="node-size-label">{{ t("nodeSize.nameOffsetX") }}</span>
        <el-input-number
          v-model="draft.name.offsetX"
          :min="-600"
          :max="600"
          controls-position="right"
          size="small"
        />
      </div>
      <div class="node-theme-item">
        <span class="node-size-label">{{ t("nodeSize.nameOffsetY") }}</span>
        <el-input-number
          v-model="draft.name.offsetY"
          :min="-600"
          :max="600"
          controls-position="right"
          size="small"
        />
      </div>
      <div class="node-theme-item">
        <span class="node-size-label">{{ t("nodeSize.nameWidth") }}</span>
        <el-input-number
          v-model="draft.name.width"
          :min="40"
          :max="1200"
          controls-position="right"
          size="small"
        />
      </div>
      <div class="node-theme-item">
        <span class="node-size-label">{{ t("nodeSize.nameHeight") }}</span>
        <el-input-number
          v-model="draft.name.height"
          :min="20"
          :max="1200"
          controls-position="right"
          size="small"
        />
      </div>
      <div class="node-theme-item">
        <span class="node-size-label">{{ t("nodeSize.textColor") }}</span>
        <el-color-picker v-model="draft.name.textStyle.color" />
      </div>
      <div class="node-theme-item">
        <span class="node-size-label">{{ t("nodeSize.fontSize") }}</span>
        <el-input-number
          v-model="draft.name.textStyle.fontSize"
          :min="8"
          :max="96"
          controls-position="right"
          size="small"
        />
      </div>
      <div class="node-theme-item">
        <span class="node-size-label">{{ t("nodeSize.fontWeight") }}</span>
        <el-select v-model="draft.name.textStyle.fontWeight" size="small">
          <el-option :label="t('flow.style.weight.300')" :value="300" />
          <el-option :label="t('flow.style.weight.400')" :value="400" />
          <el-option :label="t('flow.style.weight.500')" :value="500" />
          <el-option :label="t('flow.style.weight.600')" :value="600" />
          <el-option :label="t('flow.style.weight.700')" :value="700" />
        </el-select>
      </div>
      <div class="node-theme-item">
        <span class="node-size-label">{{ t("nodeSize.lineHeight") }}</span>
        <el-input-number
          v-model="draft.name.textStyle.lineHeight"
          :min="0.8"
          :max="3"
          :step="0.1"
          controls-position="right"
          size="small"
        />
      </div>
      <div class="node-theme-item">
        <span class="node-size-label">{{ t("flow.style.textAlign") }}</span>
        <el-select v-model="draft.name.textStyle.align" size="small">
          <el-option :label="t('flow.style.align.left')" value="left" />
          <el-option :label="t('flow.style.align.center')" value="center" />
          <el-option :label="t('flow.style.align.right')" value="right" />
        </el-select>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="confirm">{{
          t("common.confirm")
        }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.node-theme-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}

.node-theme-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.node-theme-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-size-label {
  font-size: 13px;
  color: #303133;
}

.node-theme-item :deep(.el-select),
.node-theme-item :deep(.el-input-number),
.node-theme-item :deep(.el-slider) {
  flex: 1;
}

.node-theme-item--full {
  grid-column: 1 / -1;
}

@media (max-width: 900px) {
  .node-theme-grid {
    grid-template-columns: 1fr;
  }
}
</style>
