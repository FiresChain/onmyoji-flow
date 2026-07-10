export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SafeStorage {
  readonly key: string;
  read(): string | null;
  write(value: string): boolean;
  remove(): boolean;
}

const getBrowserLocalStorage = (): StorageLike | null => {
  try {
    return typeof globalThis === "undefined"
      ? null
      : (globalThis.localStorage ?? null);
  } catch {
    return null;
  }
};

export const createSafeStorage = (
  key: string,
  storage?: StorageLike | null,
): SafeStorage => {
  if (!key) {
    throw new TypeError("Storage key must not be empty");
  }

  const resolveStorage = () =>
    storage === undefined ? getBrowserLocalStorage() : storage;

  return {
    key,
    read() {
      try {
        return resolveStorage()?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    write(value) {
      try {
        const target = resolveStorage();
        if (!target) return false;
        target.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
    remove() {
      try {
        const target = resolveStorage();
        if (!target) return false;
        target.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
  };
};
