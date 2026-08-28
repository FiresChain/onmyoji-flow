import { afterEach, describe, expect, it, vi } from "vitest";

const loadAssetUrl = async () => {
  vi.resetModules();
  return import("@/utils/assetUrl");
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("asset URL resolution", () => {
  it("uses the configured R2 base URL for canonical assets", async () => {
    vi.stubEnv("VITE_ASSET_BASE_URL", "https://onmyoji-assets.fireschain.org");
    const { resolveAssetUrl } = await loadAssetUrl();

    expect(resolveAssetUrl("/assets/Shikigami/ssr/604.png")).toBe(
      "https://onmyoji-assets.fireschain.org/assets/Shikigami/ssr/604.png",
    );
  });

  it("lets an embed override the configured base URL", async () => {
    vi.stubEnv("VITE_ASSET_BASE_URL", "https://onmyoji-assets.fireschain.org");
    const { resolveAssetUrl, setAssetBaseUrl } = await loadAssetUrl();
    setAssetBaseUrl("https://preview.example.com/data");

    expect(resolveAssetUrl("/assets/Yuhun/300048.png")).toBe(
      "https://preview.example.com/data/assets/Yuhun/300048.png",
    );
  });

  it("does not rewrite absolute or user-provided data URLs", async () => {
    vi.stubEnv("VITE_ASSET_BASE_URL", "https://onmyoji-assets.fireschain.org");
    const { resolveAssetUrl } = await loadAssetUrl();

    expect(resolveAssetUrl("https://example.com/custom.png")).toBe(
      "https://example.com/custom.png",
    );
    expect(resolveAssetUrl("data:image/png;base64,abc")).toBe(
      "data:image/png;base64,abc",
    );
  });
});
