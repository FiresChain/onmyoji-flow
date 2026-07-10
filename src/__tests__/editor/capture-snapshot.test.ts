import { afterEach, describe, expect, it, vi } from "vitest";

import { captureEditorSnapshot } from "@/editor/commands/captureSnapshot";

describe("editor capture snapshot command", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the existing snapshot options and restores dynamic-group visibility", async () => {
    const hiddenGroup = { type: "dynamic-group", visible: false };
    const visibleGroup = { type: "dynamic-group", visible: true };
    const getSnapshotBase64 = vi.fn(async () => {
      expect(hiddenGroup.visible).toBe(false);
      expect(visibleGroup.visible).toBe(false);
      return { data: "data:image/png;base64,snapshot" };
    });
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const logicFlow = {
      graphModel: { nodes: [hiddenGroup, visibleGroup, { type: "rect" }] },
      getSnapshotBase64,
    } as any;

    await expect(captureEditorSnapshot(logicFlow)).resolves.toBe(
      "data:image/png;base64,snapshot",
    );
    expect(getSnapshotBase64).toHaveBeenCalledWith(undefined, undefined, {
      fileType: "png",
      backgroundColor: "#ffffff",
      partial: false,
      padding: 20,
    });
    expect(hiddenGroup.visible).toBe(false);
    expect(visibleGroup.visible).toBe(true);
  });

  it("restores visibility when snapshot creation rejects", async () => {
    const group = { type: "dynamic-group", visible: true };
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const logicFlow = {
      graphModel: { nodes: [group] },
      getSnapshotBase64: vi.fn(async () => {
        throw new Error("snapshot failed");
      }),
    } as any;

    await expect(captureEditorSnapshot(logicFlow)).rejects.toThrow(
      "snapshot failed",
    );
    expect(group.visible).toBe(true);
  });
});
