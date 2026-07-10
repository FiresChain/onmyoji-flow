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
  storage: StorageLike | null = getBrowserLocalStorage(),
): SafeStorage => {
  if (!key) {
    throw new TypeError("Storage key must not be empty");
  }

  return {
    key,
    read() {
      try {
        return storage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    write(value) {
      try {
        if (!storage) return false;
        storage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
    remove() {
      try {
        if (!storage) return false;
        storage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
  };
};
