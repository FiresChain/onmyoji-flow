import { describe, expect, it } from "vitest";

import {
  normalizeNodeStyle,
  normalizePropertiesWithStyle,
  styleEquals,
} from "@/core/document/nodeStyle";

describe("document node style normalization", () => {
  it("normalizes numeric fields and clamps opacity without browser APIs", () => {
    const style = normalizeNodeStyle(
      {
        width: "240" as unknown as number,
        height: undefined,
        opacity: 2,
        radius: [1, 2, 3, 4],
        shadow: { blur: "8" as unknown as number },
      },
      { height: 120 },
    );

    expect(style).toMatchObject({
      width: 240,
      height: 120,
      opacity: 1,
      radius: [1, 2, 3, 4],
      shadow: { blur: 8 },
    });
  });

  it("keeps property dimensions synchronized with normalized style", () => {
    const input = {
      label: "keep",
      width: 1,
      height: 2,
      style: { width: 320, height: 180 },
    };

    const normalized = normalizePropertiesWithStyle(input);

    expect(normalized).toMatchObject({
      label: "keep",
      width: 320,
      height: 180,
      style: { width: 320, height: 180 },
    });
    expect(normalized).not.toBe(input);
  });

  it("compares normalized representations", () => {
    expect(styleEquals({ width: 180 }, { width: "180" as never })).toBe(true);
    expect(styleEquals({ width: 180 }, { width: 181 })).toBe(false);
  });
});
