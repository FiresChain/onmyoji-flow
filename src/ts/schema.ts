export {
  CURRENT_SCHEMA_VERSION,
  migrateToV1,
} from "@/core/document/migrations";
export {
  ROOT_DOCUMENT_V1_SCHEMA,
  formatRootDocumentValidationErrors,
  validateRootDocumentV1,
} from "@/core/document/validation";
export { DefaultNodeStyle } from "@/core/document/types";
export type {
  GraphDocument,
  GraphEdge,
  GraphNode,
  NodeMeta,
  NodeProperties,
  NodeStyle,
  RootDocument,
  Transform,
} from "@/core/document/types";
export type {
  RootDocumentValidationError,
  RootDocumentValidationResult,
} from "@/core/document/validation";
