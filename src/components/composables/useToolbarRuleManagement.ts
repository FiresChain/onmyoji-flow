import { ElMessageBox } from "element-plus";
import { ref } from "vue";
import {
  DEFAULT_GROUP_RULES_CONFIG,
  type ExpressionRuleDefinition,
  type GroupRulesConfig,
  type RuleVariableDefinition,
} from "@/configs/groupRules";
import {
  readSharedGroupRulesConfig,
  writeSharedGroupRulesConfig,
} from "@/utils/groupRulesConfigSource";

type MessageType = "success" | "warning" | "info" | "error";

type ShowMessage = (type: MessageType, message: string) => void;

interface ToolbarRuleManagementState {
  showRuleManagerDialog: boolean;
}

interface UseToolbarRuleManagementOptions {
  state: ToolbarRuleManagementState;
  showMessage: ShowMessage;
}

const cloneRuleConfig = (config: GroupRulesConfig): GroupRulesConfig => ({
  version: config.version,
  fireShikigamiWhitelist: [...config.fireShikigamiWhitelist],
  shikigamiYuhunBlacklist: config.shikigamiYuhunBlacklist.map((rule) => ({
    ...rule,
  })),
  shikigamiConflictPairs: config.shikigamiConflictPairs.map((rule) => ({
    ...rule,
  })),
  expressionRules: config.expressionRules.map((rule) => ({ ...rule })),
  ruleVariables: config.ruleVariables.map((item) => ({ ...item })),
});

const createExpressionRule = (): ExpressionRuleDefinition => ({
  id: `rule_${Date.now()}`,
  scopeKind: "team",
  enabled: true,
  severity: "warning",
  code: "CUSTOM_EXPRESSION",
  condition: "false",
  message: "请补充规则提示文案",
});

const createRuleVariable = (): RuleVariableDefinition => ({
  key: `var_${Date.now()}`,
  value: "",
});

const cloneExpressionRule = (
  rule: ExpressionRuleDefinition,
): ExpressionRuleDefinition => ({
  id: rule.id || `rule_${Date.now()}`,
  scopeKind: rule.scopeKind === "shikigami" ? "shikigami" : "team",
  enabled: rule.enabled !== false,
  severity: rule.severity || "warning",
  code: rule.code || "CUSTOM_EXPRESSION",
  condition: rule.condition || "false",
  message: rule.message || "请补充规则提示文案",
});

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";
const normalizeSeverity = (value: unknown): "warning" | "error" | "info" => {
  return value === "error" || value === "info" ? value : "warning";
};
const normalizeScopeKind = (value: unknown): "team" | "shikigami" => {
  return value === "shikigami" ? "shikigami" : "team";
};

const normalizeImportedExpressionRules = (
  value: unknown,
): ExpressionRuleDefinition[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): ExpressionRuleDefinition | null => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      const id = normalizeText(raw.id);
      const condition = normalizeText(raw.condition);
      const message = normalizeText(raw.message);
      if (!id || !condition || !message) return null;
      const code = normalizeText(raw.code);
      return {
        id,
        condition,
        message,
        scopeKind: normalizeScopeKind(raw.scopeKind),
        enabled: raw.enabled !== false,
        severity: normalizeSeverity(raw.severity),
        ...(code ? { code } : {}),
      };
    })
    .filter((item): item is ExpressionRuleDefinition => item !== null);
};

const normalizeImportedRuleVariables = (
  value: unknown,
): RuleVariableDefinition[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      const key = normalizeText(raw.key);
      if (!key) return null;
      const variableValue =
        typeof raw.value === "string" ? raw.value : String(raw.value ?? "");
      return { key, value: variableValue };
    })
    .filter((item): item is RuleVariableDefinition => !!item);
};

const ruleScopeDoc = `规则新增字段（建议）: scopeKind
- team: 在队伍组(dynamic-group: team)上执行（当前已生效）
- shikigami: 在式神组(dynamic-group: shikigami)上执行（当前已生效）

注意
- scopeKind 决定“规则运行上下文”
- 告警点击定位固定为：触发该规则的 dynamic-group`;

const ruleContextDoc = `当 scopeKind = "team"（队伍规则）
ctx.team.shikigamis: 式神数组
- 单项示例: { nodeId: "n1", assetId: "sp_kaguya", name: "辉夜姬", library: "shikigami" }

ctx.team.yuhuns: 御魂数组
- 单项示例: { nodeId: "n2", assetId: "p4_poshi", name: "破势", library: "yuhun" }

ctx.group.id / ctx.group.name
- 示例: "team-1" / "冲榜队A"

当 scopeKind = "shikigami"（式神规则）
ctx.unit.shikigami: 当前式神对象（单个）
- 示例: { nodeId: "n1", assetId: "sp_kaguya", name: "辉夜姬", library: "shikigami" }

ctx.unit.yuhuns: 当前式神关联御魂数组
- 单项示例: { nodeId: "n2", assetId: "p4_poshi", name: "破势", library: "yuhun" }

通用共享变量
shared.vars（变量 tab 配置后的 key/value 映射）
- 示例:
  shared.vars["供火式神"] = ["辉夜姬", "座敷童子"]
  shared.vars["输出式神"] = ["阿修罗", "茨木童子"]`;

