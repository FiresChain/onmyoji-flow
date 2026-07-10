import rootDocumentV1SchemaJson from "./root-document.v1.json";
import { CURRENT_SCHEMA_VERSION } from "./migrations";
import type { RootDocument, UnknownRecord } from "./types";

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as UnknownRecord).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const ROOT_DOCUMENT_V1_SCHEMA = deepFreeze(rootDocumentV1SchemaJson);

export interface RootDocumentValidationError {
  path: string;
  message: string;
}

export interface RootDocumentValidationResult {
  valid: boolean;
  errors: RootDocumentValidationError[];
}

const isPlainObject = (input: unknown): input is UnknownRecord =>
  input !== null && typeof input === "object" && !Array.isArray(input);

const isNonEmptyString = (input: unknown): input is string =>
  typeof input === "string" && input.trim().length > 0;

const isFiniteNumber = (input: unknown): input is number =>
  typeof input === "number" && Number.isFinite(input);

const pushError = (
  errors: RootDocumentValidationError[],
  path: string,
  message: string,
) => {
  errors.push({ path, message });
};

const validateGraphNode = (
  value: unknown,
  path: string,
  errors: RootDocumentValidationError[],
) => {
  if (!isPlainObject(value)) {
    pushError(errors, path, "必须是对象");
    return;
  }
  if (!isNonEmptyString(value.id)) {
    pushError(errors, `${path}.id`, "必须是非空字符串");
  }
  if (!isNonEmptyString(value.type)) {
    pushError(errors, `${path}.type`, "必须是非空字符串");
  }
  if (!isPlainObject(value.properties)) {
    pushError(errors, `${path}.properties`, "必须是对象");
  }
  if (value.zIndex != null && !Number.isInteger(value.zIndex)) {
    pushError(errors, `${path}.zIndex`, "必须是整数");
  }
};

const validateGraphEdge = (
  value: unknown,
  path: string,
  errors: RootDocumentValidationError[],
) => {
  if (!isPlainObject(value)) {
    pushError(errors, path, "必须是对象");
    return;
  }
  if (!isNonEmptyString(value.id)) {
    pushError(errors, `${path}.id`, "必须是非空字符串");
  }
  if (!isNonEmptyString(value.sourceNodeId)) {
    pushError(errors, `${path}.sourceNodeId`, "必须是非空字符串");
  }
  if (!isNonEmptyString(value.targetNodeId)) {
    pushError(errors, `${path}.targetNodeId`, "必须是非空字符串");
  }
};

const validateGraphData = (
  value: unknown,
  path: string,
  errors: RootDocumentValidationError[],
) => {
  if (!isPlainObject(value)) {
    pushError(errors, path, "必须是对象");
    return;
  }
  if (!Array.isArray(value.nodes)) {
    pushError(errors, `${path}.nodes`, "必须是数组");
  } else {
    value.nodes.forEach((node, index) =>
      validateGraphNode(node, `${path}.nodes[${index}]`, errors),
    );
  }
  if (!Array.isArray(value.edges)) {
    pushError(errors, `${path}.edges`, "必须是数组");
  } else {
    value.edges.forEach((edge, index) =>
      validateGraphEdge(edge, `${path}.edges[${index}]`, errors),
    );
  }
};

const validateTransform = (
  value: unknown,
  path: string,
  errors: RootDocumentValidationError[],
) => {
  if (!isPlainObject(value)) {
    pushError(errors, path, "必须是对象");
    return;
  }
  ["SCALE_X", "SCALE_Y", "TRANSLATE_X", "TRANSLATE_Y"].forEach((key) => {
    if (!isFiniteNumber(value[key])) {
      pushError(errors, `${path}.${key}`, "必须是数字");
    }
  });
};

const validateFlowFile = (
  value: unknown,
  path: string,
  errors: RootDocumentValidationError[],
) => {
  if (!isPlainObject(value)) {
    pushError(errors, path, "必须是对象");
    return;
  }
  ["id", "label", "name", "type"].forEach((key) => {
    if (!isNonEmptyString(value[key])) {
      pushError(errors, `${path}.${key}`, "必须是非空字符串");
    }
  });
  if (typeof value.visible !== "boolean") {
    pushError(errors, `${path}.visible`, "必须是布尔值");
  }
  validateGraphData(value.graphRawData, `${path}.graphRawData`, errors);
  validateTransform(value.transform, `${path}.transform`, errors);
};

export const validateRootDocumentV1 = (
  input: unknown,
): RootDocumentValidationResult => {
  const errors: RootDocumentValidationError[] = [];
  if (!isPlainObject(input)) {
    return {
      valid: false,
      errors: [{ path: "$", message: "RootDocument 必须是对象" }],
    };
  }

  if (input.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    pushError(errors, "$.schemaVersion", `必须为 ${CURRENT_SCHEMA_VERSION}`);
  }
  if (!isNonEmptyString(input.activeFile)) {
    pushError(errors, "$.activeFile", "必须是非空字符串");
  }
  if (input.activeFileId != null && !isNonEmptyString(input.activeFileId)) {
    pushError(errors, "$.activeFileId", "必须是非空字符串");
  }
  if (!Array.isArray(input.fileList)) {
    pushError(errors, "$.fileList", "必须是数组");
    return { valid: false, errors };
  }
  if (input.fileList.length === 0) {
    pushError(errors, "$.fileList", "至少包含一个文件");
  }
  input.fileList.forEach((file, index) =>
    validateFlowFile(file, `$.fileList[${index}]`, errors),
  );

  const fileNames = input.fileList
    .filter(isPlainObject)
    .map((file) => file.name)
    .filter(isNonEmptyString);
  if (
    isNonEmptyString(input.activeFile) &&
    !fileNames.includes(input.activeFile)
  ) {
    pushError(errors, "$.activeFile", "必须匹配 fileList 中存在的文件名");
  }

  const fileIds = input.fileList
    .filter(isPlainObject)
    .map((file) => file.id)
    .filter(isNonEmptyString);
  if (
    isNonEmptyString(input.activeFileId) &&
    !fileIds.includes(input.activeFileId)
  ) {
    pushError(errors, "$.activeFileId", "必须匹配 fileList 中存在的文件 id");
  }

  return { valid: errors.length === 0, errors };
};

export const isRootDocumentV1 = (input: unknown): input is RootDocument =>
  validateRootDocumentV1(input).valid;

export const formatRootDocumentValidationErrors = (
  errors: RootDocumentValidationError[],
  maxCount = 3,
): string => {
  if (errors.length === 0) {
    return "未知校验错误";
  }
  const primary = errors
    .slice(0, maxCount)
    .map((error) => `${error.path}: ${error.message}`)
    .join("; ");
  return errors.length <= maxCount
    ? primary
    : `${primary}; 其余 ${errors.length - maxCount} 项略`;
};
