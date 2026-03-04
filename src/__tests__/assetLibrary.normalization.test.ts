import { describe, expect, it } from "vitest";
import {
  normalizeAssetLibraryId,
  normalizeAssetLibraryIdWithFallback,
} from "@/utils/assetLibrary";

describe("assetLibrary normalization", () => {
  it("normalizes onmyoji skill aliases", () => {
    expect(normalizeAssetLibraryId("onmyojiSkill")).toBe("onmyojiSkill");
    expect(normalizeAssetLibraryId("onmyojiskill")).toBe("onmyojiSkill");
    expect(normalizeAssetLibraryId("onmyoji_skill")).toBe("onmyojiSkill");
    expect(normalizeAssetLibraryId("onmyoji-skill")).toBe("onmyojiSkill");
  });

  it("returns fallback for unknown library", () => {
    expect(normalizeAssetLibraryId("unknown")).toBe("");
    expect(normalizeAssetLibraryIdWithFallback("unknown", "yuhun")).toBe(
      "yuhun",
    );
  });
});
