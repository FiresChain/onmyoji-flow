import type { Pinia } from "pinia";
import { getActivePinia, setActivePinia } from "pinia";
import type { InjectionKey } from "vue";
import { inject, provide } from "vue";

import type { RootDocument } from "@/core/document/types";
import { normalizeGraph } from "@/core/document/normalizeGraph";
import type { EditorPort } from "@/core/logicflow/types";
import { normalizeViewport } from "@/core/logicflow/viewport";
import { migrateAndValidateRootDocument } from "./documentTransfer";
import type { FilesPersistence } from "./filesPersistence";
import { createDefaultRootDocument, type FilesStore } from "./filesStore";

export interface WorkspaceSessionOptions {
  store: FilesStore;
  persistence: FilesPersistence;
  getEditorPort: () => EditorPort | null;
  pinia?: Pinia;
  restoreActivePinia?: Pinia;
  autoSaveIntervalMs?: number;
  now?: () => number;
}

export interface WorkspaceLoadResult {
  restored: boolean;
  error?: Error;
}

export type WorkspaceImportResult =
  | { ok: true; document: RootDocument }
  | { ok: false; error: Error };

export interface WorkspaceSession {
  readonly store: FilesStore;
  initialize(): WorkspaceLoadResult;
  importData(input: unknown): WorkspaceImportResult;
  exportDocument(): WorkspaceImportResult;
  persist(): boolean;
  captureActiveFile(): boolean;
  renderActiveFile(): boolean;
  updateTab(fileKey?: string): boolean;
  setActiveFile(fileKey: string): boolean;
  addTab(): void;
  removeTab(fileKey?: string): boolean;
  setVisible(fileKey: string, visible: boolean): boolean;
  deleteFile(fileKey: string): boolean;
  renameFile(fileKey: string, nextName: string): boolean;
  resetWorkspace(): void;
  clearActiveFile(): void;
  startAutoSave(intervalMs?: number): () => void;
  flush(): void;
  dispose(): void;
}

const WORKSPACE_SESSION_KEY: InjectionKey<WorkspaceSession> = Symbol(
  "onmyoji-flow:workspace-session",
);

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

const normalizeAndValidate = (input: unknown): RootDocument => {
  const result = migrateAndValidateRootDocument(input, {
    context: "workspace-session",
  });
  if ("error" in result) {
    throw new Error(result.error.message);
  }
  return result.value;
};

