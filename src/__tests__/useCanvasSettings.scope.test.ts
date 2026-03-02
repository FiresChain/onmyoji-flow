import { describe, expect, it } from 'vitest';
import { createLogicFlowScope } from '@/ts/useLogicFlow';
import { destroyCanvasSettingsScope, useCanvasSettings } from '@/ts/useCanvasSettings';

describe('useCanvasSettings scope isolation', () => {
  it('shares the same refs within one scope', () => {
    const scope = createLogicFlowScope();
    const settingsA = useCanvasSettings(scope);
    const settingsB = useCanvasSettings(scope);

    expect(settingsA.selectionEnabled).toBe(settingsB.selectionEnabled);
    expect(settingsA.snapGridEnabled).toBe(settingsB.snapGridEnabled);
    expect(settingsA.snaplineEnabled).toBe(settingsB.snaplineEnabled);

    settingsA.selectionEnabled.value = false;
    settingsA.snapGridEnabled.value = false;
    settingsA.snaplineEnabled.value = false;

    expect(settingsB.selectionEnabled.value).toBe(false);
    expect(settingsB.snapGridEnabled.value).toBe(false);
    expect(settingsB.snaplineEnabled.value).toBe(false);

    destroyCanvasSettingsScope(scope);
  });

  it('isolates settings across scopes and resets after destroy', () => {
    const scopeA = createLogicFlowScope();
    const scopeB = createLogicFlowScope();

    const settingsA = useCanvasSettings(scopeA);
    const settingsB = useCanvasSettings(scopeB);

    settingsA.selectionEnabled.value = false;
    settingsA.snapGridEnabled.value = false;
    settingsA.snaplineEnabled.value = false;

    expect(settingsB.selectionEnabled.value).toBe(true);
    expect(settingsB.snapGridEnabled.value).toBe(true);
    expect(settingsB.snaplineEnabled.value).toBe(true);

    destroyCanvasSettingsScope(scopeA);
    const nextSettingsA = useCanvasSettings(scopeA);
    expect(nextSettingsA.selectionEnabled.value).toBe(true);
    expect(nextSettingsA.snapGridEnabled.value).toBe(true);
    expect(nextSettingsA.snaplineEnabled.value).toBe(true);

    destroyCanvasSettingsScope(scopeA);
    destroyCanvasSettingsScope(scopeB);
  });
});
