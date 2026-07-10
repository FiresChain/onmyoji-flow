import { afterEach, describe, expect, it, vi } from "vitest";

import { createSafeStorage, type StorageLike } from "@/shared/platform/storage";

const createMemoryStorage = (): StorageLike => {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("safe storage", () => {
  it("uses an explicit adapter and isolates operations to its owned key", () => {
    const storage = createMemoryStorage();
    storage.setItem("unrelated", "keep");
    const owned = createSafeStorage("owned", storage);

    expect(owned.write("value")).toBe(true);
    expect(owned.read()).toBe("value");
    expect(owned.remove()).toBe(true);
    expect(storage.getItem("owned")).toBeNull();
    expect(storage.getItem("unrelated")).toBe("keep");
  });

  it("resolves browser storage lazily when no adapter is supplied", () => {
    const initialStorage = createMemoryStorage();
    const laterStorage = createMemoryStorage();
    vi.stubGlobal("localStorage", initialStorage);
    const owned = createSafeStorage("owned");

    vi.stubGlobal("localStorage", laterStorage);
    expect(owned.write("late")).toBe(true);
    expect(initialStorage.getItem("owned")).toBeNull();
    expect(laterStorage.getItem("owned")).toBe("late");
  });

  it("keeps an explicit null adapter disabled", () => {
    const owned = createSafeStorage("owned", null);

    expect(owned.read()).toBeNull();
    expect(owned.write("value")).toBe(false);
    expect(owned.remove()).toBe(false);
  });
});
