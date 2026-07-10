<script setup lang="ts">
import type { AlignType, DistributeType } from "@/editor/commands/arrange";
import { useEditorI18n } from "@/editor/context/useEditorI18n";

defineProps<{
  collapsed: boolean;
  toggleLabel: string;
  selectionEnabled: boolean;
  snapGridEnabled: boolean;
  snaplineEnabled: boolean;
  selectedCount: number;
  alignmentButtons: ReadonlyArray<{ key: AlignType; labelKey: string }>;
  distributeButtons: ReadonlyArray<{
    key: DistributeType;
    labelKey: string;
  }>;
}>();

const emit = defineEmits<{
  "update:collapsed": [value: boolean];
  "update:selectionEnabled": [value: boolean];
  "update:snapGridEnabled": [value: boolean];
  "update:snaplineEnabled": [value: boolean];
  showAll: [];
  align: [direction: AlignType];
  distribute: [direction: DistributeType];
}>();

const { t } = useEditorI18n();
</script>

<template>
  <div class="flow-controls" :class="{ 'flow-controls--collapsed': collapsed }">
    <div class="control-row control-header">
      <button
        class="control-button"
        type="button"
        @click="emit('update:collapsed', !collapsed)"
      >
        {{ toggleLabel }}
      </button>
    </div>
    <template v-if="!collapsed">
      <div class="control-row toggles">
        <label class="control-toggle">
          <input
            type="checkbox"
            :checked="selectionEnabled"
            @change="
              emit(
                'update:selectionEnabled',
                ($event.target as HTMLInputElement).checked,
              )
            "
          />
          <span>{{ t("flowEditor.controls.selection") }}</span>
        </label>
        <label class="control-toggle">
          <input
            type="checkbox"
            :checked="snapGridEnabled"
            @change="
              emit(
                'update:snapGridEnabled',
                ($event.target as HTMLInputElement).checked,
              )
            "
          />
          <span>{{ t("flowEditor.controls.snapGrid") }}</span>
        </label>
        <label class="control-toggle">
          <input
            type="checkbox"
            :checked="snaplineEnabled"
            @change="
              emit(
                'update:snaplineEnabled',
                ($event.target as HTMLInputElement).checked,
              )
            "
          />
          <span>{{ t("flowEditor.controls.snapline") }}</span>
        </label>
        <span class="control-hint">
          {{ t("flowEditor.controls.selectedCount", { count: selectedCount }) }}
        </span>
        <button class="control-button" type="button" @click="emit('showAll')">
          {{ t("flowEditor.controls.showAll") }}
        </button>
      </div>
      <div class="control-row">
        <div class="control-label">{{ t("flowEditor.controls.align") }}</div>
        <div class="control-buttons">
          <button
            v-for="button in alignmentButtons"
            :key="button.key"
            class="control-button"
            type="button"
            :disabled="selectedCount < 2"
            @click="emit('align', button.key)"
          >
            {{ t(button.labelKey) }}
          </button>
        </div>
      </div>
      <div class="control-row">
        <div class="control-label">
          {{ t("flowEditor.controls.distribute") }}
        </div>
        <div class="control-buttons">
          <button
            v-for="button in distributeButtons"
            :key="button.key"
            class="control-button"
            type="button"
            :disabled="selectedCount < 3"
            @click="emit('distribute', button.key)"
          >
            {{ t(button.labelKey) }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.flow-controls {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  max-width: 460px;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  font-size: 12px;
}

.flow-controls--collapsed {
  max-width: 220px;
  padding: 6px;
}

.control-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.control-header,
.control-row:last-child {
  margin-bottom: 0;
}

.control-label {
  color: #303133;
  font-weight: 600;
}

.control-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.control-button {
  padding: 4px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  color: #303133;
  cursor: pointer;
  font-size: 12px;
}

.control-button:hover:enabled {
  background: #f5f7fa;
}

.control-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.control-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
}

.control-hint {
  color: #909399;
}
</style>
