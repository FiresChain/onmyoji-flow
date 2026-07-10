import { afterEach, describe, expect, it } from "vitest";

import {
  createAssetUrlResolver,
  getAssetBaseUrl,
  resolveAssetUrl,
  rewriteAssetUrlsDeepWithResolver,
  setAssetBaseUrl,
} from "@/features/assets/public";

describe("assetUrlResolver", () => {
  afterEach(() => {
    setAssetBaseUrl();
  });

  it("preserves the compatibility default API and only rewrites asset paths", () => {
    setAssetBaseUrl("nested/editor");

    expect(getAssetBaseUrl()).toBe("/nested/editor/");
    expect(resolveAssetUrl("/assets/example.png")).toBe(
      "/nested/editor/assets/example.png",
    );
    expect(resolveAssetUrl("https://cdn.example.com/example.png")).toBe(
      "https://cdn.example.com/example.png",
    );
    expect(resolveAssetUrl(null)).toBeNull();
  });

  it("creates isolated resolver snapshots", () => {
    const first = createAssetUrlResolver("/first");
    const second = createAssetUrlResolver("https://cdn.example.com/editor");

    setAssetBaseUrl("/compatibility");

    expect(first("/assets/a.png")).toBe("/first/assets/a.png");
    expect(second("/assets/a.png")).toBe(
      "https://cdn.example.com/editor/assets/a.png",
    );
    expect(first("data:image/png;base64,a")).toBe("data:image/png;base64,a");
  });

  it("deeply rewrites arrays and plain objects with the supplied resolver", () => {
    const input = {
      image: "/assets/a.png",
      nested: ["/assets/b.png", { external: "https://example.com/c.png" }],
    };

    const output = rewriteAssetUrlsDeepWithResolver(
      input,
      createAssetUrlResolver("/app"),
    );

    expect(output).toEqual({
      image: "/app/assets/a.png",
      nested: ["/app/assets/b.png", { external: "https://example.com/c.png" }],
    });
    expect(output).not.toBe(input);
  });
});
