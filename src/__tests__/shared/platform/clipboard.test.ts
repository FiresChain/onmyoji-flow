import { describe, expect, it, vi } from "vitest";

import { writeClipboardText } from "@/shared/platform/clipboard";

describe("clipboard adapter", () => {
  it("writes through the provided clipboard port", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await writeClipboardText("graph data", { writeText });

    expect(writeText).toHaveBeenCalledWith("graph data");
  });

  it("reports an unavailable clipboard port", async () => {
    await expect(writeClipboardText("graph data", null)).rejects.toThrow(
      "Clipboard API is unavailable",
    );
  });
});
