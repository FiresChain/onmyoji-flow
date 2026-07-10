import { describe, expect, it } from "vitest";

import { createAssetSelectorNodeProperties } from "@/editor/node-types/asset-selector/definition";
import { createDynamicGroupNodeProperties } from "@/editor/node-types/dynamic-group/definition";
import { createNodePalette } from "@/editor/node-types/palette";
import { createPropertyRuleNodeProperties } from "@/editor/node-types/property-rule/definition";
import { createTextNodeProperties } from "@/editor/node-types/text/definition";
import { createVectorNodeProperties } from "@/editor/node-types/vector/definition";
import { getDefaultNodeRegistrations } from "@/editor/node-types/registry";

describe("colocated editor node definitions", () => {
  it("keeps registry order and returns fresh registration objects", () => {
    const first = getDefaultNodeRegistrations();
    const second = getDefaultNodeRegistrations();

    expect(first.map(({ type }) => type)).toEqual([
      "propertySelect",
      "imageNode",
      "assetSelector",
      "textNode",
      "vectorNode",
    ]);
    expect(first).not.toBe(second);
    expect(first[0]).not.toBe(second[0]);
  });

  it("creates fresh nested properties for every node definition", () => {
    const firstText = createTextNodeProperties();
    const secondText = createTextNodeProperties();
    const firstVector = createVectorNodeProperties();
    const secondVector = createVectorNodeProperties();
    const firstGroup = createDynamicGroupNodeProperties();
    const secondGroup = createDynamicGroupNodeProperties();
    const firstRule = createPropertyRuleNodeProperties();
    const secondRule = createPropertyRuleNodeProperties();

    expect(firstText.text).not.toBe(secondText.text);
    expect(firstVector.vector).not.toBe(secondVector.vector);
    expect(firstGroup.children).not.toBe(secondGroup.children);
    expect(firstGroup.groupMeta).not.toBe(secondGroup.groupMeta);
    expect(firstRule.property).not.toBe(secondRule.property);
    expect(createAssetSelectorNodeProperties()).not.toBe(
      createAssetSelectorNodeProperties(),
    );
  });

  it("builds a fresh palette without sharing nested defaults", () => {
    const palette = createNodePalette({ t: (key) => key });
    const basic = palette[0].components;
    const group = basic.find((item) => item.id === "dynamic-group");
    const vector = basic.find((item) => item.id === "vector");
    const firstGroupProperties = group?.createProperties();
    const secondGroupProperties = group?.createProperties();
    const firstVectorProperties = vector?.createProperties();
    const secondVectorProperties = vector?.createProperties();

    expect(firstGroupProperties).not.toBe(secondGroupProperties);
    expect((firstGroupProperties as any).children).not.toBe(
      (secondGroupProperties as any).children,
    );
    expect((firstVectorProperties as any).vector).not.toBe(
      (secondVectorProperties as any).vector,
    );
  });
});
