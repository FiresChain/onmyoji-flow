import { describe, expect, it } from "vitest";

import toolbarSource from "@/components/Toolbar.vue?raw";
import assetsHostSource from "@/features/assets/ui/AssetsDialogHost.vue?raw";
import commandBarSource from "@/shells/common/EditorCommandBar.vue?raw";
import aboutDialogsSource from "@/shells/standalone/AboutDialogs.vue?raw";
import captureHostSource from "@/features/capture/ui/CaptureDialogHost.vue?raw";
import groupRuleHostSource from "@/features/group-rules/ui/GroupRuleDialogHost.vue?raw";
import importDialogSource from "@/features/workspace/ui/ImportDialog.vue?raw";
import workspaceHostSource from "@/features/workspace/ui/WorkspaceDialogHost.vue?raw";

describe("editor command surface architecture", () => {
  it("keeps EditorCommandBar emit-only and free of business dependencies", () => {
    expect(commandBarSource).toContain('emit("command", command)');
    expect(commandBarSource).toContain('emit("update:selectionEnabled"');
    expect(commandBarSource).toContain('emit("update:snapGridEnabled"');
    expect(commandBarSource).toContain('emit("update:snaplineEnabled"');
    expect(commandBarSource).toContain('emit("update:locale"');
    expect(commandBarSource).not.toMatch(
      /@\/features|@\/editor|useWorkspace|getLogicFlow|LogicFlow|localStorage|sessionStorage|<el-dialog/,
    );
    expect(commandBarSource).not.toContain("toolbar-actions-legacy");
  });

  it("keeps dialog state and business commands in their feature hosts", () => {
    expect(workspaceHostSource).toContain("useDocumentCommands");
    expect(workspaceHostSource).toContain("<DataPreviewDialog");
    expect(workspaceHostSource).toContain("<ImportDialog");
    expect(workspaceHostSource).toContain("onBeforeUnmount");
    expect(workspaceHostSource).toContain("defineExpose");

    expect(captureHostSource).toContain("readWatermarkSettings");
    expect(captureHostSource).toContain("<CapturePreview");
    expect(captureHostSource).toContain("<WatermarkDialog");
    expect(captureHostSource).toContain("defineExpose");

    expect(groupRuleHostSource).toContain("useRuleManager");
    expect(groupRuleHostSource).toContain("<RuleManagerDialog");
    expect(groupRuleHostSource).toContain("<RuleEditorDialog");
    expect(groupRuleHostSource).toContain("defineExpose");

    expect(aboutDialogsSource).toContain("createSafeStorage");
    expect(aboutDialogsSource).toContain("defineExpose({\n  showUpdateLog");

    expect(assetsHostSource).toContain("<NodeThemeDialog");
    expect(assetsHostSource).toContain("<AssetManagerDialog");
    expect(assetsHostSource).toContain("defineExpose");
  });

  it("keeps Toolbar as a zero-inline-dialog composition facade", () => {
    for (const component of [
      "EditorCommandBar",
      "WorkspaceDialogHost",
      "CaptureDialogHost",
      "AssetsDialogHost",
      "GroupRuleDialogHost",
      "AboutDialogs",
    ]) {
      expect(toolbarSource).toContain(`<${component}`);
    }
    expect(toolbarSource).not.toContain("<el-dialog");
    expect(toolbarSource).not.toMatch(
      /useToolbar|localStorage|document\.createElement|FileReader|navigator\.clipboard|getGraphRawData|\.render\(|\.zoom\(/,
    );
  });

  it("keeps team-code UI wiring in ImportDialog without importing its service", () => {
    expect(importDialogSource).toContain('label="json"');
    expect(importDialogSource).toContain('label="teamCode"');
    expect(importDialogSource).toContain('accept="image/*"');
    expect(importDialogSource).toContain("emit('chooseJson')");
    expect(importDialogSource).toContain("emit('importTeamCode')");
    expect(importDialogSource).toContain("emit('importTeamCodeQr', $event)");
    expect(importDialogSource).not.toMatch(
      /teamCodeService|convertTeamCodeToRootDocument|decodeTeamCodeFromQrImage|useWorkspaceSession/,
    );
  });
});
