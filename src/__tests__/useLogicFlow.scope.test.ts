import { describe, expect, it, vi } from "vitest";
import {
  clearLogicFlowInstance,
  createLogicFlowScope,
  destroyLogicFlowInstance,
  getLogicFlowInstance,
  setLogicFlowInstance,
} from "@/ts/useLogicFlow";

const createMockLogicFlow = () => ({
  destroy: vi.fn(),
});

describe("useLogicFlow EditorContext compatibility", () => {
  it("keeps explicit instance scopes isolated without a module registry", () => {
    const scopeA = createLogicFlowScope();
    const scopeB = createLogicFlowScope();
    const lfA = createMockLogicFlow();
    const lfB = createMockLogicFlow();

    setLogicFlowInstance(lfA as any, scopeA);
    setLogicFlowInstance(lfB as any, scopeB);

    expect(getLogicFlowInstance(scopeA)).toBe(lfA);
    expect(getLogicFlowInstance(scopeB)).toBe(lfB);

    destroyLogicFlowInstance(scopeA);
    expect(lfA.destroy).toHaveBeenCalledOnce();
    expect(getLogicFlowInstance(scopeA)).toBeNull();
    expect(getLogicFlowInstance(scopeB)).toBe(lfB);

    destroyLogicFlowInstance(scopeB);
    expect(lfB.destroy).toHaveBeenCalledOnce();
  });

  it("uses identity checks when a stale owner tries to clear a replacement", () => {
    const scope = createLogicFlowScope();
    const first = createMockLogicFlow();
    const second = createMockLogicFlow();

    setLogicFlowInstance(first as any, scope);
    setLogicFlowInstance(second as any, scope);
    clearLogicFlowInstance(scope, first as any);

    expect(first.destroy).toHaveBeenCalledOnce();
    expect(second.destroy).not.toHaveBeenCalled();
    expect(getLogicFlowInstance(scope)).toBe(second);

    clearLogicFlowInstance(scope, second as any);
    expect(second.destroy).toHaveBeenCalledOnce();
    expect(getLogicFlowInstance(scope)).toBeNull();
  });
});
