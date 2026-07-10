import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { useFlowGroupRuleOrchestrator } from "@/editor/runtime/groupRuleOrchestrator";
import type { GroupRuleWarning } from "@/utils/groupRules";
import { validateGraphGroupRules } from "@/utils/groupRules";
import { subscribeSharedGroupRulesConfig } from "@/utils/groupRulesConfigSource";
import { getProblemTargetCandidateIds } from "@/utils/problemTarget";

vi.mock("@/utils/groupRules", () => ({
  validateGraphGroupRules: vi.fn(),
}));

vi.mock("@/utils/groupRulesConfigSource", () => ({
  subscribeSharedGroupRulesConfig: vi.fn(),
}));

vi.mock("@/utils/problemTarget", () => ({
  getProblemTargetCandidateIds: vi.fn(),
}));

const mockedValidateGraphGroupRules = vi.mocked(validateGraphGroupRules);
const mockedSubscribeSharedGroupRulesConfig = vi.mocked(
  subscribeSharedGroupRulesConfig,
);
const mockedGetProblemTargetCandidateIds = vi.mocked(
  getProblemTargetCandidateIds,
);

const warningFixture: GroupRuleWarning = {
  id: "g1::rule-1",
  ruleId: "rule-1",
  code: "R001",
  severity: "warning",
  groupId: "group-1",
  groupName: "Group 1",
  message: "warning message",
  nodeIds: ["node-1"],
};

