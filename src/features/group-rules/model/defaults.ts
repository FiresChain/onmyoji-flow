import type { GroupRulesConfig } from "./types";

export const DEFAULT_GROUP_RULES_CONFIG: GroupRulesConfig = {
  version: 4,
  fireShikigamiWhitelist: [
    "辉夜姬",
    "因幡辉夜姬",
    "追月神",
    "座敷童子",
    "千姬",
  ],
  shikigamiYuhunBlacklist: [],
  shikigamiConflictPairs: [],
  expressionRules: [
    {
      id: "team-require-fire-shikigami",
      scopeKind: "team",
      condition:
        'count(intersect(ctx.team.shikigamiNames, getVar("供火式神"))) == 0',
      message: "规则提示：当前队伍缺少供火式神。",
      severity: "warning",
      code: "TEAM_MISSING_FIRE_SHIKIGAMI",
      enabled: true,
    },
    {
      id: "team-kaguya-no-poshi",
      scopeKind: "shikigami",
      condition:
        'ctx.unit.shikigami.name == "辉夜姬" && contains(map(ctx.unit.yuhuns, "name"), "破势")',
      message: "规则冲突：辉夜姬不建议携带破势。",
      severity: "warning",
      code: "TEAM_KAGUYA_POSHI_CONFLICT",
      enabled: true,
    },
  ],
  ruleVariables: [
    {
      key: "供火式神",
      value: "辉夜姬,因幡辉夜姬,追月神,座敷童子,千姬",
    },
    {
      key: "输出御魂",
      value: "破势,狂骨,针女,海月火玉",
    },
  ],
};