const ruleFunctionDoc = `count(value)
- 用途: 计算数量（数组长度 / 字符串长度）
- team 示例: count(ctx.team.shikigamis) >= 5
- shikigami 示例: count(ctx.unit.yuhuns) >= 1

contains(collection, target)
- 用途: 判断集合或字符串是否包含目标值
- team 示例: contains(map(ctx.team.shikigamis, "name"), "辉夜姬")

intersect(leftArray, rightArray)
- 用途: 取数组交集（去重）
- team 示例: count(intersect(map(ctx.team.shikigamis, "name"), getVar("供火式神"))) > 0

map(collection, "fieldName")
- 用途: 提取对象数组字段
- team 示例: map(ctx.team.shikigamis, "name")
- shikigami 示例: map(ctx.unit.yuhuns, "name")

unique(collection)
- 用途: 数组去重
- team 示例: count(unique(map(ctx.team.yuhuns, "name"))) >= 2

exists(value)
- 用途: 判断值是否存在（非 null/空串；数组需长度>0）
- 示例: exists(getVar("核心式神"))

lower(value) / upper(value)
- 用途: 字符串大小写转换
- 示例: contains(lower("PoShi"), "poshi")

getVar("变量Key")
- 用途: 获取变量 tab 里配置的值（通常返回字符串数组）
- 示例: getVar("供火式神")`;

const ruleSyntaxDoc = `支持
- 字面量: "文本" / 数字 / true / false / null
- 数组: ["辉夜姬", "座敷童子"]
- 路径: ctx.team.shikigamis / ctx.unit.shikigami / shared.vars
- 函数调用: count(...), contains(...), intersect(...), map(...)
- 逻辑运算: && || !
- 比较运算: == != > >= < <=
- 算术运算: + - * /
- 括号: ( ... )

不支持
- index 语法（如 getIndexOf / arr[0]）
- 自定义遍历语法（for/while/foreach）
- 自定义函数定义
- 赋值语句
- eval/new Function`;

const ruleExamplesDoc = `1) [team] 队伍至少有一个供火式神
count(intersect(map(ctx.team.shikigamis, "name"), getVar("供火式神"))) > 0

2) [team] 队伍里不能同时出现千姬和腹肌清姬
contains(map(ctx.team.shikigamis, "name"), "千姬") && contains(map(ctx.team.shikigamis, "name"), "腹肌清姬")

3) [team] 队伍御魂至少 2 种（避免全员同御魂）
count(unique(map(ctx.team.yuhuns, "name"))) >= 2

4) [shikigami] 当前式神是辉夜姬且其关联御魂包含破势
ctx.unit.shikigami.name == "辉夜姬" && contains(map(ctx.unit.yuhuns, "name"), "破势")`;

