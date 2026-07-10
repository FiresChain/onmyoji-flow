import { describe, expect, it } from "vitest";
import { CURRENT_SCHEMA_VERSION } from "@/core/document/migrations";
import {
  ROOT_DOCUMENT_V1_SCHEMA,
  formatRootDocumentValidationErrors,
  isRootDocumentV1,
  validateRootDocumentV1,
} from "@/core/document/validation";

const createValidDocument = () => ({
  schemaVersion: CURRENT_SCHEMA_VERSION,
  rootExtension: "allowed",
  fileList: [
    {
      id: "file-1",
      label: "File 1",
      name: "File 1",
      visible: true,
      type: "FLOW",
      fileExtension: "allowed",
      graphRawData: {
        graphExtension: "allowed",
        nodes: [
          {
            id: "node-1",
            type: "rect",
            zIndex: 3,
            properties: {},
            nodeExtension: "allowed",
          },
        ],
        edges: [],
      },
      transform: {
        SCALE_X: 1,
        SCALE_Y: 1,
        TRANSLATE_X: 0,
        TRANSLATE_Y: 0,
        transformExtension: "allowed",
      },
    },
  ],
  activeFile: "File 1",
  activeFileId: "file-1",
});

describe("core RootDocument validation", () => {
  it("accepts a valid v1 document and forward-compatible unknown fields", () => {
    const document = createValidDocument();

    expect(validateRootDocumentV1(document)).toEqual({
      valid: true,
      errors: [],
    });
    expect(isRootDocumentV1(document)).toBe(true);
    expect(ROOT_DOCUMENT_V1_SCHEMA.properties.schemaVersion.const).toBe(
      CURRENT_SCHEMA_VERSION,
    );
    expect(ROOT_DOCUMENT_V1_SCHEMA.additionalProperties).toBe(true);
  });

  it("rejects unsupported versions, invalid zIndex, and missing active files", () => {
    const document = createValidDocument();
    document.schemaVersion = "2.0.0";
    document.activeFile = "Missing File";
    document.activeFileId = "missing-file";
    document.fileList[0].graphRawData.nodes[0].zIndex = 1.5;

    const result = validateRootDocumentV1(document);

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.path)).toEqual(
      expect.arrayContaining([
        "$.schemaVersion",
        "$.activeFile",
        "$.activeFileId",
        "$.fileList[0].graphRawData.nodes[0].zIndex",
      ]),
    );
    expect(formatRootDocumentValidationErrors(result.errors, 2)).toContain(
      "其余 2 项略",
    );
  });

  it("rejects malformed graph and transform structures", () => {
    const document = createValidDocument();
    document.fileList[0].graphRawData =
      {} as (typeof document.fileList)[0]["graphRawData"];
    document.fileList[0].transform.SCALE_X = Number.NaN;

    const result = validateRootDocumentV1(document);

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.path)).toEqual(
      expect.arrayContaining([
        "$.fileList[0].graphRawData.nodes",
        "$.fileList[0].graphRawData.edges",
        "$.fileList[0].transform.SCALE_X",
      ]),
    );
  });
});
