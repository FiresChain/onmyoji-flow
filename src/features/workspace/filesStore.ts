import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { CURRENT_SCHEMA_VERSION } from "@/core/document/migrations";
import type {
  FlowFile,
  GraphData,
  RootDocument,
  Transform,
  UnknownRecord,
} from "@/core/document/types";
import { normalizeViewport } from "@/core/logicflow/viewport";
import { normalizeWorkspaceGraph } from "./normalizeWorkspaceGraph";

export const FILES_STORE_ID = "files";

export type FileIdFactory = () => string;

export interface CreateWorkspaceFileOptions {
  name: string;
  now?: number;
  id?: string;
  createId?: FileIdFactory;
}

const createFileId = (): string =>
  `f_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const createWorkspaceFile = (
  options: CreateWorkspaceFileOptions,
): FlowFile => {
  const now = options.now ?? Date.now();
  return {
    id: options.id ?? options.createId?.() ?? createFileId(),
    label: options.name,
    name: options.name,
    visible: true,
    type: "FLOW",
    graphRawData: { nodes: [], edges: [] },
    transform: normalizeViewport(),
    createdAt: now,
    updatedAt: now,
  };
};

export const createDefaultRootDocument = (
  now = Date.now(),
  createId: FileIdFactory = createFileId,
): RootDocument => {
  const file = createWorkspaceFile({
    id: createId(),
    name: "File 1",
    now,
  });
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    fileList: [file],
    activeFile: file.name,
    activeFileId: file.id,
  };
};

const normalizeFile = (file: FlowFile, index: number): FlowFile => {
  const now = Date.now();
  const fallbackName = `File ${index + 1}`;
  const name = file.name || file.label || fallbackName;
  return {
    ...file,
    id: file.id || createFileId(),
    label: file.label || name,
    name,
    visible: file.visible ?? true,
    type: file.type || "FLOW",
    graphRawData: normalizeWorkspaceGraph(file.graphRawData),
    transform: normalizeViewport(file.transform),
    createdAt: file.createdAt ?? now,
    updatedAt: file.updatedAt ?? file.createdAt ?? now,
  };
};

const extractRootExtras = (document: RootDocument): UnknownRecord => {
  const {
    schemaVersion: _schemaVersion,
    fileList: _fileList,
    activeFile: _activeFile,
    activeFileId: _activeFileId,
    ...extras
  } = document;
  return extras;
};

export const useFilesStore = defineStore(FILES_STORE_ID, () => {
  const fileList = ref<FlowFile[]>([]);
  const activeFileId = ref("");
  const rootDocumentExtras = ref<UnknownRecord>({});

  const visibleFiles = computed(() =>
    fileList.value.filter((file) => file.visible),
  );
  const activeFile = computed(
    () => fileList.value.find((file) => file.id === activeFileId.value) ?? null,
  );

  const getTab = (fileKey?: string): FlowFile | undefined => {
    const key = fileKey || activeFileId.value;
    return fileList.value.find((file) => file.id === key || file.name === key);
  };

  const resolveFileId = (fileKey?: string): string => getTab(fileKey)?.id ?? "";

  const replaceDocument = (document: RootDocument): void => {
    fileList.value = document.fileList.map(normalizeFile);
    const requestedId =
      document.activeFileId || resolveFileId(document.activeFile);
    activeFileId.value = fileList.value.some((file) => file.id === requestedId)
      ? requestedId
      : (fileList.value[0]?.id ?? "");
    rootDocumentExtras.value = extractRootExtras(document);
  };

  const resetDocument = (
    document: RootDocument = createDefaultRootDocument(),
  ): void => {
    replaceDocument(document);
  };

  const toDocument = (): RootDocument => {
    const current = getTab(activeFileId.value) ?? fileList.value[0];
    return {
      ...rootDocumentExtras.value,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      fileList: fileList.value,
      activeFile: current?.name ?? "File 1",
      ...(current?.id ? { activeFileId: current.id } : {}),
    };
  };

  const setActiveFileId = (fileKey: string): boolean => {
    const nextId = resolveFileId(fileKey);
    if (!nextId || nextId === activeFileId.value) {
      return false;
    }
    activeFileId.value = nextId;
    return true;
  };

  const addTab = (): FlowFile => {
    const file = createWorkspaceFile({
      name: `File ${fileList.value.length + 1}`,
    });
    fileList.value.push(file);
    activeFileId.value = file.id;
    return file;
  };

  const removeTab = (fileKey?: string): boolean => {
    const fileId = resolveFileId(fileKey);
    const index = fileList.value.findIndex((file) => file.id === fileId);
    if (index < 0) {
      return false;
    }

    fileList.value.splice(index, 1);
    if (activeFileId.value === fileId) {
      activeFileId.value =
        fileList.value[Math.max(0, index - 1)]?.id ??
        fileList.value[0]?.id ??
        "";
    }
    return true;
  };

  const setVisible = (fileKey: string, visible: boolean): boolean => {
    const file = getTab(fileKey);
    if (!file) {
      return false;
    }
    file.visible = visible;
    return true;
  };

  const renameFile = (fileKey: string, nextName: string): boolean => {
    const file = getTab(fileKey);
    const name = nextName.trim();
    if (!file || !name) {
      return false;
    }
    file.name = name;
    file.label = name;
    file.updatedAt = Date.now();
    return true;
  };

  const updateFileGraph = (
    fileKey: string,
    graphRawData: GraphData,
    transform: Transform,
    now = Date.now(),
  ): boolean => {
    const file = getTab(fileKey);
    if (!file) {
      return false;
    }
    file.graphRawData = normalizeWorkspaceGraph(graphRawData);
    file.transform = normalizeViewport(transform);
    file.updatedAt = now;
    return true;
  };

  return {
    fileList,
    activeFileId,
    rootDocumentExtras,
    visibleFiles,
    activeFile,
    getTab,
    resolveFileId,
    replaceDocument,
    resetDocument,
    toDocument,
    setActiveFileId,
    addTab,
    removeTab,
    setVisible,
    renameFile,
    updateFileGraph,
  };
});

export type FilesStore = ReturnType<typeof useFilesStore>;
