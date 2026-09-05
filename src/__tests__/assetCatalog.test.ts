import { beforeEach, describe, expect, it, vi } from "vitest";

const catalog = {
  schemaVersion: 1,
  catalogVersion: "2026.08.28.1",
  generatedAt: "2026-08-28T00:00:00.000Z",
  libraries: {
    shikigami: [
      {
        id: "604",
        avatar: "/assets/Shikigami/ssr/604.png",
        names: { zh: "不相狐禅", en: "Fox", ja: "狐" },
        rarity: "SSR",
      },
    ],
    yuhun: [
      {
        id: "300086",
        avatar: "/assets/Yuhun/300086.png",
        names: { zh: "隐念" },
        shortNames: { zh: "隐" },
        type: "attack",
      },
    ],
    onmyoji: [
      {
        id: "10",
        avatar: "/assets/Onmyoji/hero_10_10.png",
        names: { zh: "晴明", ja: "晴明" },
      },
    ],
    onmyojiSkill: [
      {
        id: "10:1003",
        avatar: "/assets/OnmyojiSkill/hero_10_skill_1003.png",
        names: { zh: "基础术式", ja: "基本術式" },
        onmyojiId: "10",
        skillId: "1003",
      },
    ],
    hunling: [
      {
        id: "100",
        avatar: "/assets/HunLing/100.png",
        names: { zh: "镇墓兽" },
      },
    ],
  },
};

const loadModule = async () => {
  vi.resetModules();
  return import("@/configs/assetCatalog");
};

describe("assetCatalog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves the catalog from the assets directory", async () => {
    const { resolveAssetCatalogUrl } = await loadModule();

    expect(resolveAssetCatalogUrl()).toBe(
      "https://onmyoji-assets.fireschain.org/assets/catalog.json",
    );
    expect(resolveAssetCatalogUrl("https://assets.example/")).toBe(
      "https://assets.example/assets/catalog.json",
    );
  });

  it("throws when data is requested before the remote catalog is loaded", async () => {
    const { getAssetDataSource } = await loadModule();
    expect(() => getAssetDataSource("shikigami", "zh")).toThrow(
      "Asset catalog is not loaded",
    );
  });

  it("loads once and returns localized records for every library", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(catalog),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { loadAssetCatalog, getAssetDataSource } = await loadModule();

    await Promise.all([loadAssetCatalog(), loadAssetCatalog()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((getAssetDataSource("shikigami", "en")[0] as any).name).toBe("Fox");
    expect(
      (getAssetDataSource("onmyojiSkill", "ja")[0] as any).onmyojiName,
    ).toBe("晴明");
    expect((getAssetDataSource("yuhun", "unknown-locale")[0] as any).name).toBe(
      "隐念",
    );
    expect((getAssetDataSource("hunling", "zh")[0] as any).library).toBe(
      "hunling",
    );
  });

  it("rejects failed responses and allows a later retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Unavailable",
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(catalog),
      });
    vi.stubGlobal("fetch", fetchMock);
    const { loadAssetCatalog } = await loadModule();

    await expect(loadAssetCatalog()).rejects.toThrow("503 Unavailable");
    await expect(loadAssetCatalog()).resolves.toMatchObject({
      schemaVersion: 1,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects incomplete catalogs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          ...catalog,
          libraries: { shikigami: [] },
        }),
      }),
    );
    const { loadAssetCatalog } = await loadModule();

    await expect(loadAssetCatalog()).rejects.toThrow(
      "Asset catalog library yuhun must be an array",
    );
  });
});
