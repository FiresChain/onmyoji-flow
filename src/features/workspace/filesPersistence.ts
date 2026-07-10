import type { RootDocument } from "@/core/document/types";
import { createSafeStorage, type StorageLike } from "@/shared/platform/storage";

export const FILES_STORE_STORAGE_KEY = "filesStore";
export const DEFAULT_FILES_PERSISTENCE_DEBOUNCE_MS = 1000;

export interface FilesPersistence {
  load(): RootDocument | null;
  save(document: RootDocument): void;
  remove(): void;
  flush(): void;
  dispose(): void;
}

export interface LocalStorageFilesPersistenceOptions {
  storage?: StorageLike | null;
  debounceMs?: number;
}

const serializeDocument = (document: RootDocument): string =>
  JSON.stringify(document);

const deserializeDocument = (value: string): RootDocument =>
  JSON.parse(value) as RootDocument;

const cloneDocument = (document: RootDocument): RootDocument =>
  deserializeDocument(serializeDocument(document));

const normalizeDebounceMs = (value: number | undefined): number => {
  if (value == null) return DEFAULT_FILES_PERSISTENCE_DEBOUNCE_MS;
  return Number.isFinite(value) ? Math.max(0, value) : 0;
};

export const createLocalStorageFilesPersistence = (
  options: LocalStorageFilesPersistenceOptions = {},
): FilesPersistence => {
  const storage = createSafeStorage(FILES_STORE_STORAGE_KEY, options.storage);
  const debounceMs = normalizeDebounceMs(options.debounceMs);

  let disposed = false;
  let pendingValue: string | undefined;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = () => {
    if (timer == null) return;
    clearTimeout(timer);
    timer = null;
  };

  const commitPending = () => {
    clearTimer();
    if (disposed || pendingValue === undefined) return;
    const value = pendingValue;
    pendingValue = undefined;
    storage.write(value);
  };

  return {
    load() {
      if (disposed) return null;
      const value = storage.read();
      if (value == null) return null;

      try {
        return deserializeDocument(value);
      } catch {
        storage.remove();
        return null;
      }
    },
    save(document) {
      if (disposed) return;
      pendingValue = serializeDocument(document);
      clearTimer();

      if (debounceMs === 0) {
        commitPending();
        return;
      }
      timer = setTimeout(commitPending, debounceMs);
    },
    remove() {
      if (disposed) return;
      clearTimer();
      pendingValue = undefined;
      storage.remove();
    },
    flush() {
      if (disposed) return;
      commitPending();
    },
    dispose() {
      if (disposed) return;
      clearTimer();
      pendingValue = undefined;
      disposed = true;
    },
  };
};

export const createMemoryFilesPersistence = (
  initialDocument: RootDocument | null = null,
): FilesPersistence => {
  let disposed = false;
  let document = initialDocument ? cloneDocument(initialDocument) : null;

  return {
    load() {
      return !disposed && document ? cloneDocument(document) : null;
    },
    save(nextDocument) {
      if (disposed) return;
      document = cloneDocument(nextDocument);
    },
    remove() {
      if (disposed) return;
      document = null;
    },
    flush() {},
    dispose() {
      if (disposed) return;
      document = null;
      disposed = true;
    },
  };
};
