import type { WorkspaceSession } from "./useWorkspaceSession";

interface UseWorkspaceCanvasRefreshOptions {
  workspaceSession: WorkspaceSession;
}

export function useWorkspaceCanvasRefresh(
  options: UseWorkspaceCanvasRefreshOptions,
) {
  const { workspaceSession } = options;
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;

  const refreshLogicFlowCanvas = (_message?: string) => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      workspaceSession.renderActiveFile();
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
