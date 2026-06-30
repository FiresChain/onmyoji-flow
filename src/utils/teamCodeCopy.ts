import { normalizeDynamicGroupMeta } from "@/utils/graphSchema";
import type { GraphData } from "@/YysEditorEmbed.vue";

export type TeamCodeCopyItem = {
  id: string;
  label: string;
  code: string;
  groupName: string;
};

const resolveTeamCodeToCopy = (
  teamCode?: ReturnType<typeof normalizeDynamicGroupMeta>["teamCode"],
): string => {
  if (!teamCode?.enabled) {
    return "";
  }
  const shortCode = teamCode.shortCode.trim();
  const longCode = teamCode.longCode.trim();
  if (teamCode.preferred === "short" && shortCode) {
    return shortCode;
  }
  return longCode || shortCode;
};

export const getTeamCodeCopyItems = (
  graphData?: GraphData | null,
): TeamCodeCopyItem[] => {
  const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];

  return nodes
    .filter((node) => node?.type === "dynamic-group")
    .map((node) => {
      const groupMeta = normalizeDynamicGroupMeta(node.properties?.groupMeta);
      if (groupMeta.groupKind !== "team") {
        return null;
      }

      const code = resolveTeamCodeToCopy(groupMeta.teamCode);
      if (!code) {
        return null;
      }

      const label = groupMeta.teamCode?.label || "复制阵容码";
      const groupName = groupMeta.groupName || label;

      return {
        id: String(node.id),
        label,
        code,
        groupName,
      };
    })
    .filter((item): item is TeamCodeCopyItem => !!item);
};
