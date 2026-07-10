import type { FlowNodeRegistration } from "@/core/logicflow/types";
import type { AssetLibraryId } from "@/types/assets";

import AssetSelectorNode from "./Node.vue";

export const ASSET_SELECTOR_NODE_TYPE = "assetSelector";

export interface AssetSelectorNodeProperties extends Record<string, unknown> {
  assetLibrary: AssetLibraryId;
  selectedAsset: null;
}

export const createAssetSelectorNodeProperties = (
  assetLibrary: AssetLibraryId = "shikigami",
): AssetSelectorNodeProperties => ({
  assetLibrary,
  selectedAsset: null,
});

export const createAssetSelectorNodeRegistration =
  (): FlowNodeRegistration => ({
    type: ASSET_SELECTOR_NODE_TYPE,
    component: AssetSelectorNode,
  });