export const createWorkspaceSession = (
  options: WorkspaceSessionOptions,
): WorkspaceSession => {
  const {
    store,
    persistence,
    getEditorPort,
    pinia,
    now = () => Date.now(),
  } = options;
  const restoreActivePinia = Object.prototype.hasOwnProperty.call(
    options,
    "restoreActivePinia",
  )
    ? options.restoreActivePinia
    : pinia
      ? getActivePinia()
      : undefined;
  let autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  let disposed = false;

  const callStore = <T>(action: () => T): T => {
    if (!pinia) {
      return action();
    }
    try {
      return action();
    } finally {
      setActivePinia(restoreActivePinia);
    }
  };

  const getTab = (fileKey?: string) => callStore(() => store.getTab(fileKey));
  const resolveFileId = (fileKey?: string) =>
    callStore(() => store.resolveFileId(fileKey));

  const captureFile = (fileId: string): boolean => {
    const port = getEditorPort();
    if (!port || !fileId || !getTab(fileId)) {
      return false;
    }
    return callStore(() =>
      store.updateFileGraph(fileId, port.capture(), port.getViewport(), now()),
    );
  };

  const captureActiveFile = (): boolean => captureFile(store.activeFileId);

  const renderActiveFile = (): boolean => {
    const port = getEditorPort();
    const file = getTab(store.activeFileId);
    if (!port || !file) {
      return false;
    }
    port.render(normalizeGraph(file.graphRawData));
    port.setViewport(normalizeViewport(file.transform));
    return true;
  };

  const persist = (): boolean => {
    if (disposed) {
      return false;
    }
    const result = migrateAndValidateRootDocument(
      callStore(() => store.toDocument()),
      { context: "workspace-persist" },
    );
    if ("error" in result) {
      return false;
    }
    persistence.save(result.value);
    return true;
  };

  const initialize = (): WorkspaceLoadResult => {
    try {
      const loaded = persistence.load();
      const document = loaded
        ? normalizeAndValidate(loaded)
        : createDefaultRootDocument(now());
      callStore(() => store.replaceDocument(document));
      renderActiveFile();
      return { restored: !!loaded };
    } catch (error) {
      persistence.remove();
      callStore(() => store.replaceDocument(createDefaultRootDocument(now())));
      renderActiveFile();
      return { restored: false, error: toError(error) };
    }
  };

  const importData = (input: unknown): WorkspaceImportResult => {
    try {
      const document = normalizeAndValidate(input);
      callStore(() => store.replaceDocument(document));
      renderActiveFile();
      persist();
      return { ok: true, document };
    } catch (error) {
      return { ok: false, error: toError(error) };
    }
  };

  const exportDocument = (): WorkspaceImportResult => {
    try {
      captureActiveFile();
      const document = normalizeAndValidate(
        callStore(() => store.toDocument()),
      );
      return { ok: true, document };
    } catch (error) {
      return { ok: false, error: toError(error) };
    }
  };

  const updateTab = (fileKey?: string): boolean => {
    const fileId = resolveFileId(fileKey) || store.activeFileId;
    if (fileId === store.activeFileId) {
      captureFile(fileId);
    }
    return persist();
  };

  const setActiveFile = (fileKey: string): boolean => {
    const nextId = resolveFileId(fileKey);
    if (!nextId || nextId === store.activeFileId) {
      return false;
    }
    captureActiveFile();
    const changed = callStore(() => store.setActiveFileId(nextId));
    if (changed) {
      renderActiveFile();
      persist();
    }
    return changed;
  };

  const addTab = (): void => {
    captureActiveFile();
    callStore(() => store.addTab());
    renderActiveFile();
    persist();
  };

  const removeTab = (fileKey?: string): boolean => {
    const fileId = resolveFileId(fileKey);
    if (!fileId) {
      return false;
    }
    const wasActive = fileId === store.activeFileId;
    const removed = callStore(() => store.removeTab(fileId));
    if (!removed) {
      return false;
    }
    if (wasActive) {
      renderActiveFile();
    }
    persist();
    return true;
  };

  const setVisible = (fileKey: string, visible: boolean): boolean => {
    const fileId = resolveFileId(fileKey);
    if (!fileId) {
      return false;
    }
    const isActive = fileId === store.activeFileId;
    if (isActive && !visible) {
      captureActiveFile();
    }
    const changed = callStore(() => store.setVisible(fileId, visible));
    if (!changed) {
      return false;
    }
    if (isActive && !visible) {
      const fallback =
        store.visibleFiles.find((file) => file.id !== fileId) ??
        store.fileList.find((file) => file.id !== fileId);
      if (fallback) {
        callStore(() => store.setActiveFileId(fallback.id));
        renderActiveFile();
      }
    }
    persist();
    return true;
  };

  const deleteFile = (fileKey: string): boolean => removeTab(fileKey);

  const renameFile = (fileKey: string, nextName: string): boolean => {
    const changed = callStore(() => store.renameFile(fileKey, nextName));
    if (changed) {
      persist();
    }
    return changed;
  };

  const resetWorkspace = (): void => {
    persistence.remove();
    callStore(() => store.resetDocument(createDefaultRootDocument(now())));
    renderActiveFile();
  };

  const clearActiveFile = (): void => {
    const port = getEditorPort();
    port?.clear();
    port?.setViewport(normalizeViewport());
    callStore(() =>
      store.updateFileGraph(
        store.activeFileId,
        { nodes: [], edges: [] },
        normalizeViewport(),
        now(),
      ),
    );
    persist();
  };

  const stopAutoSave = (): void => {
    if (!autoSaveTimer) {
      return;
    }
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  };

  const startAutoSave = (
    intervalMs = options.autoSaveIntervalMs ?? 30_000,
  ): (() => void) => {
    if (disposed) {
      return () => {};
    }
    stopAutoSave();
    autoSaveTimer = setInterval(() => {
      updateTab();
    }, intervalMs);
    return stopAutoSave;
  };

  const flush = (): void => {
    captureActiveFile();
    persist();
    persistence.flush();
  };

  const dispose = (): void => {
    if (disposed) {
      return;
    }
    stopAutoSave();
    captureActiveFile();
    persist();
    persistence.flush();
    persistence.dispose();
    disposed = true;
  };

  return {
    store,
    initialize,
    importData,
    exportDocument,
    persist,
    captureActiveFile,
    renderActiveFile,
    updateTab,
    setActiveFile,
    addTab,
    removeTab,
    setVisible,
    deleteFile,
    renameFile,
    resetWorkspace,
    clearActiveFile,
    startAutoSave,
    flush,
    dispose,
  };
};

export const provideWorkspaceSession = (
  session: WorkspaceSession,
): WorkspaceSession => {
  provide(WORKSPACE_SESSION_KEY, session);
  return session;
};

export const useWorkspaceSession = (): WorkspaceSession => {
  const session = inject(WORKSPACE_SESSION_KEY, null);
  if (!session) {
    throw new Error("WorkspaceSession is not provided");
  }
  return session;
};
