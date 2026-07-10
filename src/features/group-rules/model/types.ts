export type ShikigamiYuhunBlacklistRule = {
  shikigami: string;
  yuhun: string;
  message?: string;
};

export type ShikigamiConflictRule = {
  left: string;
  right: string;
  message?: string;
};

export type GroupRulesConfig = {
  version: number;
  fireShikigamiWhitelist: string[];
  shikigamiYuhunBlacklist: ShikigamiYuhunBlacklistRule[];
  shikigamiConflictPairs: ShikigamiConflictRule[];
  expressionRules: ExpressionRuleDefinition[];
  ruleVariables: RuleVariableDefinition[];
};

export type ExpressionRuleDefinition = {
  id: string;
  condition: string;
  message: string;
  scopeKind?: "team" | "shikigami";
  enabled?: boolean;
  severity?: "warning" | "error" | "info";
  code?: string;
};

export type RuleVariableDefinition = {
  key: string;
  value: string;
};
