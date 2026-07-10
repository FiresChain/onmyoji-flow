export type EditorResourceDisposer = () => void;
export type EditorResourceMount = () => EditorResourceDisposer;

const disposeResources = (disposers: EditorResourceDisposer[]): void => {
  let cleanupError: unknown;

  for (let index = disposers.length - 1; index >= 0; index -= 1) {
    try {
      disposers[index]();
    } catch (error) {
      cleanupError ??= error;
    }
  }

  if (cleanupError) throw cleanupError;
};

export function mountEditorResources(
  mounts: EditorResourceMount[],
): EditorResourceDisposer {
  const disposers: EditorResourceDisposer[] = [];

  try {
    mounts.forEach((mount) => {
      disposers.push(mount());
    });
  } catch (mountError) {
    try {
      disposeResources(disposers);
    } catch {
      // Preserve the mount error after attempting every rollback.
    }
    throw mountError;
  }

  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    disposeResources(disposers);
  };
}
