import { afterEach, describe, expect, it, vi } from "vitest";

import {
  downloadDataUrl,
  downloadTextPayload,
} from "@/shared/platform/download";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("platform download", () => {
  it("clicks a temporary anchor for a data URL and removes it afterward", () => {
    let clickedAnchor: HTMLAnchorElement | null = null;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clickedAnchor = this;
      expect(document.body.contains(this)).toBe(true);
    });

    downloadDataUrl("data:text/plain,hello", "hello.txt");

    expect(clickedAnchor?.href).toBe("data:text/plain,hello");
    expect(clickedAnchor?.download).toBe("hello.txt");
    expect(clickedAnchor?.rel).toBe("noopener");
    expect(document.body.contains(clickedAnchor)).toBe(false);
  });

  it("removes the temporary anchor when click throws", () => {
    let clickedAnchor: HTMLAnchorElement | null = null;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clickedAnchor = this;
      throw new Error("click failed");
    });

    expect(() => downloadDataUrl("data:text/plain,hello", "hello.txt")).toThrow(
      "click failed",
    );
    expect(document.body.contains(clickedAnchor)).toBe(false);
  });

  it("downloads text through a Blob URL and revokes it asynchronously", () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn((_blob: Blob) => "blob:test-download");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    downloadTextPayload({
      fileName: "document.json",
      content: '{"value":1}',
      mimeType: "application/json;charset=utf-8",
    });

    const blob = createObjectURL.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/json;charset=utf-8");
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runOnlyPendingTimers();
    expect(revokeObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test-download");
  });

  it("schedules Blob URL cleanup from finally when clicking fails", () => {
    vi.useFakeTimers();
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:failed-download"),
      revokeObjectURL,
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      throw new Error("click failed");
    });

    expect(() =>
      downloadTextPayload({
        fileName: "document.txt",
        content: "content",
      }),
    ).toThrow("click failed");
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runOnlyPendingTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:failed-download");
  });
});
