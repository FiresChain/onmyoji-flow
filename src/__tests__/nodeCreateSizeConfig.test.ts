import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_NODE_CREATE_SIZE_CONFIG,
  NODE_CREATE_SIZE_STORAGE_KEY,
  readNodeCreateSizeConfig,
  resetNodeCreateSizeConfig,
  resolveCreateNodeSize,
  writeNodeCreateSizeConfig,
} from "@/utils/nodeCreateSizeConfig";

describe("nodeCreateSizeConfig", () => {
  beforeEach(() => {
    localStorage.removeItem(NODE_CREATE_SIZE_STORAGE_KEY);
  });

  it("writes and reads normalized config", () => {
    writeNodeCreateSizeConfig({
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
});
