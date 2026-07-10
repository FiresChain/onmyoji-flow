import type { RootDocumentMigrationOptions } from "@/core/document/migrations";
import type { RootDocumentValidationError } from "@/core/document/validation";

export type DocumentTransferErrorCode =
  | "INVALID_JSON"
  | "MIGRATION_ERROR"
  | "INVALID_DOCUMENT"
  | "SERIALIZE_ERROR";

export interface DocumentTransferError {
  code: DocumentTransferErrorCode;
  context: string;
  message: string;
  cause: unknown;
  validationErrors?: RootDocumentValidationError[];
}

export type DocumentTransferResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: DocumentTransferError };

export interface DocumentTransferOptions extends RootDocumentMigrationOptions {
  context?: string;
}

export interface DocumentStringifyOptions extends DocumentTransferOptions {
  space?: string | number;
}

export interface DocumentDownloadOptions extends DocumentStringifyOptions {
  fileName?: string;
  mimeType?: string;
}

export interface DocumentDownloadPayload {
  fileName: string;
  mimeType: string;
  content: string;
}
