import type { WorkspaceSession } from "@/features/workspace/public";

interface UseToolbarCanvasRefreshOptions {
  workspaceSession: WorkspaceSession;
}

export function useToolbarCanvasRefresh(
  options: UseToolbarCanvasRefreshOptions,
) {
  const { workspaceSession } = options;
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;

  const refreshLogicFlowCanvas = (message?: string) => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      if (workspaceSession.renderActiveFile()) {
        console.log(message || "LogicFlow 画布已重新渲染");
      }
    }, 100);
  };

  const disposeCanvasRefresh = () => {
    if (!refreshTimer) return;
    clearTimeout(refreshTimer);
    refreshTimer = null;
  };

  return {
    refreshLogicFlowCanvas,
    disposeCanvasRefresh,
  };
}
