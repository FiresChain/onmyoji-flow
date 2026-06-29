<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { getLogicFlowInstance, useLogicFlowScope } from "@/ts/useLogicFlow";
import {
  createDefaultTeamCodeConfig,
  GROUP_META_VERSION,
  normalizeDynamicGroupMeta,
  type TeamCodePreferred,
} from "@/utils/graphSchema";

const props = defineProps<{
  node: any;
}>();
const logicFlowScope = useLogicFlowScope();

type DynamicGroupMeta = {
  groupKind: "team" | "shikigami";
  ruleEnabled: boolean;
  teamCode: {
    enabled: boolean;
    shortCode: string;
    longCode: string;
    preferred: TeamCodePreferred;
    label: string;
  };
};

const form = reactive<DynamicGroupMeta>({
  groupKind: "team",
  ruleEnabled: true,
  teamCode: createDefaultTeamCodeConfig(),
});

const syncFromNode = (node?: any) => {
  if (!node) return;
  const groupMeta = normalizeDynamicGroupMeta(node.properties?.groupMeta);
  form.groupKind = groupMeta.groupKind;
  form.ruleEnabled = groupMeta.ruleEnabled;
  Object.assign(
    form.teamCode,
    groupMeta.teamCode || createDefaultTeamCodeConfig(),
  );
};

const isTeamGroup = computed(() => form.groupKind === "team");

watch(
  () => props.node,
  (node) => {
    if (node) {
      syncFromNode(node);
    }
  },
  { immediate: true, deep: true },
);

const applyGroupMeta = () => {
  const lf = getLogicFlowInstance(logicFlowScope);
  const node = props.node;
  if (!lf || !node) return;
  const currentGroupMeta = normalizeDynamicGroupMeta(
    node.properties?.groupMeta,
  );
  const nextGroupMeta: Record<string, any> = {
    ...currentGroupMeta,
    version: GROUP_META_VERSION,
    groupKind: form.groupKind,
    ruleEnabled: form.ruleEnabled,
  };

  if (form.groupKind === "team") {
    nextGroupMeta.teamCode = {
      enabled: form.teamCode.enabled,
      shortCode: form.teamCode.shortCode.trim(),
      longCode: form.teamCode.longCode.trim(),
      preferred: form.teamCode.preferred,
      label: form.teamCode.label.trim(),
    };
  } else {
    delete nextGroupMeta.teamCode;
  }

  lf.setProperties(node.id, {
    ...(node.properties || {}),
    groupMeta: nextGroupMeta,
  });
};
</script>

<template>
  <div class="property-section">
    <div class="section-header">分组规则属性</div>

    <div class="property-item">
      <div class="property-label">分组类型</div>
      <el-select
        v-model="form.groupKind"
        style="width: 100%"
        @change="applyGroupMeta"
      >
        <el-option label="队伍组（team）" value="team" />
        <el-option label="式神组（shikigami）" value="shikigami" />
      </el-select>
    </div>

    <div class="property-item">
      <div class="property-label">启用规则检查</div>
      <el-switch v-model="form.ruleEnabled" @change="applyGroupMeta" />
    </div>

    <template v-if="isTeamGroup">
      <div class="section-header">阵容码复制</div>

      <div class="property-item">
        <div class="property-label">启用复制</div>
        <el-switch v-model="form.teamCode.enabled" @change="applyGroupMeta" />
      </div>

      <div class="property-item">
        <div class="property-label">优先复制</div>
        <el-radio-group
          v-model="form.teamCode.preferred"
          @change="applyGroupMeta"
        >
          <el-radio-button label="long">长码</el-radio-button>
          <el-radio-button label="short">短码</el-radio-button>
        </el-radio-group>
      </div>

      <div class="property-item">
        <div class="property-label">长码</div>
        <el-input
          v-model="form.teamCode.longCode"
          type="textarea"
          :rows="3"
          placeholder="长期可用的完整阵容码"
          @blur="applyGroupMeta"
        />
      </div>

      <div class="property-item">
        <div class="property-label">短码</div>
        <el-input
          v-model="form.teamCode.shortCode"
          placeholder="短期有效的官方短码"
          @blur="applyGroupMeta"
        />
      </div>

      <div class="property-item">
        <div class="property-label">按钮文案</div>
        <el-input
          v-model="form.teamCode.label"
          placeholder="默认：复制阵容码"
          @blur="applyGroupMeta"
        />
      </div>
    </template>
  </div>
</template>

<style scoped></style>
