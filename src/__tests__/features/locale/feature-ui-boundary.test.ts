import { describe, expect, it } from "vitest";

import captureHostSource from "@/features/capture/ui/CaptureDialogHost.vue?raw";
import capturePreviewSource from "@/features/capture/ui/CapturePreview.vue?raw";
import watermarkDialogSource from "@/features/capture/ui/WatermarkDialog.vue?raw";
import dataPreviewSource from "@/features/workspace/ui/DataPreviewDialog.vue?raw";
import importDialogSource from "@/features/workspace/ui/ImportDialog.vue?raw";
import workspaceHostSource from "@/features/workspace/ui/WorkspaceDialogHost.vue?raw";

describe("feature UI locale boundary", () => {
  const leafSources = [
    capturePreviewSource,
    watermarkDialogSource,
    dataPreviewSource,
    importDialogSource,
  ];

  it("receives translation without importing editor context facades", () => {
    leafSources.forEach((source) => {
      expect(source).toContain("translate?: Translate");
      expect(source).not.toContain("@/ts/useSafeI18n");
      expect(source).not.toContain("@/editor/context");
    });
  });

  it("passes translation through workspace and capture hosts", () => {
    [workspaceHostSource, captureHostSource].forEach((source) => {
      expect(source).toMatch(/translate\?:\s*\w*Translate/);
      expect(source).toContain(':translate="props.translate"');
      expect(source).not.toContain("@/ts/useSafeI18n");
      expect(source).not.toContain("@/editor/context");
    });
  });
});
