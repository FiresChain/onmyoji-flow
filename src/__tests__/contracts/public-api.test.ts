import { afterEach, describe, expect, it } from "vitest";

import YysEditorEmbedComponent from "@/YysEditorEmbed.vue";
import OnmyojiFlow, * as publicApi from "@/index.js";
import * as flowRuntime from "@/flowRuntime";

describe("public package API contract", () => {
  afterEach(() => {
    publicApi.setAssetBaseUrl();
    localStorage.removeItem(publicApi.GROUP_RULES_STORAGE_KEY);
  });

  it("keeps the embed component default, named, and preview alias exports identical", () => {
    expect(OnmyojiFlow).toBe(YysEditorEmbedComponent);
    expect(publicApi.YysEditorEmbed).toBe(YysEditorEmbedComponent);
    expect(publicApi.YysEditorPreview).toBe(YysEditorEmbedComponent);
  });

  it("keeps every current runtime export on the package entry", () => {
    expect(publicApi).toMatchObject({
      getFlowPluginsByCapability: flowRuntime.getFlowPluginsByCapability,
      resolveFlowPlugins: flowRuntime.resolveFlowPlugins,
      getDefaultFlowNodes: flowRuntime.getDefaultFlowNodes,
      resolveFlowNodes: flowRuntime.resolveFlowNodes,
      registerFlowNodes: flowRuntime.registerFlowNodes,
    });
  });

  it("keeps every current asset export on the package entry", () => {
    expect(publicApi).toMatchObject({
      setAssetBaseUrl: expect.any(Function),
      getAssetBaseUrl: expect.any(Function),
      resolveAssetUrl: expect.any(Function),
      CUSTOM_ASSET_STORAGE_KEY: "yys-editor.custom-assets.v1",
    });

    publicApi.setAssetBaseUrl("/contract-assets");
    expect(publicApi.getAssetBaseUrl()).toBe("/contract-assets/");
    expect(publicApi.resolveAssetUrl("/assets/example.png")).toBe(
      "/contract-assets/assets/example.png",
    );
  });

  it("keeps every current group-rule export on the package entry", () => {
    expect(publicApi).toMatchObject({
      DEFAULT_GROUP_RULES_CONFIG: expect.objectContaining({
        version: expect.any(Number),
      }),
      validateGraphGroupRules: expect.any(Function),
      GROUP_RULES_STORAGE_KEY: "yys-editor.group-rules.v1",
      readSharedGroupRulesConfig: expect.any(Function),
      writeSharedGroupRulesConfig: expect.any(Function),
      clearSharedGroupRulesConfig: expect.any(Function),
    });

    const stored = publicApi.writeSharedGroupRulesConfig(
      publicApi.DEFAULT_GROUP_RULES_CONFIG,
    );
    expect(publicApi.readSharedGroupRulesConfig()).toEqual(stored);

    publicApi.clearSharedGroupRulesConfig();
    expect(localStorage.getItem(publicApi.GROUP_RULES_STORAGE_KEY)).toBeNull();
  });
});

describe("flowRuntime resolution contract", () => {
  it("keeps the legacy permissive runtime types usable", () => {
    const plugin: flowRuntime.FlowPlugin = { customPluginShape: true };
    const registration: flowRuntime.FlowNodeRegistration = {
      type: "model-only-contract-node",
      model: { customModelShape: true },
    };

    expect(publicApi.resolveFlowPlugins("interactive", [plugin])).toEqual([
      plugin,
    ]);
    expect(publicApi.resolveFlowNodes([registration])).toEqual([registration]);
  });

  it("provides non-empty render-only and interactive plugin presets", () => {
    const renderOnly = publicApi.getFlowPluginsByCapability("render-only");
    const interactive = publicApi.getFlowPluginsByCapability("interactive");

    expect(renderOnly).toHaveLength(2);
    expect(interactive).toHaveLength(7);
    expect(interactive).toEqual(expect.arrayContaining(renderOnly));
    expect(publicApi.getFlowPluginsByCapability("render-only")).toEqual(
      renderOnly,
    );
    expect(publicApi.getFlowPluginsByCapability("render-only")).not.toBe(
      renderOnly,
    );
  });

  it("uses a non-empty custom plugin list as a replacement", () => {
    const customPlugins = [{ name: "custom-contract-plugin" }];

    const resolved = publicApi.resolveFlowPlugins("interactive", customPlugins);

    expect(resolved).toBe(customPlugins);
    expect(resolved).toEqual(customPlugins);
  });

  it("falls back to the capability preset for an empty plugin list", () => {
    const emptyPlugins: unknown[] = [];
    const preset = publicApi.getFlowPluginsByCapability("render-only");

    const resolved = publicApi.resolveFlowPlugins("render-only", emptyPlugins);

    expect(resolved).toEqual(preset);
    expect(resolved).not.toBe(emptyPlugins);
  });

  it("provides the complete default node registry", () => {
    const nodes = publicApi.getDefaultFlowNodes();

    expect(nodes.map(({ type }) => type)).toEqual([
      "propertySelect",
      "imageNode",
      "assetSelector",
      "textNode",
      "vectorNode",
    ]);
    expect(nodes.every(({ component }) => component != null)).toBe(true);
    expect(publicApi.getDefaultFlowNodes()).toEqual(nodes);
    expect(publicApi.getDefaultFlowNodes()).not.toBe(nodes);
  });

  it("uses a non-empty custom node registry as a replacement", () => {
    const customNodes = [
      {
        type: "custom-contract-node",
        component: { name: "CustomContractNode" },
      },
    ];

    const resolved = publicApi.resolveFlowNodes(customNodes);

    expect(resolved).toBe(customNodes);
    expect(resolved).toEqual(customNodes);
  });

  it("falls back to the default node registry for an empty list", () => {
    const emptyNodes: flowRuntime.FlowNodeRegistration[] = [];
    const defaults = publicApi.getDefaultFlowNodes();

    const resolved = publicApi.resolveFlowNodes(emptyNodes);

    expect(resolved).toEqual(defaults);
    expect(resolved).not.toBe(emptyNodes);
  });
});
