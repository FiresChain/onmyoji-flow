<template>
  <RuleManagerDialog
    :model-value="state.showRuleManagerDialog"
    :tab="ruleManagerTab"
    :config="ruleConfigDraft"
    :rule-scope-doc="ruleScopeDoc"
    :rule-context-doc="ruleContextDoc"
    :rule-syntax-doc="ruleSyntaxDoc"
    :rule-function-doc="ruleFunctionDoc"
    :rule-examples-doc="ruleExamplesDoc"
    :translate="props.translate"
    @update:model-value="updateRuleManagerVisibility"
    @update:tab="updateRuleManagerTab"
    @update:config="updateRuleConfigDraft"
    @add-rule="addExpressionRule"
    @add-variable="addRuleVariable"
    @export-bundle="exportRuleBundle"
    @import-bundle="handleRuleBundleImport"
    @reload="reloadRuleManagerDraft"
    @apply="applyRuleManagerConfig"
    @restore-default="restoreDefaultRuleConfig"
    @edit-rule="openExpressionRuleEditor"
    @remove-rule="removeExpressionRule"
    @remove-variable="removeRuleVariable"
  />

  <RuleEditorDialog
    :model-value="ruleEditorVisible"
    :draft="ruleEditorDraft"
    :translate="props.translate"
    @update:model-value="updateRuleEditorVisibility"
    @update:draft="updateRuleEditorDraft"
    @cancel="cancelRuleEditor"
    @save="saveRuleEditor"
  />
</template>

<script setup lang="ts">
import { reactive } from "vue";

import type {
  ExpressionRuleDefinition,
  GroupRulesConfig,
} from "../model/types";
import RuleEditorDialog from "./RuleEditorDialog.vue";
import RuleManagerDialog from "./RuleManagerDialog.vue";
import { useRuleManager } from "./useRuleManager";
import type { GroupRuleDialogHostExpose } from "./types";

type MessageType = "success" | "warning" | "info" | "error";
type ShowMessage = (type: MessageType, message: string) => void;
type Translate = (key: string, values?: Record<string, unknown>) => string;
type RuleManagerTab = "rules" | "variables" | "docs";

const props = withDefaults(
  defineProps<{
    showMessage?: ShowMessage;
    translate?: Translate;
  }>(),
  {
    showMessage: () => {},
    translate: (key: string) => key,
  },
);

const state = reactive({
  showRuleManagerDialog: false,
});

const {
  ruleManagerTab,
  ruleConfigDraft,
  ruleEditorVisible,
  ruleEditorDraft,
  ruleScopeDoc,
  ruleContextDoc,
  ruleSyntaxDoc,
  ruleFunctionDoc,
  ruleExamplesDoc,
  openRuleManager,
  addExpressionRule,
  addRuleVariable,
  exportRuleBundle,
  reloadRuleManagerDraft,
  applyRuleManagerConfig,
  restoreDefaultRuleConfig,
  handleRuleBundleImport,
  openExpressionRuleEditor,
  removeExpressionRule,
  removeRuleVariable,
  cancelRuleEditor,
  saveRuleEditor,
} = useRuleManager({
  state,
  showMessage: props.showMessage,
});

const updateRuleManagerVisibility = (visible: boolean) => {
  state.showRuleManagerDialog = visible;
};

const updateRuleManagerTab = (tab: RuleManagerTab) => {
  ruleManagerTab.value = tab;
};

const updateRuleConfigDraft = (config: GroupRulesConfig) => {
  ruleConfigDraft.value = config;
};

const updateRuleEditorVisibility = (visible: boolean) => {
  if (!visible) {
    cancelRuleEditor();
    return;
  }
  ruleEditorVisible.value = true;
};

const updateRuleEditorDraft = (draft: ExpressionRuleDefinition) => {
  ruleEditorDraft.value = draft;
};

defineExpose<GroupRuleDialogHostExpose>({
  openRuleManager,
});
</script>
