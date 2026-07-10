import { beforeEach, describe, expect, it, vi } from "vitest";

const { elMessage } = vi.hoisted(() => ({
  elMessage: vi.fn(),
}));

vi.mock("element-plus", () => ({
  ElMessage: elMessage,
}));

import { useGlobalMessage } from "@/shared/ui/useGlobalMessage";

describe("global message adapter", () => {
  beforeEach(() => {
    elMessage.mockReset();
  });

  it("forwards the requested message type and content", () => {
    const { showMessage } = useGlobalMessage();

    showMessage("warning", "Rule validation failed");

    expect(elMessage).toHaveBeenCalledOnce();
    expect(elMessage).toHaveBeenCalledWith({
      type: "warning",
      message: "Rule validation failed",
    });
  });
});
