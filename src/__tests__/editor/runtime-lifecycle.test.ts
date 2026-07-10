import { describe, expect, it, vi } from "vitest";

import { mountEditorResources } from "@/editor/runtime/lifecycle";

describe("editor runtime lifecycle", () => {
  it("rolls back completed mounts in reverse order and preserves the mount error", () => {
    const calls: string[] = [];
    const mountError = new Error("mount failed");

    expect(() =>
      mountEditorResources([
        () => () => calls.push("dispose-first"),
        () => () => {
          calls.push("dispose-second");
          throw new Error("rollback failed");
        },
        () => {
          throw mountError;
        },
      ]),
    ).toThrow(mountError);
    expect(calls).toEqual(["dispose-second", "dispose-first"]);
  });

  it("runs every disposer once even when one cleanup throws", () => {
    const first = vi.fn();
    const second = vi.fn(() => {
      throw new Error("cleanup failed");
    });
    const third = vi.fn();
    const dispose = mountEditorResources([
      () => first,
      () => second,
      () => third,
    ]);

    expect(() => dispose()).toThrow("cleanup failed");
    expect(third).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
    expect(first).toHaveBeenCalledOnce();

    dispose();
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
    expect(third).toHaveBeenCalledOnce();
  });
});
