import { describe, expect, it } from "vitest";
import { createLogicFlowScope } from "@/ts/useLogicFlow";
import { useCanvasSettings } from "@/ts/useCanvasSettings";

describe("useCanvasSettings EditorContext isolation", () => {
  it("shares refs inside one context and isolates separate contexts", () => {
    const scopeA = createLogicFlowScope();
    const scopeB = createLogicFlowScope();
    const firstLookup = useCanvasSettings(scopeA);
    const secondLookup = useCanvasSettings(scopeA);
    const otherScope = useCanvasSettings(scopeB);

    expect(firstLookup.selectionEnabled).toBe(secondLookup.selectionEnabled);
    firstLookup.selectionEnabled.value = false;
    firstLookup.snapGridEnabled.value = false;
    firstLookup.snaplineEnabled.value = false;

    expect(secondLookup.selectionEnabled.value).toBe(false);
    expect(otherScope.selectionEnabled.value).toBe(true);
    expect(otherScope.snapGridEnabled.value).toBe(true);
    expect(otherScope.snaplineEnabled.value).toBe(true);

    scopeA.dispose();
    scopeB.dispose();
  });

  it("starts a new context with fresh settings", () => {
    const previous = createLogicFlowScope();
    previous.settings.selectionEnabled.value = false;
    previous.dispose();

    const replacement = createLogicFlowScope();
    expect(replacement.settings.selectionEnabled.value).toBe(true);
    expect(replacement.settings.snapGridEnabled.value).toBe(true);
    expect(replacement.settings.snaplineEnabled.value).toBe(true);
    replacement.dispose();
  });
});
