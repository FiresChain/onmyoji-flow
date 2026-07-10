<template>
  <el-dialog
    :model-value="props.modelValue"
    data-dialog="rule-manager"
    :title="t('ruleManager')"
    width="80%"
    @update:model-value="updateVisibility"
  >
    <div class="rule-manager-actions">
      <el-button
        data-action="add-rule"
        size="small"
        type="primary"
        @click="emit('add-rule')"
      >
        {{ t("ruleManager.addRule") }}
      </el-button>
      <el-button
        data-action="add-variable"
        size="small"
        type="primary"
        plain
        @click="emit('add-variable')"
      >
        {{ t("ruleManager.addVariable") }}
      </el-button>
      <el-button
        data-action="export-bundle"
        size="small"
        @click="emit('export-bundle')"
      >
        {{ t("ruleManager.exportBundle") }}
      </el-button>
      <el-button
        data-action="import-bundle"
        size="small"
        @click="triggerRuleBundleImport"
      >
        {{ t("ruleManager.importBundle") }}
      </el-button>
      <el-button data-action="reload" size="small" @click="emit('reload')">
        {{ t("ruleManager.reload") }}
      </el-button>
      <el-button
        data-action="apply"
        size="small"
        type="success"
        @click="emit('apply')"
      >
        {{ t("ruleManager.apply") }}
      </el-button>
      <el-button
        data-action="restore-default"
        size="small"
        type="warning"
        plain
        @click="emit('restore-default')"
      >
        {{ t("ruleManager.restoreDefault") }}
      </el-button>
      <input
        ref="ruleBundleImportInputRef"
        data-input="rule-bundle"
        type="file"
        accept=".json,application/json"
        class="asset-upload-input"
        @change="emit('import-bundle', $event)"
      />
    </div>

    <el-tabs
      :model-value="props.tab"
      class="rule-manager-tabs"
      @update:model-value="updateTab"
    >
      <el-tab-pane :label="t('ruleManager.tab.rules')" name="rules">
        <div class="rule-table-wrap">
          <el-table
            v-if="props.config.expressionRules.length > 0"
            :data="props.config.expressionRules"
            size="small"
            border
            class="rule-table"
          >
            <el-table-column
              :label="t('ruleManager.column.enabled')"
              width="70"
              align="center"
            >
              <template #default="{ row, $index }">
                <el-checkbox
                  :model-value="row.enabled"
                  @update:model-value="
                    (value) =>
                      updateExpressionRule($index, {
                        enabled: Boolean(value),
                      })
                  "
                />
              </template>
            </el-table-column>
            <el-table-column
              :label="t('ruleManager.column.severity')"
              width="110"
              align="center"
            >
              <template #default="{ row, $index }">
                <el-select
                  :model-value="row.severity"
                  size="small"
                  :class="[
                    'rule-inline-select',
                    'severity-select',
                    `severity-select--${row.severity || 'warning'}`,
                  ]"
                  @update:model-value="
                    (value) => updateRuleSeverity($index, value)
                  "
                >
                  <el-option
                    :label="t('ruleSeverity.warning')"
                    value="warning"
                  />
                  <el-option :label="t('ruleSeverity.error')" value="error" />
                  <el-option :label="t('ruleSeverity.info')" value="info" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column
              :label="t('ruleManager.column.scope')"
              width="130"
              align="center"
            >
              <template #default="{ row, $index }">
                <el-select
                  :model-value="row.scopeKind"
                  size="small"
                  class="rule-inline-select"
                  @update:model-value="
                    (value) => updateRuleScope($index, value)
                  "
                >
                  <el-option :label="t('ruleScope.team')" value="team" />
                  <el-option
                    :label="t('ruleScope.shikigami')"
                    value="shikigami"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column
              prop="id"
              :label="t('ruleManager.column.id')"
              min-width="180"
              show-overflow-tooltip
            />
            <el-table-column
              :label="t('ruleManager.column.condition')"
              min-width="260"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <span class="rule-cell-ellipsis">{{ row.condition }}</span>
              </template>
            </el-table-column>
            <el-table-column
              :label="t('ruleManager.column.message')"
              min-width="180"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <span class="rule-cell-ellipsis">{{ row.message }}</span>
              </template>
            </el-table-column>
            <el-table-column
              :label="t('ruleManager.column.actions')"
              width="140"
              fixed="right"
            >
              <template #default="{ $index }">
                <el-button
                  size="small"
                  text
                  type="primary"
                  @click="emit('edit-rule', $index)"
                >
                  {{ t("common.edit") }}
                </el-button>
                <el-button
                  size="small"
                  text
                  type="danger"
                  @click="emit('remove-rule', $index)"
                >
                  {{ t("common.delete") }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else :description="t('ruleManager.emptyRules')" />
        </div>
      </el-tab-pane>

      <el-tab-pane :label="t('ruleManager.tab.variables')" name="variables">
        <div class="variable-list">
          <div
            v-for="(item, index) in props.config.ruleVariables"
            :key="`${item.key}-${index}`"
            class="variable-item"
          >
            <el-form-item
              :label="t('ruleManager.variable.key')"
              class="variable-key"
            >
              <el-input
                :model-value="item.key"
                :placeholder="t('ruleManager.variable.keyPlaceholder')"
                @update:model-value="
                  (value) => updateRuleVariable(index, 'key', value)
                "
              />
            </el-form-item>
            <el-form-item
              :label="t('ruleManager.variable.value')"
              class="variable-value"
            >
              <el-input
                :model-value="item.value"
                type="textarea"
                :rows="2"
                :placeholder="t('ruleManager.variable.valuePlaceholder')"
                @update:model-value="
                  (value) => updateRuleVariable(index, 'value', value)
                "
              />
            </el-form-item>
            <el-button
              size="small"
              text
              type="danger"
              @click="emit('remove-variable', index)"
            >
              {{ t("common.delete") }}
            </el-button>
          </div>
          <el-empty
            v-if="props.config.ruleVariables.length === 0"
            :description="t('ruleManager.emptyVariables')"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane :label="t('ruleManager.tab.docs')" name="docs">
        <div class="rule-docs">
          <h4>{{ t("ruleManager.docs.scope") }}</h4>
          <pre>{{ props.ruleScopeDoc }}</pre>
          <h4>{{ t("ruleManager.docs.context") }}</h4>
          <pre>{{ props.ruleContextDoc }}</pre>
          <h4>{{ t("ruleManager.docs.syntax") }}</h4>
          <pre>{{ props.ruleSyntaxDoc }}</pre>
          <h4>{{ t("ruleManager.docs.functions") }}</h4>
          <pre>{{ props.ruleFunctionDoc }}</pre>
          <h4>{{ t("ruleManager.docs.examples") }}</h4>
          <pre>{{ props.ruleExamplesDoc }}</pre>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";

import type {
  ExpressionRuleDefinition,
  GroupRulesConfig,
  RuleVariableDefinition,
} from "../model/types";

type RuleManagerTab = "rules" | "variables" | "docs";
type Translate = (key: string, values?: Record<string, unknown>) => string;

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    tab: RuleManagerTab;
    config: GroupRulesConfig;
    ruleScopeDoc: string;
    ruleContextDoc: string;
    ruleSyntaxDoc: string;
    ruleFunctionDoc: string;
    ruleExamplesDoc: string;
    translate?: Translate;
  }>(),
  {
    translate: (key: string) => key,
  },
);

