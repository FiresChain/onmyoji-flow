import { describe, expect, it } from "vitest";
import {
  createStateWriteBoundaryOptions,
  listStateWriteBoundaryIdentifiers,
} from "../../eslint-rules/state-write-boundaries.config.js";

const boundaryRuleSources = import.meta.glob(
  "../../eslint-rules/*-boundary.js",
  {
    eager: true,
    import: "default",
    query: "?raw",
  },
) as Record<string, string>;

const extractBoundaryIdentifier = (ruleSource: string) => {
  const match = ruleSource.match(
    /createStateWriteBoundaryOptions\((['"])([A-Za-z0-9_]+)\1\)/,
  );
  return match?.[2] ?? null;
};

describe("state write boundary centralized config guard", () => {
  it("集中配置应可枚举并可生成每个边界的规则选项", () => {
    const boundaryIdentifiers = listStateWriteBoundaryIdentifiers().sort();

    expect(boundaryIdentifiers.length).toBeGreaterThan(0);

    boundaryIdentifiers.forEach((stateIdentifier) => {
      const options = createStateWriteBoundaryOptions(stateIdentifier);

      expect(options.stateIdentifier).toBe(stateIdentifier);
      expect(options.statePropertyName).toBe("value");
      expect(options.allowedWriteFunctions.length).toBeGreaterThan(0);
      expect(options.runtimeEntryFunctions.length).toBeGreaterThan(0);
    });
  });

  it("所有 *-boundary 规则都必须通过集中配置源声明 stateIdentifier", () => {
    const boundaryIdentifiers = listStateWriteBoundaryIdentifiers().sort();
    const ruleBoundaryIdentifiers = Object.entries(boundaryRuleSources)
      .map(([filePath, ruleSource]) => {
        expect(ruleSource).toContain("state-write-boundaries.config");
        const boundaryIdentifier = extractBoundaryIdentifier(ruleSource);
        expect(
          boundaryIdentifier,
          `${filePath} must call createStateWriteBoundaryOptions(...)`,
        ).not.toBeNull();
        return boundaryIdentifier as string;
      })
      .sort();

    expect(ruleBoundaryIdentifiers).toEqual(boundaryIdentifiers);
  });
});
