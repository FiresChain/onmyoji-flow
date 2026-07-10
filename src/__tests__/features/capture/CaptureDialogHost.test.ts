import { flushPromises, shallowMount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import CaptureDialogHost from "@/features/capture/ui/CaptureDialogHost.vue";
import CapturePreview from "@/features/capture/ui/CapturePreview.vue";
import WatermarkDialog from "@/features/capture/ui/WatermarkDialog.vue";
import type { CaptureDialogHostExpose } from "@/features/capture/ui/types";

const mocks = vi.hoisted(() => ({
  addWatermarkToImage: vi.fn(),
  readWatermarkSettings: vi.fn(),
  writeWatermarkSettings: vi.fn(),
  downloadDataUrl: vi.fn(),
}));

vi.mock("@/features/capture/captureCanvas", () => ({
  addWatermarkToImage: mocks.addWatermarkToImage,
}));

vi.mock("@/features/capture/watermarkRepository", () => ({
  readWatermarkSettings: mocks.readWatermarkSettings,
  writeWatermarkSettings: mocks.writeWatermarkSettings,
}));

vi.mock("@/shared/platform/download", () => ({
  downloadDataUrl: mocks.downloadDataUrl,
}));

const watermark = {
  text: "mark",
  fontSize: 24,
  color: "#ffffff",
  angle: -20,
  rows: 2,
  cols: 3,
};

describe("CaptureDialogHost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readWatermarkSettings.mockReturnValue({ ...watermark });
    mocks.writeWatermarkSettings.mockReturnValue(true);
    mocks.addWatermarkToImage.mockResolvedValue(
      "data:image/png;base64,watermarked",
    );
  });

  it("owns watermark state and persists the apply command", async () => {
    const wrapper = shallowMount(CaptureDialogHost, {
      props: {
        captureSnapshot: vi.fn(),
        showMessage: vi.fn(),
      },
    });
    const host = wrapper.vm as unknown as CaptureDialogHostExpose;

    host.openWatermark();
    await nextTick();
    const dialog = wrapper.getComponent(WatermarkDialog);
    expect(dialog.props("open")).toBe(true);
    expect(dialog.props("settings")).toMatchObject(watermark);

    dialog.vm.$emit("apply");
    await nextTick();
    expect(mocks.writeWatermarkSettings).toHaveBeenCalledWith(
      expect.objectContaining(watermark),
    );
    expect(dialog.props("open")).toBe(false);
  });

  it("creates a watermarked preview and clears it on close", async () => {
    const captureSnapshot = vi
      .fn()
      .mockResolvedValue("data:image/png;base64,snapshot");
    const wrapper = shallowMount(CaptureDialogHost, {
      props: { captureSnapshot, showMessage: vi.fn() },
    });
    const host = wrapper.vm as unknown as CaptureDialogHostExpose;

    await host.prepareCapture();
    await flushPromises();

    expect(captureSnapshot).toHaveBeenCalledOnce();
    expect(mocks.addWatermarkToImage).toHaveBeenCalledWith(
      "data:image/png;base64,snapshot",
      expect.objectContaining(watermark),
    );
    const preview = wrapper.getComponent(CapturePreview);
    expect(preview.props()).toMatchObject({
      open: true,
      image: "data:image/png;base64,watermarked",
    });

    preview.vm.$emit("close");
    await nextTick();
    expect(preview.props("image")).toBeNull();
  });

  it("reports snapshot failures without opening the preview", async () => {
    const showMessage = vi.fn();
    const wrapper = shallowMount(CaptureDialogHost, {
      props: {
        captureSnapshot: vi.fn().mockRejectedValue(new Error("capture denied")),
        showMessage,
      },
    });
    const host = wrapper.vm as unknown as CaptureDialogHostExpose;

    await host.prepareCapture();

    expect(showMessage).toHaveBeenCalledWith(
      "error",
      "截图失败: capture denied",
    );
    expect(wrapper.getComponent(CapturePreview).props("open")).toBe(false);
  });
});
