<template>
  <el-dialog
    :model-value="props.modelValue"
    data-dialog="rule-editor"
    :title="t('ruleEditor.title')"
    width="56%"
    @update:model-value="updateVisibility"
  >
    <el-form v-if="props.draft" label-width="96px" class="rule-editor-form">
      <el-form-item :label="t('ruleEditor.enabled')">
        <el-switch
          data-field="enabled"
          :model-value="props.draft.enabled"
          @update:model-value="updateEnabled"
        />
      </el-form-item>
      <el-form-item :label="t('ruleEditor.id')">
        <el-input
          data-field="id"
          :model-value="props.draft.id"
          :placeholder="t('ruleEditor.idPlaceholder')"
          @update:model-value="(value) => updateText('id', value)"
        />
      </el-form-item>
      <el-form-item :label="t('ruleEditor.severity')">
        <el-select
          data-field="severity"
          :model-value="props.draft.severity"
          :class="[
            'severity-select',
            `severity-select--${props.draft.severity || 'warning'}`,
          ]"
          style="width: 100%"
          @update:model-value="updateSeverity"
        >
          <el-option :label="t('ruleSeverity.warning')" value="warning" />
          <el-option :label="t('ruleSeverity.error')" value="error" />
          <el-option :label="t('ruleSeverity.info')" value="info" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('ruleEditor.scope')">
        <el-select
          data-field="scope"
          :model-value="props.draft.scopeKind"
          style="width: 100%"
          @update:model-value="updateScope"
        >
          <el-option :label="t('ruleScope.team')" value="team" />
          <el-option :label="t('ruleScope.shikigami')" value="shikigami" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('ruleEditor.code')">
        <el-input
          data-field="code"
          :model-value="props.draft.code"
          :placeholder="t('ruleEditor.codePlaceholder')"
          @update:model-value="(value) => updateText('code', value)"
        />
      </el-form-item>
      <el-form-item :label="t('ruleEditor.condition')">
        <el-input
          data-field="condition"
          :model-value="props.draft.condition"
          type="textarea"
          :rows="3"
          :placeholder="t('ruleEditor.conditionPlaceholder')"
          @update:model-value="(value) => updateText('condition', value)"
        />
      </el-form-item>
      <el-form-item :label="t('ruleEditor.message')">
        <el-input
          data-field="message"
          :model-value="props.draft.message"
          :placeholder="t('ruleEditor.messagePlaceholder')"
          @update:model-value="(value) => updateText('message', value)"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button data-action="cancel" @click="emit('cancel')">
          {{ t("common.cancel") }}
        </el-button>
        <el-button data-action="save" type="primary" @click="emit('save')">
          {{ t("common.save") }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { ExpressionRuleDefinition } from "../model/types";

type Translate = (key: string, values?: Record<string, unknown>) => string;
type TextField = "id" | "code" | "condition" | "message";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    draft: ExpressionRuleDefinition | null;
    translate?: Translate;
  }>(),
  {
    translate: (key: string) => key,
  },
);

const emit = defineEmits<{
  "update:modelValue": [visible: boolean];
  "update:draft": [draft: ExpressionRuleDefinition];
  cancel: [];
  save: [];
}>();

const t = (key: string, values?: Record<string, unknown>) =>
  props.translate(key, values);

const patchDraft = (patch: Partial<ExpressionRuleDefinition>) => {
  if (!props.draft) return;
  emit("update:draft", { ...props.draft, ...patch });
};

const updateVisibility = (value: unknown) => {
  emit("update:modelValue", Boolean(value));
};

const updateEnabled = (value: unknown) => {
  patchDraft({ enabled: Boolean(value) });
};

const updateText = (field: TextField, value: unknown) => {
  patchDraft({ [field]: typeof value === "string" ? value : "" });
};

const updateSeverity = (value: unknown) => {
  if (value === "warning" || value === "error" || value === "info") {
    patchDraft({ severity: value });
  }
};

const updateScope = (value: unknown) => {
  if (value === "team" || value === "shikigami") {
    patchDraft({ scopeKind: value });
  }
};
</script>

<style scoped>
.rule-editor-form :deep(.el-form-item) {
  margin-bottom: 14px;
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
</style>
