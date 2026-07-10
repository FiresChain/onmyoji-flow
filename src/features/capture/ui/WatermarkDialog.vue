<script setup lang="ts">
import type { WatermarkSettings } from "../model/types";

type Translate = (key: string, values?: Record<string, unknown>) => string;

const props = withDefaults(
  defineProps<{
    open: boolean;
    settings: WatermarkSettings;
    translate?: Translate;
  }>(),
  {
    translate: (key: string) => key,
  },
);

const emit = defineEmits<{
  "update:open": [value: boolean];
  apply: [];
}>();

const t = (key: string, values?: Record<string, unknown>) =>
  props.translate(key, values);
</script>

<template>
  <el-dialog
    :model-value="open"
    :title="t('setWatermark')"
    width="30%"
    @update:model-value="emit('update:open', $event)"
  >
    <el-form>
      <el-form-item :label="t('watermark.text')">
        <el-input v-model="settings.text" />
      </el-form-item>
      <el-form-item :label="t('watermark.fontSize')">
        <el-input-number v-model="settings.fontSize" :min="10" :max="100" />
      </el-form-item>
      <el-form-item :label="t('watermark.color')">
        <el-color-picker v-model="settings.color" />
      </el-form-item>
      <el-form-item :label="t('watermark.rows')">
        <el-input-number v-model="settings.rows" :min="1" :max="10" />
      </el-form-item>
      <el-form-item :label="t('watermark.cols')">
        <el-input-number v-model="settings.cols" :min="1" :max="10" />
      </el-form-item>
      <el-form-item :label="t('watermark.angle')">
        <el-input-number v-model="settings.angle" :min="-90" :max="90" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="emit('update:open', false)">
          {{ t("common.cancel") }}
        </el-button>
        <el-button type="primary" @click="emit('apply')">
          {{ t("common.confirm") }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>