describe("useFlowGroupRuleOrchestrator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedValidateGraphGroupRules.mockReset();
    mockedSubscribeSharedGroupRulesConfig.mockReset();
    mockedGetProblemTargetCandidateIds.mockReset();
    mockedValidateGraphGroupRules.mockReturnValue([]);
    mockedSubscribeSharedGroupRulesConfig.mockReturnValue(() => {});
    mockedGetProblemTargetCandidateIds.mockReturnValue([]);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("keeps refresh/schedule validation behavior unchanged", () => {
    const graphData = { nodes: [{ id: "node-1" }], edges: [] };
    mockedValidateGraphGroupRules.mockReturnValue([warningFixture]);
    const lf = ref({
      getGraphRawData: vi.fn(() => graphData),
    } as any);
    const selectedNode = ref<any>(null);
    const showMessage = vi.fn();

    const { groupRuleWarnings, scheduleGroupRuleValidation } =
      useFlowGroupRuleOrchestrator({
        lf,
        selectedNode,
        showMessage,
      });

    scheduleGroupRuleValidation(0);
    vi.runAllTimers();

    expect(mockedValidateGraphGroupRules).toHaveBeenCalledTimes(1);
    expect(mockedValidateGraphGroupRules).toHaveBeenCalledWith(graphData);
    expect(groupRuleWarnings.value).toEqual([warningFixture]);
  });

  it("keeps problem location behavior unchanged", () => {
    const clearSelectElements = vi.fn();
    const selectElementById = vi.fn();
    const focusOn = vi.fn();
    const getNodeDataById = vi.fn(() => ({ id: "node-1", type: "rect" }));
    const getNodeModelById = vi.fn((id: string) =>
      id === "node-1" ? { id } : null,
    );
    mockedGetProblemTargetCandidateIds.mockReturnValue([
      "missing-id",
      "node-1",
    ]);

    const lf = ref({
      getNodeModelById,
      clearSelectElements,
      selectElementById,
      focusOn,
      getNodeDataById,
    } as any);
    const selectedNode = ref<any>(null);
    const showMessage = vi.fn();

    const { locateProblemNode } = useFlowGroupRuleOrchestrator({
      lf,
      selectedNode,
      showMessage,
    });

    locateProblemNode(warningFixture);

    expect(clearSelectElements).toHaveBeenCalledTimes(1);
    expect(selectElementById).toHaveBeenCalledWith("node-1", false, false);
    expect(focusOn).toHaveBeenCalledWith("node-1");
    expect(selectedNode.value).toEqual({ id: "node-1", type: "rect" });
    expect(showMessage).not.toHaveBeenCalled();
  });

  it("subscribes shared config updates and triggers immediate revalidation", () => {
    const graphData = { nodes: [{ id: "node-1" }], edges: [] };
    mockedValidateGraphGroupRules.mockReturnValue([warningFixture]);
    const unsubscribe = vi.fn();
    let onSharedConfigUpdate: (() => void) | null = null;
    mockedSubscribeSharedGroupRulesConfig.mockImplementation(
      (listener: () => void) => {
        onSharedConfigUpdate = listener;
        return unsubscribe;
      },
    );

    const lf = ref({
      getGraphRawData: vi.fn(() => graphData),
    } as any);
    const selectedNode = ref<any>(null);
    const showMessage = vi.fn();

    const {
      groupRuleWarnings,
      mountGroupRuleOrchestrator,
      disposeGroupRuleOrchestrator,
    } = useFlowGroupRuleOrchestrator({
      lf,
      selectedNode,
      showMessage,
    });

    const dispose = mountGroupRuleOrchestrator();
    expect(mockedSubscribeSharedGroupRulesConfig).toHaveBeenCalledTimes(1);
    expect(onSharedConfigUpdate).not.toBeNull();

    onSharedConfigUpdate?.();
    vi.runAllTimers();

    expect(mockedValidateGraphGroupRules).toHaveBeenCalledWith(graphData);
    expect(groupRuleWarnings.value).toEqual([warningFixture]);

    dispose();
    disposeGroupRuleOrchestrator();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("returns an idempotent disposer that cancels timers and ignores stale subscriptions", () => {
    const unsubscribe = vi.fn();
    let onSharedConfigUpdate: (() => void) | null = null;
    mockedSubscribeSharedGroupRulesConfig.mockImplementation(
      (listener: () => void) => {
        onSharedConfigUpdate = listener;
        return unsubscribe;
      },
    );
    const lf = ref({
      getGraphRawData: vi.fn(() => ({ nodes: [], edges: [] })),
    } as any);
    const orchestrator = useFlowGroupRuleOrchestrator({
      lf,
      selectedNode: ref<any>(null),
      showMessage: vi.fn(),
    });

    const dispose = orchestrator.mountGroupRuleOrchestrator();
    orchestrator.scheduleGroupRuleValidation(50);
    dispose();
    orchestrator.disposeGroupRuleOrchestrator();
    onSharedConfigUpdate?.();
    vi.runAllTimers();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(mockedValidateGraphGroupRules).not.toHaveBeenCalled();
  });

  it("does not let a stale mount disposer clean a replacement subscription", () => {
    const listeners: Array<() => void> = [];
    const unsubscribers = [vi.fn(), vi.fn()];
    mockedSubscribeSharedGroupRulesConfig.mockImplementation((listener) => {
      const index = listeners.push(listener) - 1;
      return unsubscribers[index];
    });
    const orchestrator = useFlowGroupRuleOrchestrator({
      lf: ref({
        getGraphRawData: vi.fn(() => ({ nodes: [], edges: [] })),
      } as any),
      selectedNode: ref<any>(null),
      showMessage: vi.fn(),
    });

    const disposeFirstMount = orchestrator.mountGroupRuleOrchestrator();
    const disposeSecondMount = orchestrator.mountGroupRuleOrchestrator();
    expect(unsubscribers[0]).toHaveBeenCalledOnce();

    disposeFirstMount();
    listeners[0]();
    listeners[1]();
    disposeSecondMount();
    vi.runAllTimers();

    expect(unsubscribers[1]).toHaveBeenCalledOnce();
    expect(mockedValidateGraphGroupRules).not.toHaveBeenCalled();
  });

  it("returns to an unmounted state when subscription setup fails", () => {
    mockedSubscribeSharedGroupRulesConfig.mockImplementation(() => {
      throw new Error("subscribe failed");
    });
    const orchestrator = useFlowGroupRuleOrchestrator({
      lf: ref({
        getGraphRawData: vi.fn(() => ({ nodes: [], edges: [] })),
      } as any),
      selectedNode: ref<any>(null),
      showMessage: vi.fn(),
    });

    expect(() => orchestrator.mountGroupRuleOrchestrator()).toThrow(
      "subscribe failed",
    );
    orchestrator.scheduleGroupRuleValidation(0);
    orchestrator.disposeGroupRuleOrchestrator();
    vi.runAllTimers();

    expect(mockedValidateGraphGroupRules).not.toHaveBeenCalled();
  });
});
