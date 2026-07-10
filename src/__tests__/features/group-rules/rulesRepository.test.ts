import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_GROUP_RULES_CONFIG,
  GROUP_RULES_STORAGE_KEY,
  clearSharedGroupRulesConfig,
  readSharedGroupRulesConfig,
  subscribeSharedGroupRulesConfig,
  writeSharedGroupRulesConfig,
} from "@/features/group-rules/public";

describe("group-rules repository", () => {
  beforeEach(() => {
    localStorage.removeItem(GROUP_RULES_STORAGE_KEY);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the existing storage key and falls back for malformed JSON", () => {
    expect(GROUP_RULES_STORAGE_KEY).toBe("yys-editor.group-rules.v1");
    localStorage.setItem(GROUP_RULES_STORAGE_KEY, "{invalid-json");

    expect(readSharedGroupRulesConfig()).toEqual(DEFAULT_GROUP_RULES_CONFIG);
  });

  it("migrates the legacy Kaguya team condition on read", () => {
    localStorage.setItem(
      GROUP_RULES_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_GROUP_RULES_CONFIG,
        expressionRules: [
          {
            id: "team-kaguya-no-poshi",
            condition:
              'contains(ctx.team.shikigamiNames, "辉夜姬") && contains(ctx.team.yuhunNames, "破势")',
            message: "legacy",
          },
        ],
      }),
    );

    expect(readSharedGroupRulesConfig().expressionRules[0]).toMatchObject({
      scopeKind: "shikigami",
      condition:
        'ctx.unit.shikigami.name == "辉夜姬" && contains(map(ctx.unit.yuhuns, "name"), "破势")',
    });
  });

  it("notifies same-page subscribers on write and clear, then disposes", () => {
    const listener = vi.fn();
    const dispose = subscribeSharedGroupRulesConfig(listener);

    writeSharedGroupRulesConfig(DEFAULT_GROUP_RULES_CONFIG);
    clearSharedGroupRulesConfig();
    expect(listener).toHaveBeenCalledTimes(2);

    dispose();
    writeSharedGroupRulesConfig(DEFAULT_GROUP_RULES_CONFIG);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("tolerates denied storage access without publishing phantom updates", () => {
    const listener = vi.fn();
    const dispose = subscribeSharedGroupRulesConfig(listener);

    const readSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("read denied");
      });
    expect(readSharedGroupRulesConfig()).toEqual(DEFAULT_GROUP_RULES_CONFIG);
    readSpy.mockRestore();

    const writeSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("write denied");
      });
    expect(() =>
      writeSharedGroupRulesConfig(DEFAULT_GROUP_RULES_CONFIG),
    ).not.toThrow();
    writeSpy.mockRestore();

    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("remove denied");
    });
    expect(() => clearSharedGroupRulesConfig()).not.toThrow();
    expect(listener).not.toHaveBeenCalled();

    dispose();
  });
});
