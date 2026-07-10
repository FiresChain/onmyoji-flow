import { describe, expect, it, vi } from "vitest";

import { addWatermarkToImage } from "@/features/capture/captureCanvas";
import {
  readWatermarkSettings,
  WATERMARK_STORAGE_KEYS,
  writeWatermarkSettings,
} from "@/features/capture/watermarkRepository";
import type { StorageLike } from "@/shared/platform/storage";

const createMemoryStorage = (): StorageLike & {
  values: Map<string, string>;
} => {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};

describe("capture feature", () => {
  it("preserves watermark storage keys, defaults, and legacy number fallback", () => {
    const storage = createMemoryStorage();
    storage.setItem(WATERMARK_STORAGE_KEYS.angle, "0");

    expect(readWatermarkSettings(storage)).toEqual({
      text: "示例水印",
      fontSize: 30,
      color: "rgba(184, 184, 184, 0.3)",
      angle: -20,
      rows: 1,
      cols: 1,
    });

    const settings = {
      text: "watermark",
      fontSize: 18,
      color: "#ffffff",
      angle: 15,
      rows: 2,
      cols: 3,
    };
    expect(writeWatermarkSettings(settings, storage)).toBe(true);
    expect(readWatermarkSettings(storage)).toEqual(settings);
  });

  it("draws one watermark for each configured row and column", async () => {
    const fillText = vi.fn();
    const context = {
      drawImage: vi.fn(),
      save: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      fillText,
      restore: vi.fn(),
      font: "",
      fillStyle: "",
      textAlign: "",
      textBaseline: "",
    };
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
      toDataURL: vi.fn(() => "data:image/png;base64,watermarked"),
    };
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName) =>
      tagName === "canvas"
        ? (canvas as unknown as HTMLCanvasElement)
        : originalCreateElement(tagName),
    );
    class MockImage {
      width = 120;
      height = 80;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        this.onload?.();
      }
    }
    vi.stubGlobal("Image", MockImage);

    await expect(
      addWatermarkToImage("data:image/png;base64,source", {
        text: "mark",
        fontSize: 20,
        color: "#fff",
        angle: 0,
        rows: 2,
        cols: 3,
      }),
    ).resolves.toBe("data:image/png;base64,watermarked");
    expect(fillText).toHaveBeenCalledTimes(6);
    expect(canvas.width).toBe(120);
    expect(canvas.height).toBe(80);
  });
});
