export interface ClipboardWriter {
  writeText(text: string): Promise<void>;
}

const getBrowserClipboard = (): ClipboardWriter | null => {
  try {
    return typeof navigator === "undefined"
      ? null
      : (navigator.clipboard ?? null);
  } catch {
    return null;
  }
};

export const writeClipboardText = async (
  text: string,
  clipboard: ClipboardWriter | null = getBrowserClipboard(),
): Promise<void> => {
  if (!clipboard) {
    throw new Error("Clipboard API is unavailable");
  }
  await clipboard.writeText(text);
};
