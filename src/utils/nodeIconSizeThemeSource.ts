import {
  hasNodeIconSizeByTypeOverrides,
  normalizeNodeIconSizeByType,
  type NodeIconSizeByType,
} from "@/types/nodeIconSize";

export const NODE_ICON_SIZE_THEME_STORAGE_KEY = "yys-editor.node-icon-size.v1";
const NODE_ICON_SIZE_THEME_UPDATED_EVENT = "yys-editor.node-icon-size.updated";

const isClient = () =>
  typeof window !== "undefined" && typeof localStorage !== "undefined";

const notifyUpdated = () => {
  if (!isClient()) {
    return;
  }
  window.dispatchEvent(new CustomEvent(NODE_ICON_SIZE_THEME_UPDATED_EVENT));
};

export const readNodeIconSizeThemeConfig = (): NodeIconSizeByType => {
  if (!isClient()) {
    return {};
  }
  const raw = localStorage.getItem(NODE_ICON_SIZE_THEME_STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizeNodeIconSizeByType(parsed);
    const normalizedRaw = JSON.stringify(normalized);
    if (normalizedRaw !== raw) {
      localStorage.setItem(NODE_ICON_SIZE_THEME_STORAGE_KEY, normalizedRaw);
    }
    return normalized;
  } catch {
    return {};
  }
};

export const writeNodeIconSizeThemeConfig = (
  input: unknown,
): NodeIconSizeByType => {
  if (!isClient()) {
    return normalizeNodeIconSizeByType(input);
  }
  const normalized = normalizeNodeIconSizeByType(input);
  if (hasNodeIconSizeByTypeOverrides(normalized)) {
    localStorage.setItem(
      NODE_ICON_SIZE_THEME_STORAGE_KEY,
      JSON.stringify(normalized),
    );
  } else {
    localStorage.removeItem(NODE_ICON_SIZE_THEME_STORAGE_KEY);
  }
  notifyUpdated();
  return normalized;
};

export const clearNodeIconSizeThemeConfig = () => {
  if (!isClient()) {
    return;
  }
  localStorage.removeItem(NODE_ICON_SIZE_THEME_STORAGE_KEY);
  notifyUpdated();
};

export const subscribeNodeIconSizeThemeConfig = (
  listener: () => void,
): (() => void) => {
  if (!isClient()) {
    return () => {};
  }
  const handleStorage = (event: StorageEvent) => {
    if (event.key === NODE_ICON_SIZE_THEME_STORAGE_KEY) {
      listener();
    }
  };
  const handleCustom = () => {
    listener();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(NODE_ICON_SIZE_THEME_UPDATED_EVENT, handleCustom);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(NODE_ICON_SIZE_THEME_UPDATED_EVENT, handleCustom);
  };
};

