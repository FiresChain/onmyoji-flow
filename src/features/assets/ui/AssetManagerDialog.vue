<script setup lang="ts">
import { ref } from "vue";

import type { CustomAssetItem } from "../customAssetsRepository";

type Translate = (key: string, values?: unknown) => string;

interface AssetManagerLibraryOption {
  id: string;
  label: string;
}

const props = defineProps<{
  modelValue: boolean;
  library: string;
  libraries: AssetManagerLibraryOption[];
  assets: Record<string, CustomAssetItem[]>;
  resolveAssetUrl: (value: unknown) => unknown;
  t: Translate;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:library": [value: string];
  upload: [file: File, complete: () => void];
  remove: [libraryId: string, item: CustomAssetItem];
}>();

const uploadInputRef = ref<HTMLInputElement | null>(null);

const triggerUpload = () => {
  uploadInputRef.value?.click();
};

const handleUpload = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  const file = target?.files?.[0];
  const complete = () => {
    if (target) target.value = "";
  };
  if (!file) {
    complete();
    return;
  }
  emit("upload", file, complete);
};

const getAssets = (libraryId: string) => props.assets[libraryId] ?? [];
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="t('assetManager')"
    width="70%"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="asset-manager-actions">
      <input
        ref="uploadInputRef"
        type="file"
        accept="image/*"
        class="asset-upload-input"
        @change="handleUpload"
      />
      <el-button size="small" type="primary" @click="triggerUpload">
        {{ t("assetManager.uploadCurrent") }}
      </el-button>
    </div>

    <el-tabs
      :model-value="library"
      class="asset-manager-tabs"
      @update:model-value="emit('update:library', String($event))"
    >
      <el-tab-pane
        v-for="option in libraries"
        :key="option.id"
        :label="option.label"
        :name="option.id"
      >
        <div class="asset-manager-grid">
          <div
            v-for="item in getAssets(option.id)"
            :key="item.id || `${item.name}-${item.avatar}`"
            class="asset-manager-item"
          >
            <div
              class="asset-manager-image"
              :style="{
                backgroundImage: `url('${resolveAssetUrl(item.avatar)}')`,
              }"
            />
            <div class="asset-manager-name">{{ item.name }}</div>
            <el-button
              size="small"
              text
              type="danger"
              @click="emit('remove', option.id, item)"
            >
              {{ t("common.delete") }}
            </el-button>
          </div>
        </div>
        <el-empty
          v-if="getAssets(option.id).length === 0"
          :description="t('assetManager.empty', { label: option.label })"
        />
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<style scoped>
.asset-manager-actions {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.asset-upload-input {
  display: none;
}

.asset-manager-tabs {
  min-height: 360px;
}

.asset-manager-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.asset-manager-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.asset-manager-image {
  width: 80px;
  height: 80px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.asset-manager-name {
  width: 100%;
  text-align: center;
  font-size: 12px;
  color: #303133;
  word-break: break-all;
}
</style>
