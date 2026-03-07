import type LogicFlow from "@logicflow/core";
import type { GraphData } from "@logicflow/core";
import { ref, type Ref } from "vue";
import {
  validateGraphGroupRules,
  type GroupRuleWarning,
} from "@/utils/groupRules";
import { subscribeSharedGroupRulesConfig } from "@/utils/groupRulesConfigSource";
import { getProblemTargetCandidateIds } from "@/utils/problemTarget";

type MessageType = "success" | "warning" | "info" | "error";

interface FlowGroupRuleOrchestratorOptions {
  lf: Ref<LogicFlow | null>;
  selectedNode: Ref<any>;
  showMessage: (type: MessageType, message: string) => void;
}

export function useFlowGroupRuleOrchestrator(
  options: FlowGroupRuleOrchestratorOptions,
) {
  const { lf, selectedNode, showMessage } = options;
  const groupRuleWarnings = ref<GroupRuleWarning[]>([]);
  let groupRuleValidationTimer: ReturnType<typeof setTimeout> | null = null;
  let unsubscribeSharedGroupRules: (() => void) | null = null;

  function refreshGroupRuleWarnings() {
    const lfInstance = lf.value;
    if (!lfInstance) {
      groupRuleWarnings.value = [];
      return;
    }
    const graphData = lfInstance.getGraphRawData() as GraphData;
    groupRuleWarnings.value = validateGraphGroupRules(graphData);
  }

  function scheduleGroupRuleValidation(delay = 120) {
    if (groupRuleValidationTimer) {
      clearTimeout(groupRuleValidationTimer);
    }
    groupRuleValidationTimer = setTimeout(() => {
      refreshGroupRuleWarnings();
    }, delay);
  }

  function locateProblemNode(warning: GroupRuleWarning) {
    const lfInstance = lf.value as any;
    if (!lfInstance) return;

    const candidateIds = getProblemTargetCandidateIds(warning);
    const targetId = candidateIds.find(
      (id) => !!lfInstance.getNodeModelById(id),
    );
    if (!targetId) {
      showMessage("warning", "未找到告警对应节点，可能已被删除");
      return;
    }

    try {
      lfInstance.clearSelectElements?.();
      lfInstance.selectElementById?.(targetId, false, false);
      lfInstance.focusOn?.(targetId);
      const nodeData = lfInstance.getNodeDataById?.(targetId);
      if (nodeData) {
        selectedNode.value = nodeData;
      }
    } catch (error) {
      console.error("定位告警节点失败:", error);
      showMessage("error", "定位节点失败");
    }
  }

  function mountGroupRuleOrchestrator() {
    unsubscribeSharedGroupRules?.();
    unsubscribeSharedGroupRules = subscribeSharedGroupRulesConfig(() => {
      scheduleGroupRuleValidation(0);
    });
  }

  function disposeGroupRuleOrchestrator() {
    if (groupRuleValidationTimer) {
      clearTimeout(groupRuleValidationTimer);
      groupRuleValidationTimer = null;
    }
    unsubscribeSharedGroupRules?.();
    unsubscribeSharedGroupRules = null;
  }

  return {
    groupRuleWarnings,
    refreshGroupRuleWarnings,
    scheduleGroupRuleValidation,
    locateProblemNode,
    mountGroupRuleOrchestrator,
    disposeGroupRuleOrchestrator,
  };
}
