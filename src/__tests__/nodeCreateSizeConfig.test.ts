import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_NODE_CREATE_SIZE_CONFIG,
  NODE_CREATE_SIZE_STORAGE_KEY,
  readNodeCreateSizeConfig,
  resetNodeCreateSizeConfig,
  resolveAssetThemeConfig,
  resolveCreateNodeSize,
  writeNodeCreateSizeConfig,
} from "@/utils/nodeCreateSizeConfig";

describe("nodeCreateSizeConfig", () => {
  beforeEach(() => {
    localStorage.removeItem(NODE_CREATE_SIZE_STORAGE_KEY);
  });

  it("writes and reads normalized config", () => {
    writeNodeCreateSizeConfig({
      assetThemeEnabled: false,
      imageNode: {
        width: "240",
        height: 100,
      },
      assetSelectorByLibrary: {
        onmyoji: {
          width: -10,
          height: 5000,
        },
      },
    });

    const config = readNodeCreateSizeConfig();
    expect(config.imageNode).toEqual({
      width: 240,
      height: 100,
    });
    expect(config.assetThemeEnabled).toBe(false);
    expect(config.assetSelectorByLibrary.onmyoji).toEqual({
      width: 40,
      height: 1200,
    });
  });

  it("resets to defaults", () => {
    writeNodeCreateSizeConfig({
      imageNode: { width: 260, height: 150 },
    });
    const reset = resetNodeCreateSizeConfig();
    expect(reset).toEqual(DEFAULT_NODE_CREATE_SIZE_CONFIG);
    expect(localStorage.getItem(NODE_CREATE_SIZE_STORAGE_KEY)).toBeNull();
  });

  it("resolves class-specific size for drag-create", () => {
    writeNodeCreateSizeConfig({
      assetSelectorByLibrary: {
        onmyoji: {
          width: 320,
          height: 220,
        },
      },
    });

    expect(
      resolveCreateNodeSize("assetSelector", {
        assetLibrary: "onmyoji",
      }),
    ).toEqual({
      width: 320,
      height: 220,
    });
    expect(resolveCreateNodeSize("unknown-node")).toBeNull();
  });

  it("resolves asset theme by library", () => {
    writeNodeCreateSizeConfig({
      assetThemeByLibrary: {
        shikigami: {
          nodeStyle: {
            fill: "#111111",
          },
        },
        yuhun: {
          nodeStyle: {
            fill: "#222222",
          },
          name: {
            show: false,
          },
        },
      },
    });

    const config = readNodeCreateSizeConfig();
    expect(
      resolveAssetThemeConfig({
        config,
        assetLibrary: "shikigami",
      }).nodeStyle.fill,
    ).toBe("#111111");
    expect(
      resolveAssetThemeConfig({
        config,
        assetLibrary: "yuhun",
      }).nodeStyle.fill,
    ).toBe("#222222");
    expect(
      resolveAssetThemeConfig({
        config,
        assetLibrary: "yuhun",
      }).name.show,
    ).toBe(false);
  });
});
