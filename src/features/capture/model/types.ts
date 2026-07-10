export interface WatermarkSettings {
  text: string;
  fontSize: number;
  color: string;
  angle: number;
  rows: number;
  cols: number;
}

export const DEFAULT_WATERMARK_SETTINGS: Readonly<WatermarkSettings> =
  Object.freeze({
    text: "示例水印",
    fontSize: 30,
    color: "rgba(184, 184, 184, 0.3)",
    angle: -20,
    rows: 1,
    cols: 1,
  });
