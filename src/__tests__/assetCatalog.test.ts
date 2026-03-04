import { describe, expect, it } from "vitest";
import { getAssetDataSource } from "@/configs/assetCatalog";

describe("assetCatalog", () => {
  it("returns localized shikigami records", () => {
    const zh = getAssetDataSource("shikigami", "zh");
    const en = getAssetDataSource("shikigami", "en");

    expect(Array.isArray(zh)).toBe(true);
    expect(zh.length).toBeGreaterThan(0);
    expect(Array.isArray(en)).toBe(true);
    expect(en.length).toBe(zh.length);

    const first = zh[0] as any;
    expect(typeof first.id).toBe("string");
    expect(first.library).toBe("shikigami");
    expect(typeof first.name).toBe("string");
    expect(typeof first.avatar).toBe("string");
  });

  it("returns localized onmyoji skill with onmyojiName", () => {
    const skills = getAssetDataSource("onmyojiSkill", "ja") as any[];
    expect(skills.length).toBeGreaterThan(0);
    expect(skills[0].library).toBe("onmyojiSkill");
    expect(typeof skills[0].onmyojiName).toBe("string");
    expect(skills[0].onmyojiName.length).toBeGreaterThan(0);
  });

  it("falls back to zh locale when unknown locale is provided", () => {
    const unknown = getAssetDataSource("yuhun", "unknown-locale");
    const zh = getAssetDataSource("yuhun", "zh");
    expect(unknown.length).toBe(zh.length);
    expect((unknown[0] as any).name).toBe((zh[0] as any).name);
  });
});
