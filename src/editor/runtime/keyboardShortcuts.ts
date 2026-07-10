import type LogicFlow from "@logicflow/core";

export type ShortcutHandler = (event?: KeyboardEvent) => boolean | void;

export interface EditorKeyboardShortcutOptions {
  instance: LogicFlow;
  deleteSelectedElements: ShortcutHandler;
  groupSelectedNodes: ShortcutHandler;
  ungroupSelectedNodes: ShortcutHandler;
  toggleLockSelected: ShortcutHandler;
  toggleVisibilitySelected: ShortcutHandler;
  handleArrowMove: (
    direction: "left" | "right" | "up" | "down",
    event?: KeyboardEvent,
  ) => boolean | void;
}

export function bindEditorKeyboardShortcuts(
  options: EditorKeyboardShortcutOptions,
): () => void {
  const {
    instance,
    deleteSelectedElements,
    groupSelectedNodes,
    ungroupSelectedNodes,
    toggleLockSelected,
    toggleVisibilitySelected,
    handleArrowMove,
  } = options;
  const disposers: Array<() => void> = [];
  let disposed = false;

  const disposeShortcuts = () => {
    if (disposed) return;
    disposed = true;

    let cleanupError: unknown;
    disposers.reverse().forEach((dispose) => {
      try {
        dispose();
      } catch (error) {
        cleanupError ??= error;
      }
    });
    if (cleanupError) throw cleanupError;
  };

  instance.keyboard.off(["backspace"]);

  const bind = (keys: string | string[], handler: ShortcutHandler) => {
    const callback = (event: KeyboardEvent) => handler(event);
    try {
      instance.keyboard.on(keys, callback);
    } catch (error) {
      try {
        disposeShortcuts();
      } catch {
        // Preserve the registration error.
      }
      throw error;
    }
    disposers.push(() => instance.keyboard.off(keys));
  };

  bind(["del", "backspace"], deleteSelectedElements);
  bind(["left"], (event) => handleArrowMove("left", event));
  bind(["right"], (event) => handleArrowMove("right", event));
  bind(["up"], (event) => handleArrowMove("up", event));
  bind(["down"], (event) => handleArrowMove("down", event));
  bind(["cmd + g", "ctrl + g"], groupSelectedNodes);
  bind(["cmd + u", "ctrl + u"], ungroupSelectedNodes);
  bind(["cmd + l", "ctrl + l"], toggleLockSelected);
  bind(["cmd + shift + h", "ctrl + shift + h"], toggleVisibilitySelected);

  return disposeShortcuts;
}
