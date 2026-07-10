<script setup lang="ts">
import type { GroupRuleWarning } from "@/features/group-rules/public";
import { useEditorI18n } from "@/editor/context/useEditorI18n";

defineProps<{
  open: boolean;
  warnings: GroupRuleWarning[];
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  locate: [warning: GroupRuleWarning];
}>();

const { t } = useEditorI18n();
</script>

<template>
  <div class="problems-dock" :class="{ 'problems-dock--open': open }">
    <div class="problems-dock-bar">
      <button
        class="problems-tab"
        type="button"
        @click="emit('update:open', !open)"
      >
        {{ t("flowEditor.problems.tab") }}
        <span class="problems-badge">{{ warnings.length }}</span>
      </button>
    </div>
    <div v-if="open" class="problems-panel">
      <div class="problems-header">
        <span>{{ t("flowEditor.problems.header") }}</span>
        <span>
          {{ t("flowEditor.problems.count", { count: warnings.length }) }}
        </span>
      </div>
      <div v-if="!warnings.length" class="problems-empty">
        {{ t("flowEditor.problems.empty") }}
      </div>
      <div v-else class="problems-list">
        <div
          v-for="(warning, index) in warnings"
          :key="warning.id || `${warning.groupId}-${warning.code}-${index}`"
          class="problem-item"
          role="button"
          tabindex="0"
          @click="emit('locate', warning)"
          @keydown.enter.prevent="emit('locate', warning)"
        >
          <div class="problem-severity">
            {{ warning.severity.toUpperCase() }}
          </div>
          <div class="problem-content">
            <div class="problem-message">{{ warning.message }}</div>
            <div class="problem-meta">
              {{ warning.groupName || warning.groupId }} · {{ warning.ruleId }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.problems-dock {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 11;
  pointer-events: none;
}

.problems-dock-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 10px;
  border-top: 1px solid #dcdfe6;
  background: rgba(250, 250, 250, 0.98);
  pointer-events: auto;
}

.problems-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 2px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  color: #303133;
  cursor: pointer;
  font-size: 12px;
}

.problems-tab:hover {
  background: #f5f7fa;
}

.problems-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 10px;
  background: #fde68a;
  box-sizing: border-box;
  color: #92400e;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
}

.problems-panel {
  display: flex;
  flex-direction: column;
  height: 220px;
  border-top: 1px solid #dcdfe6;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
  pointer-events: auto;
}

.problems-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 12px;
  border-bottom: 1px solid #ebeef5;
  color: #606266;
  font-size: 12px;
}

.problems-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #909399;
  font-size: 13px;
}

.problems-list {
  flex: 1;
  overflow-y: auto;
}

.problem-item {
  display: flex;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid #f2f3f5;
  cursor: pointer;
}

.problem-item:hover {
  background: #f8fafc;
}

.problem-item:focus {
  outline: none;
  background: #eff6ff;
  box-shadow: inset 0 0 0 1px #93c5fd;
}

.problem-severity {
  flex-shrink: 0;
  width: 56px;
  height: 20px;
  border: 1px solid #fed7aa;
  border-radius: 10px;
  background: #fff7ed;
  color: #9a3412;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}

.problem-content {
  min-width: 0;
}

.problem-message {
  color: #303133;
  font-size: 13px;
  line-height: 1.4;
}

.problem-meta {
  margin-top: 2px;
  color: #909399;
  font-size: 12px;
  line-height: 1.3;
  word-break: break-all;
}
</style>
