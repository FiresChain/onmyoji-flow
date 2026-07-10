export const DEFAULT_TEXT_DOWNLOAD_MIME_TYPE = "text/plain;charset=utf-8";

export interface TextDownloadPayload {
  fileName: string;
  content: string;
  mimeType?: string;
}

const scheduleObjectUrlRevocation = (
  objectUrlApi: Pick<typeof URL, "revokeObjectURL">,
  objectUrl: string,
) => {
  const revoke = () => {
    try {
      objectUrlApi.revokeObjectURL(objectUrl);
    } catch {
      // Cleanup failures must not mask the download result.
    }
  };

  try {
    setTimeout(revoke, 0);
  } catch {
    revoke();
  }
};

export const downloadDataUrl = (dataUrl: string, fileName: string): void => {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.style.display = "none";

  try {
    (document.body || document.documentElement).appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
  }
};

export const downloadTextPayload = ({
  fileName,
  content,
  mimeType = DEFAULT_TEXT_DOWNLOAD_MIME_TYPE,
}: TextDownloadPayload): void => {
  const objectUrlApi = URL;
  const objectUrl = objectUrlApi.createObjectURL(
    new Blob([content], { type: mimeType }),
  );

  try {
    downloadDataUrl(objectUrl, fileName);
  } finally {
    scheduleObjectUrlRevocation(objectUrlApi, objectUrl);
  }
};
