export type CaptureDialogTranslate = (
  key: string,
  values?: Record<string, unknown>,
) => string;

export interface CaptureDialogHostExpose {
  openWatermark(): void;
  prepareCapture(): Promise<void>;
}
