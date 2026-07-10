import type LogicFlow from "@logicflow/core";
import { ref, type Ref } from "vue";

import { captureGraphData } from "@/core/logicflow/graphIO";
import {
  subscribeSharedGroupRulesConfig,
  validateGraphGroupRules,
  type GroupRuleWarning,
} from "@/features/group-rules/public";
import { getProblemTargetCandidateIds } from "@/editor/commands/problemNavigation";

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
  let mounted = false;
  let mountGeneration = 0;

  function refreshGroupRuleWarnings() {
    const lfInstance = lf.value;
    if (!lfInstance) {
      groupRuleWarnings.value = [];
      return;
    }
    const graphData = captureGraphData(lfInstance);
    groupRuleWarnings.value = validateGraphGroupRules(graphData);
  }

  function scheduleGroupRuleValidation(delay = 120) {
    if (groupRuleValidationTimer !== null) {
      clearTimeout(groupRuleValidationTimer);
    }
    groupRuleValidationTimer = setTimeout(() => {
      groupRuleValidationTimer = null;
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
    disposeGroupRuleOrchestrator();
    const generation = ++mountGeneration;
    mounted = true;
    try {
      unsubscribeSharedGroupRules = subscribeSharedGroupRulesConfig(() => {
        if (!mounted || generation !== mountGeneration) return;
        scheduleGroupRuleValidation(0);
      });
    } catch (error) {
      if (generation === mountGeneration) {
        disposeGroupRuleOrchestrator();
      }
      throw error;
    }
    return () => {
      if (generation === mountGeneration) {
        disposeGroupRuleOrchestrator();
      }
    };
  }

  function disposeGroupRuleOrchestrator() {
    mountGeneration += 1;
    mounted = false;
    if (groupRuleValidationTimer !== null) {
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
