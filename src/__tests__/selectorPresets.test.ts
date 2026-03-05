import { describe, expect, it } from "vitest";
import { getSelectorPreset } from "@/configs/selectorPresets";

const t = (key: string) => key;

describe("selector presets", () => {
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
