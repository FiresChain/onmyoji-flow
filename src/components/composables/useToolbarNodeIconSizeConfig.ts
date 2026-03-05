import { computed, ref } from "vue";
import {
  buildMergedNodeIconSizeByType,
  DEFAULT_NODE_ICON_SIZE_BY_TYPE,
  type NodeIconSizeByType,
  type NodeIconSizeTarget,
} from "@/types/nodeIconSize";
import {
  clearNodeIconSizeThemeConfig,
  readNodeIconSizeThemeConfig,
  writeNodeIconSizeThemeConfig,
} from "@/utils/nodeIconSizeThemeSource";

type ToolbarNodeIconSizeStoreLike = {
  getActiveFileNodeIconSizeByType?: () => NodeIconSizeByType;
  setActiveFileNodeIconSizeByType?: (next: NodeIconSizeByType) => void;
  resetActiveFileNodeIconSizeByType?: () => void;
};

interface UseToolbarNodeIconSizeConfigOptions {
  filesStore: ToolbarNodeIconSizeStoreLike;
  showMessage: (
    type: "success" | "warning" | "info" | "error",
    message: string,
  ) => void;
  t: (key: string) => string;
}

type NodeIconSizeDraft = Record<NodeIconSizeTarget, { width: number; height: number }>;

const TARGETS: NodeIconSizeTarget[] = ["assetSelector", "imageNode"];

const cloneRecord = (
  input: Record<NodeIconSizeTarget, { width: number; height: number }>,
): NodeIconSizeDraft => ({
  assetSelector: { ...input.assetSelector },
  imageNode: { ...input.imageNode },
});

const toNodeIconSizeByType = (draft: NodeIconSizeDraft): NodeIconSizeByType => ({
  assetSelector: { ...draft.assetSelector },
  imageNode: { ...draft.imageNode },
});

const resolveFileDraft = (
  globalConfig: NodeIconSizeByType,
  fileConfig: NodeIconSizeByType,
): NodeIconSizeDraft => {
  return cloneRecord(
    buildMergedNodeIconSizeByType({
      globalOverride: globalConfig,
      fileOverride: fileConfig,
    }),
  );
};

export function useToolbarNodeIconSizeConfig(
  options: UseToolbarNodeIconSizeConfigOptions,
) {
  const { filesStore, showMessage, t } = options;
  const showNodeIconSizeDialog = ref(false);
  const nodeIconSizeTab = ref<"global" | "file">("global");
  const globalDraft = ref<NodeIconSizeDraft>(cloneRecord(DEFAULT_NODE_ICON_SIZE_BY_TYPE));
  const fileDraft = ref<NodeIconSizeDraft>(cloneRecord(DEFAULT_NODE_ICON_SIZE_BY_TYPE));

  const labels = computed<Record<NodeIconSizeTarget, string>>(() => ({
    assetSelector: t("nodeIconSize.target.assetSelector"),
    imageNode: t("nodeIconSize.target.imageNode"),
  }));

  const loadDraft = () => {
    const globalConfig = readNodeIconSizeThemeConfig();
    const fileConfig = filesStore.getActiveFileNodeIconSizeByType?.() || {};
    globalDraft.value = cloneRecord(
      buildMergedNodeIconSizeByType({ globalOverride: globalConfig }),
    );
    fileDraft.value = resolveFileDraft(globalConfig, fileConfig);
  };

  const openNodeIconSizeDialog = () => {
    loadDraft();
    nodeIconSizeTab.value = "global";
    showNodeIconSizeDialog.value = true;
  };

  const applyNodeIconSizeConfig = () => {
    const nextGlobal = toNodeIconSizeByType(globalDraft.value);
    writeNodeIconSizeThemeConfig(nextGlobal);

    const nextFile = toNodeIconSizeByType(fileDraft.value);
    filesStore.setActiveFileNodeIconSizeByType?.(nextFile);
    showNodeIconSizeDialog.value = false;
    showMessage("success", t("nodeIconSize.message.applied"));
  };

  const resetGlobalNodeIconSizeConfig = () => {
    clearNodeIconSizeThemeConfig();
    globalDraft.value = cloneRecord(DEFAULT_NODE_ICON_SIZE_BY_TYPE);
    const currentFileConfig = filesStore.getActiveFileNodeIconSizeByType?.() || {};
    fileDraft.value = resolveFileDraft({}, currentFileConfig);
    showMessage("success", t("nodeIconSize.message.resetGlobal"));
  };

  const resetFileNodeIconSizeConfig = () => {
    filesStore.resetActiveFileNodeIconSizeByType?.();
    const globalConfig = readNodeIconSizeThemeConfig();
    fileDraft.value = resolveFileDraft(globalConfig, {});
    showMessage("success", t("nodeIconSize.message.resetFile"));
  };

  const resetSingleTarget = (tab: "global" | "file", target: NodeIconSizeTarget) => {
    if (!TARGETS.includes(target)) {
      return;
    }
    if (tab === "global") {
      globalDraft.value[target] = { ...DEFAULT_NODE_ICON_SIZE_BY_TYPE[target] };
      return;
    }
    const globalConfig = readNodeIconSizeThemeConfig();
    const merged = buildMergedNodeIconSizeByType({ globalOverride: globalConfig });
    fileDraft.value[target] = { ...merged[target] };
  };

  return {
    TARGETS,
    labels,
    showNodeIconSizeDialog,
    nodeIconSizeTab,
    globalDraft,
    fileDraft,
    openNodeIconSizeDialog,
    applyNodeIconSizeConfig,
    resetGlobalNodeIconSizeConfig,
    resetFileNodeIconSizeConfig,
    resetSingleTarget,
  };
}

