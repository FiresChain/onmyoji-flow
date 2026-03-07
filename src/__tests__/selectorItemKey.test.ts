import { describe, expect, it } from "vitest";
import { buildSelectorItemKey } from "@/utils/selectorItemKey";
import type { SelectorConfig } from "@/types/selector";

const config: SelectorConfig = {
  title: "test",
  dataSource: [],
  groups: [{ label: "all", name: "ALL" }],
  itemRender: {
    imageField: "avatar",
    labelField: "name",
  },
};

describe("selector item key", () => {
  it("prefers id-like stable keys", () => {
    expect(buildSelectorItemKey({ id: "abc" }, 0, config)).toBe("abc");
    expect(buildSelectorItemKey({ assetId: "lib:1" }, 0, config)).toBe("lib:1");
  });

  it("generates fallback keys for duplicate names", () => {
    const itemA = { name: "技能1", avatar: "/a.png" };
    const itemB = { name: "技能1", avatar: "/b.png" };

    const keyA = buildSelectorItemKey(itemA, 0, config);
    const keyB = buildSelectorItemKey(itemB, 1, config);

    expect(keyA).not.toBe(keyB);
    expect(keyA.startsWith("fallback:")).toBe(true);
    expect(keyB.startsWith("fallback:")).toBe(true);
  });
});
