import { createSafeStorage, type StorageLike } from "@/shared/platform/storage";

import {
  DEFAULT_WATERMARK_SETTINGS,
  type WatermarkSettings,
} from "./model/types";

export const WATERMARK_STORAGE_KEYS = Object.freeze({
  text: "watermark.text",
  fontSize: "watermark.fontSize",
  color: "watermark.color",
  angle: "watermark.angle",
  rows: "watermark.rows",
  cols: "watermark.cols",
});

const getStorage = (key: string, storage?: StorageLike | null) =>
  storage === undefined
    ? createSafeStorage(key)
    : createSafeStorage(key, storage);

export const readWatermarkSettings = (
  storage?: StorageLike | null,
): WatermarkSettings => ({
  text:
    getStorage(WATERMARK_STORAGE_KEYS.text, storage).read() ||
    DEFAULT_WATERMARK_SETTINGS.text,
  fontSize:
    Number(getStorage(WATERMARK_STORAGE_KEYS.fontSize, storage).read()) ||
    DEFAULT_WATERMARK_SETTINGS.fontSize,
  color:
    getStorage(WATERMARK_STORAGE_KEYS.color, storage).read() ||
    DEFAULT_WATERMARK_SETTINGS.color,
  angle:
    Number(getStorage(WATERMARK_STORAGE_KEYS.angle, storage).read()) ||
    DEFAULT_WATERMARK_SETTINGS.angle,
  rows:
    Number(getStorage(WATERMARK_STORAGE_KEYS.rows, storage).read()) ||
    DEFAULT_WATERMARK_SETTINGS.rows,
  cols:
    Number(getStorage(WATERMARK_STORAGE_KEYS.cols, storage).read()) ||
    DEFAULT_WATERMARK_SETTINGS.cols,
});

export const writeWatermarkSettings = (
  settings: WatermarkSettings,
  storage?: StorageLike | null,
): boolean => {
  const results = (
    Object.entries(WATERMARK_STORAGE_KEYS) as Array<
      [keyof WatermarkSettings, string]
    >
  ).map(([field, key]) =>
    getStorage(key, storage).write(String(settings[field])),
  );
  return results.every(Boolean);
};
