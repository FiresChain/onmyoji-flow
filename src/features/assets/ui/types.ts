import type { NodeCreateSizeConfig } from "../nodeAppearanceRepository";

export type AssetsDialogMessageType = "success" | "warning" | "info" | "error";

export type AssetsDialogTranslate = (key: string, values?: unknown) => string;

export type AssetsDialogNotify = (
  type: AssetsDialogMessageType,
  message: string,
) => void;

export type ApplyNodeThemeToCurrent = (
  config: NodeCreateSizeConfig,
) => boolean | void | Promise<boolean | void>;

export interface AssetsDialogHostExpose {
  openAssetManager(): void;
  openNodeTheme(): void;
}
