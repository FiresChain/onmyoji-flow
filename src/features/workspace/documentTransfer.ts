import {
  CURRENT_SCHEMA_VERSION,
  migrateToV1,
} from "@/core/document/migrations";
import type { GraphData, RootDocument } from "@/core/document/types";
import {
  formatRootDocumentValidationErrors,
  validateRootDocumentV1,
  type RootDocumentValidationError,
} from "@/core/document/validation";
import type {
  DocumentDownloadOptions,
  DocumentDownloadPayload,
  DocumentStringifyOptions,
  DocumentTransferError,
  DocumentTransferErrorCode,
  DocumentTransferOptions,
  DocumentTransferResult,
} from "./model/types";

export const DEFAULT_DOCUMENT_FILE_NAME = "onmyoji-flow-files.json";
export const DOCUMENT_JSON_MIME_TYPE = "application/json;charset=utf-8";

const DEFAULT_ROOT_MIGRATION_CONTEXT = "root-document:migrate";
const DEFAULT_ROOT_PARSE_CONTEXT = "root-document:parse";
const DEFAULT_ROOT_STRINGIFY_CONTEXT = "root-document:stringify";
const DEFAULT_ROOT_DOWNLOAD_CONTEXT = "root-document:download";
const DEFAULT_GRAPH_MIGRATION_CONTEXT = "graph-data:migrate";
const DEFAULT_GRAPH_PARSE_CONTEXT = "graph-data:parse";
const DEFAULT_GRAPH_STRINGIFY_CONTEXT = "graph-data:stringify";

const GRAPH_FILE_ID = "__document-transfer-graph__";
const GRAPH_FILE_NAME = "Graph Data";
const GRAPH_VALIDATION_PATH = "$.fileList[0].graphRawData";

const toErrorMessage = (cause: unknown): string =>
  cause instanceof Error ? cause.message : String(cause);

const failure = <T>(
  code: DocumentTransferErrorCode,
  context: string,
  message: string,
  cause: unknown,
  validationErrors?: RootDocumentValidationError[],
): DocumentTransferResult<T> => {
  const error: DocumentTransferError = {
    code,
    context,
    message,
    cause,
    ...(validationErrors ? { validationErrors } : {}),
  };
  return { ok: false, error };
};

const migrationOptions = (options: DocumentTransferOptions) => ({
  now: options.now,
  createFileId: options.createFileId,
});

const parseJson = (
  source: string,
  context: string,
): DocumentTransferResult<unknown> => {
  try {
    return { ok: true, value: JSON.parse(source) };
  } catch (cause) {
    return failure(
      "INVALID_JSON",
      context,
      `Unable to parse JSON: ${toErrorMessage(cause)}`,
      cause,
    );
  }
};

const stringifyJson = (
  value: unknown,
  context: string,
  space: string | number,
): DocumentTransferResult<string> => {
  try {
    return { ok: true, value: JSON.stringify(value, null, space) };
  } catch (cause) {
    return failure(
      "SERIALIZE_ERROR",
      context,
      `Unable to serialize JSON: ${toErrorMessage(cause)}`,
      cause,
    );
  }
};

const createValidationFailure = <T>(
  context: string,
  errors: RootDocumentValidationError[],
): DocumentTransferResult<T> =>
  failure(
    "INVALID_DOCUMENT",
    context,
    `Document validation failed: ${formatRootDocumentValidationErrors(errors)}`,
    errors,
    errors,
  );

export function migrateAndValidateRootDocument(
  input: unknown,
  options: DocumentTransferOptions = {},
): DocumentTransferResult<RootDocument> {
  const context = options.context ?? DEFAULT_ROOT_MIGRATION_CONTEXT;
  let document: RootDocument;

  try {
    document = migrateToV1(input, migrationOptions(options));
  } catch (cause) {
    return failure(
      "MIGRATION_ERROR",
      context,
      `Unable to migrate RootDocument: ${toErrorMessage(cause)}`,
      cause,
    );
  }

  const validation = validateRootDocumentV1(document);
  return validation.valid
    ? { ok: true, value: document }
    : createValidationFailure(context, validation.errors);
}

