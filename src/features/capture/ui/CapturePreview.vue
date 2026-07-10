<script setup lang="ts">
type Translate = (key: string, values?: Record<string, unknown>) => string;

const props = withDefaults(
  defineProps<{
    open: boolean;
    image: string | null;
    translate?: Translate;
  }>(),
  {
    translate: (key: string) => key,
  },
);

const emit = defineEmits<{
  "update:open": [value: boolean];
  close: [];
  download: [];
}>();

const t = (key: string, values?: Record<string, unknown>) =>
  props.translate(key, values);

const handleBeforeClose = (done: () => void) => {
  emit("close");
  done();
};
</script>

<template>
  <el-dialog
    id="preview-container"
    :model-value="open"
    width="80%"
    height="80%"
    :before-close="handleBeforeClose"
    @update:model-value="emit('update:open', $event)"
  >
    <div style="max-height: 500px; overflow-y: auto">
      <img
        v-if="image"
        :src="image"
        :alt="t('preview.alt')"
        style="width: 100%; display: block"
      />
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="emit('update:open', false)">
          {{ t("common.cancel") }}
        </el-button>
        <el-button type="primary" @click="emit('download')">
          {{ t("common.download") }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>
