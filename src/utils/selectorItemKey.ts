import type { SelectorConfig } from "@/types/selector";

const toTrimmedString = (value: unknown): string =>
  value == null ? "" : String(value).trim();

export const buildSelectorItemKey = (
  item: any,
  index: number,
  config: SelectorConfig,
): string => {
  const explicitKeyField = config.itemKeyField;
  const explicitKey = explicitKeyField
    ? toTrimmedString(item?.[explicitKeyField])
    : "";
  if (explicitKey) {
    return explicitKey;
  }

  const assetId = toTrimmedString(item?.assetId);
  if (assetId) {
    return assetId;
  }

  const id = toTrimmedString(item?.id);
  if (id) {
    return id;
  }

  const skillId = toTrimmedString(item?.skillId);
  if (skillId) {
    return `${toTrimmedString(item?.library) || "asset"}:${skillId}`;
  }

  const imageField = config.itemRender.imageField;
  const labelField = config.itemRender.labelField;
  const imageValue = toTrimmedString(item?.[imageField]);
  const labelValue = toTrimmedString(item?.[labelField]);
  return `fallback:${index}:${labelValue}:${imageValue}`;
};