const emit = defineEmits<{
  "update:modelValue": [visible: boolean];
  "update:tab": [tab: RuleManagerTab];
  "update:config": [config: GroupRulesConfig];
  "add-rule": [];
  "add-variable": [];
  "export-bundle": [];
  "import-bundle": [event: Event];
  reload: [];
  apply: [];
  "restore-default": [];
  "edit-rule": [index: number];
  "remove-rule": [index: number];
  "remove-variable": [index: number];
}>();

const ruleBundleImportInputRef = ref<HTMLInputElement | null>(null);
const t = (key: string, values?: Record<string, unknown>) =>
  props.translate(key, values);

const updateVisibility = (value: unknown) => {
  emit("update:modelValue", Boolean(value));
};

const updateTab = (value: unknown) => {
  if (value === "rules" || value === "variables" || value === "docs") {
    emit("update:tab", value);
  }
};

const updateExpressionRule = (
  index: number,
  patch: Partial<ExpressionRuleDefinition>,
) => {
  emit("update:config", {
    ...props.config,
    expressionRules: props.config.expressionRules.map((rule, ruleIndex) =>
      ruleIndex === index ? { ...rule, ...patch } : rule,
    ),
  });
};

const updateRuleSeverity = (index: number, value: unknown) => {
  if (value === "warning" || value === "error" || value === "info") {
    updateExpressionRule(index, { severity: value });
  }
};

const updateRuleScope = (index: number, value: unknown) => {
  if (value === "team" || value === "shikigami") {
    updateExpressionRule(index, { scopeKind: value });
  }
};

const updateRuleVariable = (
  index: number,
  key: keyof RuleVariableDefinition,
  value: unknown,
) => {
  emit("update:config", {
    ...props.config,
    ruleVariables: props.config.ruleVariables.map((variable, variableIndex) =>
      variableIndex === index
        ? { ...variable, [key]: typeof value === "string" ? value : "" }
        : variable,
    ),
  });
};

const triggerRuleBundleImport = () => {
  ruleBundleImportInputRef.value?.click();
};
</script>

<style scoped>
.rule-manager-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.asset-upload-input {
  display: none;
}

.rule-manager-tabs {
  min-height: 420px;
}

.rule-table-wrap,
.variable-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.variable-item {
  display: grid;
  grid-template-columns: 220px 1fr auto;
  gap: 12px;
  align-items: start;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  background: #fafafa;
}

.rule-table :deep(.el-table__cell) {
  padding-top: 6px;
  padding-bottom: 6px;
}

.rule-inline-select {
  width: 100%;
}

.severity-select--warning :deep(.el-input__wrapper) {
  background: #fff7ed;
  box-shadow: inset 0 0 0 1px #fed7aa;
}

.severity-select--warning :deep(.el-input__inner) {
  color: #9a3412;
}

.severity-select--error :deep(.el-input__wrapper) {
  background: #fef2f2;
  box-shadow: inset 0 0 0 1px #fecaca;
}

.severity-select--error :deep(.el-input__inner) {
  color: #b91c1c;
}

.severity-select--info :deep(.el-input__wrapper) {
  background: #eff6ff;
  box-shadow: inset 0 0 0 1px #bfdbfe;
}

.severity-select--info :deep(.el-input__inner) {
  color: #1d4ed8;
}

.rule-cell-ellipsis {
  display: inline-block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.variable-key,
.variable-value {
  margin-bottom: 0;
}

.rule-docs {
  max-height: 460px;
  overflow-y: auto;
  padding-right: 4px;
}

.rule-docs h4 {
  margin: 6px 0;
  color: #303133;
}

.rule-docs pre {
  margin: 0 0 12px;
  padding: 10px;
  border-radius: 6px;
  background: #f5f7fa;
  color: #606266;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 900px) {
  .variable-item {
    grid-template-columns: 1fr;
  }
}
</style>
