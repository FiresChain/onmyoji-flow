<script setup lang="ts">
import { reactive, ref } from "vue";

import { downloadDataUrl } from "@/shared/platform/download";

import { addWatermarkToImage } from "../captureCanvas";
import {
  readWatermarkSettings,
  writeWatermarkSettings,
} from "../watermarkRepository";
import CapturePreview from "./CapturePreview.vue";
import WatermarkDialog from "./WatermarkDialog.vue";
import type { CaptureDialogHostExpose, CaptureDialogTranslate } from "./types";

type MessageType = "success" | "warning" | "info" | "error";

const props = withDefaults(
  defineProps<{
    captureSnapshot: () => Promise<string | null>;
    showMessage: (type: MessageType, message: string) => void;
    translate?: CaptureDialogTranslate;
  }>(),
  {
    translate: (key: string) => key,
  },
);

const previewImage = ref<string | null>(null);
const previewOpen = ref(false);
const watermarkOpen = ref(false);
const watermark = reactive(readWatermarkSettings());

const openWatermark = () => {
  watermarkOpen.value = true;
};

const applyWatermark = () => {
  writeWatermarkSettings(watermark);
  watermarkOpen.value = false;
};

const prepareCapture = async () => {
  try {
    const snapshot = await props.captureSnapshot();
    if (!snapshot) return;
    previewImage.value = await addWatermarkToImage(snapshot, watermark);
    previewOpen.value = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    props.showMessage("error", `截图失败: ${message}`);
  }
};

const downloadImage = () => {
  if (!previewImage.value) return;
  downloadDataUrl(previewImage.value, "screenshot.png");
  previewOpen.value = false;
};

const clearPreview = () => {
  previewImage.value = null;
};

defineExpose<CaptureDialogHostExpose>({
  openWatermark,
  prepareCapture,
});
</script>

<template>
  <CapturePreview
    v-model:open="previewOpen"
    :image="previewImage"
    :translate="props.translate"
    @close="clearPreview"
    @download="downloadImage"
  />
  <WatermarkDialog
    v-model:open="watermarkOpen"
    :settings="watermark"
    :translate="props.translate"
    @apply="applyWatermark"
  />
</template>