export function parseRootDocumentJson(
  source: string,
  options: DocumentTransferOptions = {},
): DocumentTransferResult<RootDocument> {
  const context = options.context ?? DEFAULT_ROOT_PARSE_CONTEXT;
  const parsed = parseJson(source, context);
  if ("error" in parsed) {
    return parsed;
  }
  return migrateAndValidateRootDocument(parsed.value, { ...options, context });
}

export function stringifyRootDocument(
  input: unknown,
  options: DocumentStringifyOptions = {},
): DocumentTransferResult<string> {
  const context = options.context ?? DEFAULT_ROOT_STRINGIFY_CONTEXT;
  const normalized = migrateAndValidateRootDocument(input, {
    ...options,
    context,
  });
  if ("error" in normalized) {
    return normalized;
  }
  return stringifyJson(normalized.value, context, options.space ?? 2);
}

export function createRootDocumentDownloadPayload(
  input: unknown,
  options: DocumentDownloadOptions = {},
): DocumentTransferResult<DocumentDownloadPayload> {
  const context = options.context ?? DEFAULT_ROOT_DOWNLOAD_CONTEXT;
  const content = stringifyRootDocument(input, { ...options, context });
  if ("error" in content) {
    return content;
  }
  return {
    ok: true,
    value: {
      fileName: options.fileName ?? DEFAULT_DOCUMENT_FILE_NAME,
      mimeType: options.mimeType ?? DOCUMENT_JSON_MIME_TYPE,
      content: content.value,
    },
  };
}

const createGraphRootInput = (input: unknown): Record<string, unknown> => ({
  schemaVersion: CURRENT_SCHEMA_VERSION,
  fileList: [
    {
      id: GRAPH_FILE_ID,
      label: GRAPH_FILE_NAME,
      name: GRAPH_FILE_NAME,
      visible: true,
      type: "FLOW",
      graphRawData: input,
      transform: {
        SCALE_X: 1,
        SCALE_Y: 1,
        TRANSLATE_X: 0,
        TRANSLATE_Y: 0,
      },
    },
  ],
  activeFile: GRAPH_FILE_NAME,
  activeFileId: GRAPH_FILE_ID,
});

const toGraphValidationErrors = (
  errors: RootDocumentValidationError[],
): RootDocumentValidationError[] =>
  errors.map((error) => {
    if (!error.path.startsWith(GRAPH_VALIDATION_PATH)) {
      return error;
    }
    const suffix = error.path.slice(GRAPH_VALIDATION_PATH.length);
    return { ...error, path: `$${suffix}` };
  });

export function migrateAndValidateGraphData(
  input: unknown,
  options: DocumentTransferOptions = {},
): DocumentTransferResult<GraphData> {
  const context = options.context ?? DEFAULT_GRAPH_MIGRATION_CONTEXT;
  const rootResult = migrateAndValidateRootDocument(
    createGraphRootInput(input),
    {
      ...options,
      context,
    },
  );
  if ("error" in rootResult) {
    const errors = rootResult.error.validationErrors;
    if (!errors) {
      return rootResult;
    }
    return createValidationFailure(context, toGraphValidationErrors(errors));
  }
  return {
    ok: true,
    value: rootResult.value.fileList[0].graphRawData,
  };
}

export function parseGraphDataJson(
  source: string,
  options: DocumentTransferOptions = {},
): DocumentTransferResult<GraphData> {
  const context = options.context ?? DEFAULT_GRAPH_PARSE_CONTEXT;
  const parsed = parseJson(source, context);
  if ("error" in parsed) {
    return parsed;
  }
  return migrateAndValidateGraphData(parsed.value, { ...options, context });
}

export function stringifyGraphData(
  input: unknown,
  options: DocumentStringifyOptions = {},
): DocumentTransferResult<string> {
  const context = options.context ?? DEFAULT_GRAPH_STRINGIFY_CONTEXT;
  const normalized = migrateAndValidateGraphData(input, {
    ...options,
    context,
  });
  if ("error" in normalized) {
    return normalized;
  }
  return stringifyJson(normalized.value, context, options.space ?? 2);
}
