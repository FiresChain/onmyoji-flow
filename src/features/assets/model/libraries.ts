import type { AssetLibraryId } from "./types";

export interface AssetLibrary {
  id: AssetLibraryId;
  label: string;
  selectorPreset: AssetLibraryId;
}

export const ASSET_LIBRARIES: AssetLibrary[] = [
  { id: "shikigami", label: "式神", selectorPreset: "shikigami" },
  { id: "yuhun", label: "御魂", selectorPreset: "yuhun" },
  { id: "onmyoji", label: "阴阳师", selectorPreset: "onmyoji" },
  { id: "onmyojiSkill", label: "阴阳师技能", selectorPreset: "onmyojiSkill" },
  { id: "hunling", label: "契灵", selectorPreset: "hunling" },
  // 未来可扩展：技能图标、装备等
];
