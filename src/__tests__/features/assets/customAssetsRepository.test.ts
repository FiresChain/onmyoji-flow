import { beforeEach, describe, expect, it } from "vitest";

import {
  CUSTOM_ASSET_STORAGE_KEY,
  deleteCustomAsset,
  listCustomAssets,
  saveCustomAsset,
  subscribeCustomAssetStore,
  type CustomAssetItem,
} from "@/features/assets/public";

const createAsset = (
  overrides: Partial<CustomAssetItem> = {},
): CustomAssetItem => ({
  id: "custom-1",
  name: "asset-1",
  avatar: "data:image/png;base64,one",
  library: "shikigami",
  __userAsset: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("customAssetsRepository", () => {
  beforeEach(() => {
    localStorage.removeItem(CUSTOM_ASSET_STORAGE_KEY);
    localStorage.removeItem("unrelated");
  });

  it("normalizes legacy library aliases and fields in place", () => {
    localStorage.setItem(
      CUSTOM_ASSET_STORAGE_KEY,
      JSON.stringify({
        onmyoji_skill: [
          {
            name: "skill",
            avatar: "/assets/skill.png",
          },
        ],
        unknown: [{ name: "ignored", avatar: "/assets/ignored.png" }],
      }),
    );

    const assets = listCustomAssets("onmyojiSkill");

    expect(assets).toHaveLength(1);
    expect(assets[0]).toMatchObject({
      id: expect.stringMatching(/^custom_legacy_/),
      library: "onmyojiSkill",
      __userAsset: true,
      createdAt: "1970-01-01T00:00:00.000Z",
    });
    expect(
      JSON.parse(localStorage.getItem(CUSTOM_ASSET_STORAGE_KEY) || "{}"),
    ).toEqual({
      onmyojiSkill: assets,
    });
  });

  it("prepends assets, deduplicates by name and avatar, and supports deletion", () => {
    saveCustomAsset("shikigami", createAsset());
    saveCustomAsset(
      "shikigami",
      createAsset({ id: "custom-2", createdAt: "2026-01-02T00:00:00.000Z" }),
    );

    expect(listCustomAssets("shikigami").map(({ id }) => id)).toEqual([
      "custom-2",
    ]);

    deleteCustomAsset("shikigami", "custom-2");
    expect(listCustomAssets("shikigami")).toEqual([]);
  });

  it("notifies same-window subscribers and removes listeners on dispose", () => {
    let updates = 0;
    const dispose = subscribeCustomAssetStore(() => {
      updates += 1;
    });

    saveCustomAsset("shikigami", createAsset());
    expect(updates).toBe(1);

    dispose();
    saveCustomAsset("shikigami", createAsset({ id: "custom-2" }));
    expect(updates).toBe(1);
  });

  it("returns an empty list for malformed storage without clearing other keys", () => {
    localStorage.setItem(CUSTOM_ASSET_STORAGE_KEY, "not-json");
    localStorage.setItem("unrelated", "keep");

    expect(listCustomAssets("shikigami")).toEqual([]);
    expect(localStorage.getItem(CUSTOM_ASSET_STORAGE_KEY)).toBe("not-json");
    expect(localStorage.getItem("unrelated")).toBe("keep");
  });
});
