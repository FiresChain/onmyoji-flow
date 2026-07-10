export { addWatermarkToImage } from "./captureCanvas";
export {
  DEFAULT_WATERMARK_SETTINGS,
  type WatermarkSettings,
} from "./model/types";
export {
  WATERMARK_STORAGE_KEYS,
  readWatermarkSettings,
  writeWatermarkSettings,
} from "./watermarkRepository";
export { default as CaptureDialogHost } from "./ui/CaptureDialogHost.vue";
export type {
  CaptureDialogHostExpose,
  CaptureDialogTranslate,
} from "./ui/types";
