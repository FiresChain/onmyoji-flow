<script setup lang="ts">
type Translate = (key: string, values?: Record<string, unknown>) => string;

const props = withDefaults(
  defineProps<{
    open: boolean;
    content: string;
    translate?: Translate;
  }>(),
  {
    translate: (key: string) => key,
  },
);

const emit = defineEmits<{
  "update:open": [value: boolean];
  copy: [];
}>();

const t = (key: string, values?: Record<string, unknown>) =>
  props.translate(key, values);
</script>

<template>
  <el-dialog
    :model-value="open"
    :title="t('previewData')"
    width="70%"
    @update:model-value="emit('update:open', $event)"
  >
    <div style="max-height: 600px; overflow-y: auto">
      <pre
        style="
          background: #f5f5f5;
          padding: 16px;
          border-radius: 4px;
          font-size: 12px;
          line-height: 1.5;
        "
        >{{ content }}</pre
      >
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="emit('update:open', false)">
          {{ t("common.close") }}
        </el-button>
        <el-button type="primary" @click="emit('copy')">
          {{ t("copyClipboard") }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>
