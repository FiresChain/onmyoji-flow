import { describe, expect, it } from "vitest";
import {
  DEFAULT_NODE_ICON_SIZE_BY_TYPE,
  buildMergedNodeIconSizeByType,
  normalizeNodeIconSizeByType,
  resolveNodeIconSize,
} from "@/types/nodeIconSize";

describe("nodeIconSize", () => {
  it("normalizes invalid values and ignores unknown targets", () => {
    const normalized = normalizeNodeIconSizeByType({
      assetSelector: {
        width: "200",
        height: "90",
      },
      imageNode: {
        width: -100,
        height: 5000,
      },
      unknownNode: {
        width: 1,
        height: 1,
      },
    });

    expect(normalized.assetSelector).toEqual({
      width: 200,
      height: 90,
    });
    expect(normalized.imageNode).toEqual({
      width: 40,
      height: 1200,
    });
    expect((normalized as any).unknownNode).toBeUndefined();
  });

  it("applies merge precedence: default < global < file", () => {
    const merged = buildMergedNodeIconSizeByType({
      globalOverride: {
        assetSelector: {
          width: 210,
          height: 140,
        },
      },
      fileOverride: {
        assetSelector: {
          width: 230,
          height: 150,
        },
        imageNode: {
          width: 260,
          height: 200,
        },
      },
    });

    expect(merged.assetSelector).toEqual({
      width: 230,
      height: 150,
    });
    expect(merged.imageNode).toEqual({
      width: 260,
      height: 200,
    });
  });

  it("applies explicit size as highest priority", () => {
    const resolved = resolveNodeIconSize("assetSelector", {
      globalOverride: {
        assetSelector: { width: 300, height: 180 },
      },
      fileOverride: {
        assetSelector: { width: 360, height: 220 },
      },
      explicit: {
        width: 400,
      },
    });

    expect(resolved).toEqual({
      width: 400,
      height: 220,
    });
  });

  it("falls back to built-in defaults when no override exists", () => {
    const resolved = resolveNodeIconSize("imageNode");
    expect(resolved).toEqual(DEFAULT_NODE_ICON_SIZE_BY_TYPE.imageNode);
  });
});