export function useToolbarRuleManagement(
  options: UseToolbarRuleManagementOptions,
) {
  const { state, showMessage } = options;
  const ruleBundleImportInputRef = ref<HTMLInputElement | null>(null);
  const ruleManagerTab = ref<"rules" | "variables" | "docs">("rules");
  const ruleConfigDraft = ref<GroupRulesConfig>(
    cloneRuleConfig(readSharedGroupRulesConfig()),
  );
  const ruleEditorVisible = ref(false);
  const editingRuleIndex = ref<number | null>(null);
  const ruleEditorDraft = ref<ExpressionRuleDefinition | null>(null);

  const cancelRuleEditor = () => {
    ruleEditorVisible.value = false;
    editingRuleIndex.value = null;
    ruleEditorDraft.value = null;
  };

  const reloadRuleManagerDraft = () => {
    ruleConfigDraft.value = cloneRuleConfig(readSharedGroupRulesConfig());
    cancelRuleEditor();
  };

  const openRuleManager = () => {
    reloadRuleManagerDraft();
    ruleManagerTab.value = "rules";
    state.showRuleManagerDialog = true;
    ruleEditorVisible.value = false;
    editingRuleIndex.value = null;
    ruleEditorDraft.value = null;
  };

  const exportRuleBundle = () => {
    try {
      const payload = {
        version: ruleConfigDraft.value.version,
        expressionRules: ruleConfigDraft.value.expressionRules,
        ruleVariables: ruleConfigDraft.value.ruleVariables,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `rule-bundle-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      showMessage("success", "规则变量已导出");
    } catch (error) {
      console.error("导出规则变量失败:", error);
      showMessage("error", "导出失败");
    }
  };

  const triggerRuleBundleImport = () => {
    ruleBundleImportInputRef.value?.click();
  };

  const handleRuleBundleImport = async (event: Event) => {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0];
    if (!file) {
      if (target) target.value = "";
      return;
    }

    try {
      const rawText = await file.text();
      const parsed = JSON.parse(rawText) as Record<string, unknown>;
      const importedRules = normalizeImportedExpressionRules(
        parsed.expressionRules,
      );
      const importedVariables = normalizeImportedRuleVariables(
        parsed.ruleVariables,
      );
      if (!importedRules.length && !importedVariables.length) {
        showMessage("warning", "导入文件中没有可用的规则或变量");
        return;
      }
      ruleConfigDraft.value = {
        ...ruleConfigDraft.value,
        expressionRules: importedRules,
        ruleVariables: importedVariables,
      };
      cancelRuleEditor();
      showMessage("success", "规则变量已导入，请点击“应用并生效”");
    } catch (error) {
      console.error("导入规则变量失败:", error);
      showMessage("error", "导入失败，文件格式错误");
    } finally {
      if (target) target.value = "";
    }
  };

  const openExpressionRuleEditor = (index: number) => {
    const target = ruleConfigDraft.value.expressionRules[index];
    if (!target) return;
    editingRuleIndex.value = index;
    ruleEditorDraft.value = cloneExpressionRule(target);
    ruleEditorVisible.value = true;
  };

  const addExpressionRule = () => {
    const newRule = createExpressionRule();
    ruleConfigDraft.value.expressionRules.push(newRule);
    openExpressionRuleEditor(ruleConfigDraft.value.expressionRules.length - 1);
    ruleManagerTab.value = "rules";
  };

  const removeExpressionRule = (index: number) => {
    if (editingRuleIndex.value === index) {
      cancelRuleEditor();
    }
    ruleConfigDraft.value.expressionRules.splice(index, 1);
    if (editingRuleIndex.value != null && editingRuleIndex.value > index) {
      editingRuleIndex.value -= 1;
    }
  };

  const saveRuleEditor = () => {
    const index = editingRuleIndex.value;
    const draft = ruleEditorDraft.value;
    if (index == null || !draft) {
      return;
    }
    const ruleId = draft.id?.trim();
    const condition = draft.condition?.trim();
    const message = draft.message?.trim();
    if (!ruleId || !condition || !message) {
      showMessage("warning", "规则 ID、条件表达式、提示文案不能为空");
      return;
    }
    const normalized = cloneExpressionRule({
      ...draft,
      id: ruleId,
      condition,
      message,
    });
    ruleConfigDraft.value.expressionRules[index] = normalized;
    cancelRuleEditor();
  };

  const addRuleVariable = () => {
    ruleConfigDraft.value.ruleVariables.push(createRuleVariable());
    ruleManagerTab.value = "variables";
  };

  const removeRuleVariable = (index: number) => {
    ruleConfigDraft.value.ruleVariables.splice(index, 1);
  };

  const applyRuleManagerConfig = () => {
    try {
      const normalized = writeSharedGroupRulesConfig(ruleConfigDraft.value);
      ruleConfigDraft.value = cloneRuleConfig(normalized);
      showMessage("success", "规则配置已生效");
    } catch (error) {
      console.error("应用规则配置失败:", error);
      showMessage("error", "规则配置应用失败");
    }
  };

  const restoreDefaultRuleConfig = () => {
    ElMessageBox.confirm("恢复默认会覆盖当前规则和变量，是否继续？", "提示", {
      confirmButtonText: "恢复默认",
      cancelButtonText: "取消",
      type: "warning",
    })
      .then(() => {
        const normalized = writeSharedGroupRulesConfig(
          DEFAULT_GROUP_RULES_CONFIG,
        );
        ruleConfigDraft.value = cloneRuleConfig(normalized);
        cancelRuleEditor();
        showMessage("success", "已恢复默认规则配置");
      })
      .catch(() => {
        // 用户取消
      });
  };

  return {
    ruleBundleImportInputRef,
    ruleManagerTab,
    ruleConfigDraft,
    ruleEditorVisible,
    ruleEditorDraft,
    ruleScopeDoc,
    ruleContextDoc,
    ruleSyntaxDoc,
    ruleFunctionDoc,
    ruleExamplesDoc,
    openRuleManager,
    addExpressionRule,
    addRuleVariable,
    exportRuleBundle,
    triggerRuleBundleImport,
    reloadRuleManagerDraft,
    applyRuleManagerConfig,
    restoreDefaultRuleConfig,
    handleRuleBundleImport,
    openExpressionRuleEditor,
    removeExpressionRule,
    removeRuleVariable,
    cancelRuleEditor,
    saveRuleEditor,
  };
}
