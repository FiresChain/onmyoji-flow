import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RootDocument } from "@/core/document/types";
import {
  FILES_STORE_STORAGE_KEY,
  createLocalStorageFilesPersistence,
  createMemoryFilesPersistence,
} from "@/features/workspace/filesPersistence";
import { createSafeStorage } from "@/shared/platform/storage";

const createDocument = (activeFile = "File 1"): RootDocument => ({
  schemaVersion: "1.0.0",
  fileList: [
    {
      id: "file-1",
      label: "File 1",
      name: "File 1",
      visible: true,
      type: "FLOW",
      graphRawData: { nodes: [], edges: [] },
      transform: {
        SCALE_X: 1,
        SCALE_Y: 1,
        TRANSLATE_X: 0,
        TRANSLATE_Y: 0,
      },
    },
  ],
  activeFile,
  activeFileId: "file-1",
});

const createStorageMock = () => {
  const values = new Map<string, string>();
  return {
    values,
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    clear: vi.fn(() => values.clear()),
  };
};

describe("safe owned-key storage", () => {
  it("only reads, writes, and removes its owned key", () => {
    const rawStorage = createStorageMock();
    rawStorage.values.set("unrelated", "keep-me");
    const storage = createSafeStorage("owned", rawStorage);

    expect(storage.write("value")).toBe(true);
    expect(storage.read()).toBe("value");
    expect(storage.remove()).toBe(true);

    expect(rawStorage.getItem).toHaveBeenCalledWith("owned");
    expect(rawStorage.setItem).toHaveBeenCalledWith("owned", "value");
    expect(rawStorage.removeItem).toHaveBeenCalledWith("owned");
    expect(rawStorage.values.get("unrelated")).toBe("keep-me");
    expect(rawStorage.clear).not.toHaveBeenCalled();
  });

  it("contains storage access failures without broad cleanup", () => {
    const storage = createSafeStorage("owned", {
      getItem: () => {
        throw new Error("read failed");
      },
      setItem: () => {
        throw new Error("write failed");
      },
      removeItem: () => {
        throw new Error("remove failed");
      },
    });

    expect(storage.read()).toBeNull();
    expect(storage.write("value")).toBe(false);
    expect(storage.remove()).toBe(false);
  });
});

describe("localStorage files persistence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the filesStore key and keeps debounce timers instance-local", () => {
    const storage = createStorageMock();
    const first = createLocalStorageFilesPersistence({
      storage,
      debounceMs: 100,
    });
    const second = createLocalStorageFilesPersistence({
      storage,
      debounceMs: 100,
    });

    first.save(createDocument("First"));
    first.save(createDocument("First latest"));
    second.save(createDocument("Second"));

    vi.advanceTimersByTime(99);
    expect(storage.setItem).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(storage.setItem).toHaveBeenCalledTimes(2);
    expect(storage.setItem.mock.calls.map(([key]) => key)).toEqual([
      FILES_STORE_STORAGE_KEY,
      FILES_STORE_STORAGE_KEY,
    ]);
    expect(
      storage.setItem.mock.calls.map(
        ([, value]) => JSON.parse(value).activeFile,
      ),
    ).toEqual(expect.arrayContaining(["First latest", "Second"]));
  });

  it("flushes immediately and does not write the same pending value twice", () => {
    const storage = createStorageMock();
    const persistence = createLocalStorageFilesPersistence({
      storage,
      debounceMs: 100,
    });
    const document = createDocument();

    persistence.save(document);
    persistence.flush();

    expect(storage.setItem).toHaveBeenCalledOnce();
    expect(persistence.load()).toEqual(document);

    vi.advanceTimersByTime(100);
    expect(storage.setItem).toHaveBeenCalledOnce();
  });

  it("removes only filesStore when stored JSON is corrupted", () => {
    const storage = createStorageMock();
    storage.values.set(FILES_STORE_STORAGE_KEY, "{");
    storage.values.set("unrelated", "keep-me");
    const persistence = createLocalStorageFilesPersistence({ storage });

    expect(persistence.load()).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith(FILES_STORE_STORAGE_KEY);
    expect(storage.values.get("unrelated")).toBe("keep-me");
    expect(storage.clear).not.toHaveBeenCalled();
  });

  it("remove cancels a pending write before deleting its owned key", () => {
    const storage = createStorageMock();
    storage.values.set(FILES_STORE_STORAGE_KEY, "old-value");
    const persistence = createLocalStorageFilesPersistence({
      storage,
      debounceMs: 100,
    });

    persistence.save(createDocument());
    persistence.remove();
    vi.advanceTimersByTime(100);

    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).toHaveBeenCalledWith(FILES_STORE_STORAGE_KEY);
    expect(storage.values.has(FILES_STORE_STORAGE_KEY)).toBe(false);
  });

  it("dispose cancels pending work and prevents late or subsequent writes", () => {
    const storage = createStorageMock();
    storage.values.set(FILES_STORE_STORAGE_KEY, "old-value");
    const persistence = createLocalStorageFilesPersistence({
      storage,
      debounceMs: 100,
    });

    persistence.save(createDocument("Pending"));
    persistence.dispose();
    persistence.save(createDocument("After dispose"));
    persistence.flush();
    vi.advanceTimersByTime(100);

    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.values.get(FILES_STORE_STORAGE_KEY)).toBe("old-value");
    expect(persistence.load()).toBeNull();
  });
});

describe("memory files persistence", () => {
  it("stays isolated from localStorage and clones serializable state", () => {
    const localStorageGetter = vi.spyOn(globalThis, "localStorage", "get");
    try {
      const initial = createDocument("Initial");
      const persistence = createMemoryFilesPersistence(initial);

      initial.activeFile = "Mutated source";
      expect(persistence.load()?.activeFile).toBe("Initial");

      const loaded = persistence.load();
      if (loaded) loaded.activeFile = "Mutated result";
      expect(persistence.load()?.activeFile).toBe("Initial");

      persistence.save(createDocument("Saved"));
      persistence.flush();
      expect(persistence.load()?.activeFile).toBe("Saved");
      expect(localStorageGetter).not.toHaveBeenCalled();

      persistence.remove();
      expect(persistence.load()).toBeNull();
    } finally {
      localStorageGetter.mockRestore();
    }
  });

  it("clears its instance state on dispose", () => {
    const persistence = createMemoryFilesPersistence(createDocument());

    persistence.dispose();
    persistence.save(createDocument("After dispose"));

    expect(persistence.load()).toBeNull();
  });
});
