import type { GroupConfig, SelectorConfig } from "@/types/selector";
import type { AssetLibraryId } from "@/types/assets";
import { getAssetDataSource } from "@/configs/assetCatalog";
import {
  normalizeAssetLibraryIdWithFallback,
  resolveAssetLocale,
} from "@/utils/assetLibrary";

type TranslateFn = (key: string) => string;

const ALL_GROUP_NAME = "ALL";
const ALL_GROUP_KEY = "selector.group.all";

const translate = (t: TranslateFn | undefined, key: string, fallback: string) => {
  const translated = t?.(key);
  if (typeof translated === "string" && translated.trim() && translated !== key) {
    return translated;
  }
  return fallback;
};

const createAllGroup = (t?: TranslateFn): GroupConfig => ({
  label: translate(t, ALL_GROUP_KEY, "全部"),
  name: ALL_GROUP_NAME,
});

const buildGroupsFromField = (
  dataSource: Array<Record<string, any>>,
  field: string,
  options?: {
    order?: string[];
    labelMap?: Record<string, string>;
  },
): GroupConfig[] => {
  const raw = new Set<string>();
  dataSource.forEach((item) => {
    const value = item?.[field];
    if (value != null && String(value).trim()) {
      raw.add(String(value));
    }
  });

  const values = Array.from(raw);
  const order = options?.order ?? [];
  const ordered = [
    ...order.filter((value) => values.includes(value)),
    ...values
      .filter((value) => !order.includes(value))
      .sort((a, b) => a.localeCompare(b)),
  ];

  return ordered.map((value) => ({
    label: options?.labelMap?.[value] ?? value,
    name: value,
  }));
};

const buildShikigamiPreset = (
  localeInput: unknown,
  t?: TranslateFn,
): SelectorConfig => {
  const dataSource = getAssetDataSource("shikigami", localeInput) as Array<
    Record<string, any>
  >;
  const groups = buildGroupsFromField(dataSource, "rarity", {
    order: ["UR", "SP", "SSR", "SR", "R", "N", "L", "G"],
    labelMap: {
      UR: "UR",
      SP: "SP",
      SSR: "SSR",
      SR: "SR",
      R: "R",
      N: "N",
      L: translate(t, "selector.group.rarity.L", "联动"),
      G: translate(t, "selector.group.rarity.G", "呱太"),
    },
  });
  return {
    title: translate(t, "selector.title.shikigami", "请选择式神"),
    dataSource,
    groupField: "rarity",
    groups: [createAllGroup(t), ...groups],
    itemRender: {
      imageField: "avatar",
      labelField: "name",
    },
    itemKeyField: "id",
  };
};

const buildYuhunPreset = (
  localeInput: unknown,
  t?: TranslateFn,
): SelectorConfig => {
  const dataSource = getAssetDataSource("yuhun", localeInput) as Array<
    Record<string, any>
  >;
  const groups = buildGroupsFromField(dataSource, "type", {
    order: [
      "attack",
      "Crit",
      "Health",
      "Defense",
      "ControlHit",
      "ControlMiss",
      "PVE",
      "CritDamage",
    ],
    labelMap: {
      attack: translate(t, "selector.group.yuhun.attack", "攻击类"),
      Crit: translate(t, "selector.group.yuhun.Crit", "暴击类"),
      Health: translate(t, "selector.group.yuhun.Health", "生命类"),
      Defense: translate(t, "selector.group.yuhun.Defense", "防御类"),
      ControlHit: translate(t, "selector.group.yuhun.ControlHit", "效果命中"),
      ControlMiss: translate(
        t,
        "selector.group.yuhun.ControlMiss",
        "效果抵抗",
      ),
      PVE: translate(t, "selector.group.yuhun.PVE", "PVE"),
      CritDamage: translate(
        t,
        "selector.group.yuhun.CritDamage",
        "暴击伤害",
      ),
    },
  });
  return {
    title: translate(t, "selector.title.yuhun", "请选择御魂"),
    dataSource,
    groupField: "type",
    groups: [createAllGroup(t), ...groups],
    itemRender: {
      imageField: "avatar",
      labelField: "name",
    },
    itemKeyField: "id",
  };
};

const buildOnmyojiPreset = (
  localeInput: unknown,
  t?: TranslateFn,
): SelectorConfig => {
  const dataSource = getAssetDataSource("onmyoji", localeInput) as Array<
    Record<string, any>
  >;
  return {
    title: translate(t, "selector.title.onmyoji", "请选择阴阳师"),
    dataSource,
    groupField: null,
    groups: [createAllGroup(t)],
    itemRender: {
      imageField: "avatar",
      labelField: "name",
    },
    itemKeyField: "id",
  };
};

const buildOnmyojiSkillPreset = (
  localeInput: unknown,
  t?: TranslateFn,
): SelectorConfig => {
  const dataSource = getAssetDataSource("onmyojiSkill", localeInput) as Array<
    Record<string, any>
  >;
  const onmyojiData = getAssetDataSource("onmyoji", localeInput) as Array<
    Record<string, any>
  >;
  const groups = onmyojiData.map((item) => ({
    label: String(item.name || ""),
    name: String(item.name || ""),
  }));
  return {
    title: translate(t, "selector.title.onmyojiSkill", "请选择阴阳师技能"),
    dataSource,
    groupField: "onmyojiName",
    groups: [createAllGroup(t), ...groups],
    itemRender: {
      imageField: "avatar",
      labelField: "name",
    },
    itemKeyField: "id",
  };
};

export const getSelectorPreset = (
  libraryInput: string,
  options?: {
    locale?: unknown;
    t?: TranslateFn;
  },
): SelectorConfig => {
  const library = normalizeAssetLibraryIdWithFallback(libraryInput);
  const locale = resolveAssetLocale(options?.locale);
  const t = options?.t;

  if (library === "shikigami") {
    return buildShikigamiPreset(locale, t);
  }
  if (library === "yuhun") {
    return buildYuhunPreset(locale, t);
  }
  if (library === "onmyoji") {
    return buildOnmyojiPreset(locale, t);
  }
  return buildOnmyojiSkillPreset(locale, t);
};

export const getSelectorPresets = (
  options?: {
    locale?: unknown;
    t?: TranslateFn;
  },
): Record<AssetLibraryId, SelectorConfig> => ({
  shikigami: getSelectorPreset("shikigami", options),
  yuhun: getSelectorPreset("yuhun", options),
  onmyoji: getSelectorPreset("onmyoji", options),
  onmyojiSkill: getSelectorPreset("onmyojiSkill", options),
});

export const SELECTOR_PRESETS = getSelectorPresets({
  locale: "zh",
});
