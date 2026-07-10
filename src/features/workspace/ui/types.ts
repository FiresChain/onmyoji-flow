export type WorkspaceDialogTranslate = (
  key: string,
  values?: Record<string, unknown>,
) => string;

export interface WorkspaceDialogHostExpose {
  handleExport(): void;
  handlePreviewData(): void;
  openImportDialog(): void;
}
