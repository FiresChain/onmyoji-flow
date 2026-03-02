import { describe, expect, it, vi } from 'vitest';
import {
  createLogicFlowScope,
  destroyLogicFlowInstance,
  getLogicFlowInstance,
  setLogicFlowInstance
} from '@/ts/useLogicFlow';

const createMockLogicFlow = () => ({
  destroy: vi.fn()
});

describe('useLogicFlow scope isolation', () => {
  it('keeps default-scope API compatibility', () => {
    const lf = createMockLogicFlow();

    setLogicFlowInstance(lf as any);
    expect(getLogicFlowInstance()).toBe(lf);

    destroyLogicFlowInstance();
    expect(lf.destroy).toHaveBeenCalledTimes(1);
    expect(getLogicFlowInstance()).toBeNull();
  });

  it('isolates instances across scopes', () => {
    const scopeA = createLogicFlowScope();
    const scopeB = createLogicFlowScope();
    const lfA = createMockLogicFlow();
    const lfB = createMockLogicFlow();

    setLogicFlowInstance(lfA as any, scopeA);
    setLogicFlowInstance(lfB as any, scopeB);

    expect(getLogicFlowInstance(scopeA)).toBe(lfA);
    expect(getLogicFlowInstance(scopeB)).toBe(lfB);

    destroyLogicFlowInstance(scopeA);
    expect(lfA.destroy).toHaveBeenCalledTimes(1);
    expect(getLogicFlowInstance(scopeA)).toBeNull();
    expect(getLogicFlowInstance(scopeB)).toBe(lfB);

    destroyLogicFlowInstance(scopeB);
    expect(lfB.destroy).toHaveBeenCalledTimes(1);
    expect(getLogicFlowInstance(scopeB)).toBeNull();
  });
});
