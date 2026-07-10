<script setup lang="ts">
import { ref } from "vue";

type Translate = (key: string, values?: Record<string, unknown>) => string;

const props = withDefaults(
  defineProps<{
    open: boolean;
    source: "json" | "teamCode";
    teamCode: string;
    validationEnabled: boolean;
    importingTeamCode: boolean;
    decodingTeamCodeQr: boolean;
    translate?: Translate;
  }>(),
  {
    translate: (key: string) => key,
  },
);

const emit = defineEmits<{
  "update:open": [value: boolean];
  "update:source": [value: "json" | "teamCode"];
  "update:teamCode": [value: string];
  "update:validationEnabled": [value: boolean];
  chooseJson: [];
  importTeamCode: [];
  importTeamCodeQr: [event: Event];
}>();

const t = (key: string, values?: Record<string, unknown>) =>
  props.translate(key, values);
const qrInputRef = ref<HTMLInputElement | null>(null);
</script>

<template>
  <el-dialog
    :model-value="open"
    title="导入数据"
    width="560px"
    @update:model-value="emit('update:open', $event)"
  >
    <el-form label-width="88px" class="import-form">
      <el-form-item :label="t('importDialog.source')">
        <el-radio-group
          :model-value="source"
          @update:model-value="emit('update:source', $event)"
        >
          <el-radio-button label="json">
            {{ t("importDialog.source.json") }}
          </el-radio-button>
          <el-radio-button label="teamCode">
            {{ t("importDialog.source.teamCode") }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="source === 'teamCode'"
        :label="t('importDialog.teamCode')"
      >
        <el-input
          :model-value="teamCode"
          type="textarea"
          :rows="7"
          :placeholder="t('importDialog.teamCodePlaceholder')"
          @update:model-value="emit('update:teamCode', $event)"
        />
      </el-form-item>
      <el-form-item
        v-if="source === 'teamCode'"
        :label="t('importDialog.validation')"
      >
        <el-checkbox
          :model-value="validationEnabled"
          @update:model-value="emit('update:validationEnabled', $event)"
        >
          {{ t("importDialog.formationValidation") }}
        </el-checkbox>
      </el-form-item>
      <el-form-item v-if="source === 'teamCode'" :label="t('importDialog.qr')">
        <div class="team-code-qr-actions">
          <input
            ref="qrInputRef"
            type="file"
            accept="image/*"
            class="asset-upload-input"
            @change="emit('importTeamCodeQr', $event)"
          />
          <el-button
            type="primary"
            plain
            :loading="decodingTeamCodeQr"
            @click="qrInputRef?.click()"
          >
            {{ t("importDialog.qrChoose") }}
          </el-button>
          <span class="team-code-qr-tip">{{ t("importDialog.qrTip") }}</span>
        </div>
      </el-form-item>
      <el-alert
        v-if="source === 'teamCode'"
        type="info"
        :closable="false"
        show-icon
        :title="t('importDialog.alert')"
      />
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="emit('update:open', false)">
          {{ t("common.cancel") }}
        </el-button>
        <el-button
          v-if="source === 'json'"
          type="primary"
          @click="emit('chooseJson')"
        >
          {{ t("importDialog.chooseJson") }}
        </el-button>
        <el-button
          v-else
          type="primary"
          :loading="importingTeamCode"
          @click="emit('importTeamCode')"
        >
          {{ t("importDialog.importTeamCode") }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.team-code-qr-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.team-code-qr-tip {
  color: #909399;
  font-size: 12px;
}

.asset-upload-input {
  display: none;
}
</style>
