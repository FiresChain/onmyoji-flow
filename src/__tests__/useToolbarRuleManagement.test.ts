import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GroupRulesConfig } from "@/configs/groupRules";
import { DEFAULT_GROUP_RULES_CONFIG } from "@/configs/groupRules";
import { useToolbarRuleManagement } from "@/components/composables/useToolbarRuleManagement";
import {
  readSharedGroupRulesConfig,
  writeSharedGroupRulesConfig,
} from "@/utils/groupRulesConfigSource";
import { ElMessageBox } from "element-plus";

vi.mock("@/utils/groupRulesConfigSource", () => ({
  readSharedGroupRulesConfig: vi.fn(),
  writeSharedGroupRulesConfig: vi.fn(),
}));

vi.mock("element-plus", () => ({
  ElMessageBox: {
    confirm: vi.fn(),
  },
}));

interface ToolbarRuleTestContext {
  state: {
    showRuleManagerDialog: boolean;
  };
  showMessage: ReturnType<typeof vi.fn>;
  composable: ReturnType<typeof useToolbarRuleManagement>;
}

const createBaseConfig = (): GroupRulesConfig => ({
  version: 3,
  fireShikigamiWhitelist: ["辉夜姬"],
  shikigamiYuhunBlacklist: [],
  shikigamiConflictPairs: [],
  expressionRules: [
    {
      id: "rule_1",
      condition: "true",
      message: "ok",
      enabled: true,
      severity: "warning",
      code: "RULE_1",
    },
  ],
  ruleVariables: [
    {
      key: "var_1",
      value: "a,b",
    },
  ],
});

const cloneConfig = (config: GroupRulesConfig): GroupRulesConfig =>
  JSON.parse(JSON.stringify(config));

const createContext = (): ToolbarRuleTestContext => {
  const state = {
    showRuleManagerDialog: false,
  };
  const showMessage = vi.fn();
  const composable = useToolbarRuleManagement({
    state,
    showMessage,
  });

  return {
    state,
    showMessage,
    composable,
  };
};

describe("useToolbarRuleManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const base = createBaseConfig();
    vi.mocked(readSharedGroupRulesConfig).mockReturnValue(cloneConfig(base));
    vi.mocked(writeSharedGroupRulesConfig).mockImplementation(
      (config: GroupRulesConfig) => cloneConfig(config),
    );
    vi.mocked(ElMessageBox.confirm).mockResolvedValue("confirm" as never);
  });

  it("openRuleManager keeps reload + open behavior", () => {
    const context = createContext();

    context.composable.ruleManagerTab.value = "variables";
    context.composable.ruleEditorVisible.value = true;
    context.composable.ruleEditorDraft.value = {
      id: "tmp",
      condition: "false",
      message: "tmp",
    };

    context.composable.openRuleManager();

    expect(context.state.showRuleManagerDialog).toBe(true);
    expect(context.composable.ruleManagerTab.value).toBe("rules");
    expect(context.composable.ruleEditorVisible.value).toBe(false);
    expect(context.composable.ruleEditorDraft.value).toBeNull();
    expect(readSharedGroupRulesConfig).toHaveBeenCalled();
  });

  it("handleRuleBundleImport keeps import-and-normalize behavior", async () => {
    const context = createContext();
    const payload = {
      expressionRules: [
        {
          id: "rule_imported",
          condition: "count(ctx.team.shikigamis) > 0",
          message: "imported message",
          enabled: true,
          severity: "info",
          code: "IMPORTED",
        },
      ],
      ruleVariables: [
        {
          key: "new_var",
          value: "x,y",
        },
      ],
    };

    const file = {
      text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
    } as unknown as File;
    const target = {
      files: [file],
      value: "selected",
    } as unknown as HTMLInputElement;

    await context.composable.handleRuleBundleImport({
      target,
    } as unknown as Event);

    expect(context.composable.ruleConfigDraft.value.expressionRules[0].id).toBe(
      "rule_imported",
    );
    expect(context.composable.ruleConfigDraft.value.ruleVariables[0].key).toBe(
      "new_var",
    );
    expect(context.showMessage).toHaveBeenCalledWith(
      "success",
      "规则变量已导入，请点击“应用并生效”",
    );
    expect(target.value).toBe("");
  });

  it("applyRuleManagerConfig keeps apply-and-notify behavior", () => {
    const context = createContext();

    context.composable.applyRuleManagerConfig();

    expect(writeSharedGroupRulesConfig).toHaveBeenCalledWith(
      context.composable.ruleConfigDraft.value,
    );
    expect(context.showMessage).toHaveBeenCalledWith(
      "success",
      "规则配置已生效",
    );
  });

  it("restoreDefaultRuleConfig keeps confirm-and-reset behavior", async () => {
    const context = createContext();
    vi.mocked(writeSharedGroupRulesConfig).mockReturnValue(
      cloneConfig(DEFAULT_GROUP_RULES_CONFIG),
    );

    context.composable.restoreDefaultRuleConfig();
    await Promise.resolve();

    expect(ElMessageBox.confirm).toHaveBeenCalled();
    expect(writeSharedGroupRulesConfig).toHaveBeenCalledWith(
      DEFAULT_GROUP_RULES_CONFIG,
    );
    expect(context.showMessage).toHaveBeenCalledWith(
      "success",
      "已恢复默认规则配置",
    );
  });

  it("rule editor keeps validation before save behavior", () => {
    const context = createContext();

    context.composable.addExpressionRule();
    expect(context.composable.ruleEditorVisible.value).toBe(true);

    if (context.composable.ruleEditorDraft.value) {
      context.composable.ruleEditorDraft.value.id = "   ";
      context.composable.ruleEditorDraft.value.condition = "   ";
      context.composable.ruleEditorDraft.value.message = "   ";
    }

    context.composable.saveRuleEditor();

    expect(context.showMessage).toHaveBeenCalledWith(
      "warning",
      "规则 ID、条件表达式、提示文案不能为空",
    );
  });
});
