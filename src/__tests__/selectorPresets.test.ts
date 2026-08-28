import { beforeAll, describe, expect, it, vi } from "vitest";
import { loadAssetCatalog } from "@/configs/assetCatalog";
import { getSelectorPreset } from "@/configs/selectorPresets";
import shikigami from "@/data/assets/shikigami.json";
import yuhun from "@/data/assets/yuhun.json";
import onmyoji from "@/data/assets/onmyoji.json";
import onmyojiSkill from "@/data/assets/onmyojiSkill.json";
import hunling from "@/data/assets/hunling.json";

const t = (key: string) => key;

describe("selector presets", () => {
  beforeAll(async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          schemaVersion: 1,
          catalogVersion: "test",
          generatedAt: "2026-08-28T00:00:00.000Z",
          libraries: { shikigami, yuhun, onmyoji, onmyojiSkill, hunling },
        }),
      }),
    );
    await loadAssetCatalog();
  });

  it("provides all library presets", () => {
    const shikigami = getSelectorPreset("shikigami", { locale: "zh", t });
    const yuhun = getSelectorPreset("yuhun", { locale: "zh", t });
    const onmyoji = getSelectorPreset("onmyoji", { locale: "zh", t });
    const onmyojiSkill = getSelectorPreset("onmyojiSkill", {
      locale: "zh",
      t,
    });
    const hunling = getSelectorPreset("hunling", { locale: "zh", t });

    expect(shikigami.dataSource.length).toBeGreaterThan(0);
    expect(yuhun.dataSource.length).toBeGreaterThan(0);
    expect(onmyoji.dataSource.length).toBeGreaterThan(0);
    expect(onmyojiSkill.dataSource.length).toBeGreaterThan(0);
    expect(hunling.dataSource.length).toBeGreaterThan(0);

    expect(shikigami.itemKeyField).toBe("id");
    expect(onmyojiSkill.groupField).toBe("onmyojiName");
    expect(hunling.groupField).toBe(null);
  });
});
