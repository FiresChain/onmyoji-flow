import { describe, expect, it } from "vitest";
import {
  createRootDocumentDownloadPayload,
  DEFAULT_DOCUMENT_FILE_NAME,
  DOCUMENT_JSON_MIME_TYPE,
  migrateAndValidateGraphData,
  migrateAndValidateRootDocument,
  parseGraphDataJson,
  parseRootDocumentJson,
  stringifyGraphData,
  stringifyRootDocument,
} from "@/features/workspace/documentTransfer";
import documentTransferSource from "@/features/workspace/documentTransfer.ts?raw";

const createDocument = () => ({
  schemaVersion: "1.0.0",
  rootExtension: { owner: "workspace-test" },
  fileList: [
    {
      id: "file-a",
      label: "File A",
      name: "File A",
      visible: true,
      type: "FLOW",
      fileExtension: { pinned: true },
      graphRawData: {
        graphExtension: "keep-graph",
        nodes: [
          {
            id: "node-a",
            type: "rect",
            x: 10,
            y: 20,
            nodeExtension: "keep-node",
            properties: { custom: "keep-property" },
          },
        ],
        edges: [],
      },
      transform: {
        SCALE_X: 1,
        SCALE_Y: 1,
        TRANSLATE_X: 0,
        TRANSLATE_Y: 0,
      },
      createdAt: 10,
      updatedAt: 20,
    },
  ],
  activeFile: "File A",
  activeFileId: "file-a",
});

