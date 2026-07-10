import {
  convertTeamCodeToRootDocument,
  decodeTeamCodeFromQrImage,
} from "@/utils/teamCodeService";

export interface TeamCodeImportPort {
  convert(
    code: string,
    options?: { formationValidation?: boolean },
  ): Promise<unknown>;
  decodeQr(file: File): Promise<string>;
}

export const legacyTeamCodeImportAdapter: TeamCodeImportPort = Object.freeze({
  convert: convertTeamCodeToRootDocument,
  decodeQr: decodeTeamCodeFromQrImage,
});
