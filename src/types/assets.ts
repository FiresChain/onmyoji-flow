export const ASSET_LIBRARY_IDS = [
  "shikigami",
  "yuhun",
  "onmyoji",
  "onmyojiSkill",
  "hunling",
] as const;

export type AssetLibraryId = (typeof ASSET_LIBRARY_IDS)[number];

export type AssetLocale = "zh" | "ja" | "en";

export type LocalizedText = {
  zh: string;
  ja: string;
  en: string;
};

export interface BaseAssetRecord {
  id: string;
  library: AssetLibraryId;
  avatar: string;
  names: LocalizedText;
}

export interface ShikigamiAssetRecord extends BaseAssetRecord {
  library: "shikigami";
  rarity: string;
}

export interface YuhunAssetRecord extends BaseAssetRecord {
  library: "yuhun";
  type: string;
  shortNames: LocalizedText;
}

export interface OnmyojiAssetRecord extends BaseAssetRecord {
  library: "onmyoji";
}

export interface OnmyojiSkillAssetRecord extends BaseAssetRecord {
  library: "onmyojiSkill";
  onmyojiId: string;
  skillId: string;
}

export interface HunLingAssetRecord extends BaseAssetRecord {
  library: "hunling";
}

export type AnyAssetRecord =
  | ShikigamiAssetRecord
  | YuhunAssetRecord
  | OnmyojiAssetRecord
  | OnmyojiSkillAssetRecord
  | HunLingAssetRecord;