describe("workspace document transfer", () => {
  it("migrates legacy documents and preserves unknown root/file/graph fields", () => {
    const input = {
      rootExtension: { owner: "legacy-plugin" },
      fileList: [
        {
          name: "Legacy File",
          label: "Legacy File",
          visible: true,
          type: "FLOW",
          fileExtension: "keep-file",
          graphRawData: {
            graphExtension: "keep-graph",
            nodes: [
              {
                id: "legacy-node",
                type: "shikigamiSelect",
                x: 1,
                y: 2,
                nodeExtension: "keep-node",
                properties: {
                  shikigami: { id: "sp-1" },
                  propertyExtension: "keep-property",
                },
              },
            ],
            edges: [],
          },
          fileMetadata: { source: "legacy" },
        },
      ],
      activeFile: "Legacy File",
    };

    const result = migrateAndValidateRootDocument(input, {
      now: 99,
      createFileId: () => "generated-file",
    });

    expect(result.ok).toBe(true);
    if ("error" in result) return;
    expect(result.value).toMatchObject({
      schemaVersion: "1.0.0",
      activeFileId: "generated-file",
      rootExtension: { owner: "legacy-plugin" },
      fileList: [
        {
          id: "generated-file",
          fileExtension: "keep-file",
          fileMetadata: { source: "legacy" },
          createdAt: 99,
          updatedAt: 99,
          graphRawData: { graphExtension: "keep-graph" },
        },
      ],
    });
    expect(result.value.fileList[0].graphRawData.nodes[0]).toMatchObject({
      type: "assetSelector",
      nodeExtension: "keep-node",
      properties: {
        assetLibrary: "shikigami",
        propertyExtension: "keep-property",
      },
    });
    expect(input.fileList[0].graphRawData.nodes[0].type).toBe(
      "shikigamiSelect",
    );
  });

  it("parses and stringifies valid documents without dropping extensions", () => {
    const parsed = parseRootDocumentJson(JSON.stringify(createDocument()), {
      context: "workspace-import",
    });

    expect(parsed.ok).toBe(true);
    if ("error" in parsed) return;
    expect(parsed.value.rootExtension).toEqual({ owner: "workspace-test" });
    expect(parsed.value.fileList[0].fileExtension).toEqual({ pinned: true });
    expect(parsed.value.fileList[0].graphRawData.graphExtension).toBe(
      "keep-graph",
    );

    const serialized = stringifyRootDocument(parsed.value, {
      context: "workspace-export",
      space: 2,
    });
    expect(serialized.ok).toBe(true);
    if ("error" in serialized) return;
    expect(serialized.value).toContain('\n  "rootExtension"');
    expect(JSON.parse(serialized.value)).toMatchObject({
      rootExtension: { owner: "workspace-test" },
      fileList: [{ fileExtension: { pinned: true } }],
    });
  });

  it("returns schema validation details with context and cause", () => {
    const result = migrateAndValidateRootDocument(
      { ...createDocument(), schemaVersion: "2.0.0" },
      { context: "restore-files" },
    );

    expect(result.ok).toBe(false);
    if (!("error" in result)) return;
    expect(result.error).toMatchObject({
      code: "INVALID_DOCUMENT",
      context: "restore-files",
      message: expect.stringContaining("$.schemaVersion"),
      cause: expect.any(Array),
    });
    expect(result.error.validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "$.schemaVersion" }),
      ]),
    );
  });

  it("returns parse failures without throwing", () => {
    const result = parseRootDocumentJson("{broken", {
      context: "json-import",
    });

    expect(result.ok).toBe(false);
    if (!("error" in result)) return;
    expect(result.error).toMatchObject({
      code: "INVALID_JSON",
      context: "json-import",
      message: expect.stringContaining("Unable to parse JSON"),
      cause: expect.any(Error),
    });
  });

  it("returns serialization failures for cyclic extension data", () => {
    const input = createDocument() as ReturnType<typeof createDocument> & {
      cyclic?: unknown;
    };
    input.cyclic = input;

    const result = stringifyRootDocument(input, {
      context: "json-export",
    });

    expect(result.ok).toBe(false);
    if (!("error" in result)) return;
    expect(result.error).toMatchObject({
      code: "SERIALIZE_ERROR",
      context: "json-export",
      cause: expect.any(TypeError),
    });
  });

  it("creates a downloadable JSON payload without performing a download", () => {
    const result = createRootDocumentDownloadPayload(createDocument());

    expect(result.ok).toBe(true);
    if ("error" in result) return;
    expect(result.value).toMatchObject({
      fileName: DEFAULT_DOCUMENT_FILE_NAME,
      mimeType: DOCUMENT_JSON_MIME_TYPE,
    });
    expect(result.value.fileName).toBe("onmyoji-flow-files.json");
    expect(JSON.parse(result.value.content).rootExtension).toEqual({
      owner: "workspace-test",
    });
  });

  it("migrates, validates, parses, and stringifies GraphData", () => {
    const graph = {
      graphExtension: "keep-graph",
      nodes: [
        {
          id: "legacy-node",
          type: "yuhunSelect",
          x: 10,
          y: 20,
          nodeExtension: "keep-node",
          properties: { yuhun: { id: "soul-1" } },
        },
      ],
      edges: [],
    };

    const migrated = migrateAndValidateGraphData(graph, { now: 10 });
    expect(migrated.ok).toBe(true);
    if ("error" in migrated) return;
    expect(migrated.value).toMatchObject({
      graphExtension: "keep-graph",
      nodes: [
        {
          type: "assetSelector",
          nodeExtension: "keep-node",
          properties: { assetLibrary: "yuhun" },
        },
      ],
    });

    const serialized = stringifyGraphData(migrated.value);
    expect(serialized.ok).toBe(true);
    if ("error" in serialized) return;
    const reparsed = parseGraphDataJson(serialized.value);
    expect(reparsed).toEqual(migrated);
  });

  it("reports GraphData validation paths relative to the graph root", () => {
    const result = migrateAndValidateGraphData({
      nodes: [{ id: "", type: "rect", properties: {} }],
      edges: [],
    });

    expect(result.ok).toBe(false);
    if (!("error" in result)) return;
    expect(result.error.validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "$.nodes[0].id" }),
      ]),
    );
  });

  it("keeps the transfer module free of platform and runtime dependencies", () => {
    [
      "localStorage",
      "sessionStorage",
      "document.createElement",
      "window.",
      "URL.createObjectURL",
      "Blob",
      "element-plus",
      "LogicFlow",
    ].forEach((forbiddenToken) => {
      expect(documentTransferSource).not.toContain(forbiddenToken);
    });
  });
});
