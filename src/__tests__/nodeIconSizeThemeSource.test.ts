import { describe, expect, it, vi } from "vitest";
import {
  clearNodeIconSizeThemeConfig,
  NODE_ICON_SIZE_THEME_STORAGE_KEY,
  readNodeIconSizeThemeConfig,
  subscribeNodeIconSizeThemeConfig,
  writeNodeIconSizeThemeConfig,
} from "@/utils/nodeIconSizeThemeSource";

describe("nodeIconSizeThemeSource", () => {
  it("reads and writes normalized config", () => {
    clearNodeIconSizeThemeConfig();

    const written = writeNodeIconSizeThemeConfig({
      assetSelector: { width: "260", height: 140 },
    });
    expect(written).toEqual({
      assetSelector: { width: 260, height: 140 },
    });

    const readBack = readNodeIconSizeThemeConfig();
    expect(readBack).toEqual({
      assetSelector: { width: 260, height: 140 },
    });
  });

  it("clears storage when writing empty config", () => {
    writeNodeIconSizeThemeConfig({
      imageNode: { width: 200, height: 120 },
    });
    expect(localStorage.getItem(NODE_ICON_SIZE_THEME_STORAGE_KEY)).toBeTruthy();

    writeNodeIconSizeThemeConfig({});
    expect(localStorage.getItem(NODE_ICON_SIZE_THEME_STORAGE_KEY)).toBeNull();
  });

  it("subscribes to updates via custom event", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeNodeIconSizeThemeConfig(listener);

    writeNodeIconSizeThemeConfig({
      assetSelector: { width: 210, height: 130 },
    });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});

