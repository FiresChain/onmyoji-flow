import type LogicFlow from "@logicflow/core";

type SnapshotResult = string | { data?: string };

const waitForNextPaint = (): Promise<void> =>
  new Promise((resolve) => {
    if (
      typeof window === "undefined" ||
      typeof window.requestAnimationFrame !== "function"
    ) {
      resolve();
      return;
    }
    window.requestAnimationFrame(() => resolve());
  });

export const withDynamicGroupsHiddenForSnapshot = async <T>(
  logicFlow: LogicFlow,
  runner: () => Promise<T>,
): Promise<T> => {
  const dynamicGroups = ((logicFlow as any).graphModel?.nodes ?? []).filter(
    (node: any) => node?.type === "dynamic-group",
  );
  if (!dynamicGroups.length) return runner();

  const previousStates = dynamicGroups.map((model: any) => ({
    model,
    visible: model.visible,
  }));
  try {
    previousStates.forEach(({ model }) => {
      model.visible = false;
    });
    await waitForNextPaint();
    return await runner();
  } finally {
    previousStates.forEach(({ model, visible }) => {
      model.visible = visible;
    });
    await waitForNextPaint();
  }
};

export const captureEditorSnapshot = async (
  logicFlow: LogicFlow | null,
): Promise<string | null> => {
  const instance = logicFlow as any;
  if (!instance || typeof instance.getSnapshotBase64 !== "function") {
    return null;
  }

  const snapshot = await withDynamicGroupsHiddenForSnapshot<SnapshotResult>(
    instance,
    () =>
      instance.getSnapshotBase64(undefined, undefined, {
        fileType: "png",
        backgroundColor: "#ffffff",
        partial: false,
        padding: 20,
      }),
  );
  return typeof snapshot === "string" ? snapshot : (snapshot?.data ?? null);
};
