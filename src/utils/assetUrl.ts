const ASSET_PREFIX = "/assets/";
const PROTOCOL_RE = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//;

let explicitAssetBaseUrl: string | null = null;
let inferredAssetBaseUrl: string | null = null;

const configuredAssetBaseUrl =
  typeof import.meta !== "undefined" &&
  typeof import.meta.env?.VITE_ASSET_BASE_URL === "string"
    ? import.meta.env.VITE_ASSET_BASE_URL.trim()
    : "";
const configuredAssetVersion =
  typeof import.meta !== "undefined" &&
  typeof import.meta.env?.VITE_ASSET_VERSION === "string"
    ? import.meta.env.VITE_ASSET_VERSION.trim()
    : "";

const ensureTrailingSlash = (value: string): string =>
  value.endsWith("/") ? value : `${value}/`;

const normalizeBaseUrl = (baseUrl: string): string => {
  const trimmed = baseUrl.trim();
  if (!trimmed) {
    return "/";
  }

  if (PROTOCOL_RE.test(trimmed)) {
    return ensureTrailingSlash(trimmed);
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return ensureTrailingSlash(withLeadingSlash);
};

const appendConfiguredVersion = (value: string): string => {
  if (!configuredAssetVersion) {
    return value;
  }

  const [withoutHash, hash = ""] = value.split("#", 2);
  const separator = withoutHash.includes("?") ? "&" : "?";
  const versioned = `${withoutHash}${separator}v=${encodeURIComponent(configuredAssetVersion)}`;
  return hash ? `${versioned}#${hash}` : versioned;
};

const inferFromNuxtRuntime = (): string | null => {
  if (typeof globalThis === "undefined") {
    return null;
  }

  const runtimeBase = (globalThis as any)?.__NUXT__?.config?.app?.baseURL;
  if (typeof runtimeBase === "string" && runtimeBase.trim()) {
    return normalizeBaseUrl(runtimeBase);
  }
  return null;
};

const inferFromScripts = (): string | null => {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return null;
  }

  const scripts = Array.from(document.querySelectorAll("script[src]"))
    .map((script) => script.getAttribute("src") || "")
    .filter(Boolean)
    .reverse();

  for (const src of scripts) {
    try {
      const pathname = new URL(src, window.location.origin).pathname;
      const markers = ["/_nuxt/", "/assets/", "/dist/"];
      for (const marker of markers) {
        const markerIndex = pathname.indexOf(marker);
        if (markerIndex >= 0) {
          const prefix = pathname.slice(0, markerIndex);
          return prefix ? ensureTrailingSlash(prefix) : "/";
        }
      }
    } catch {
      // 忽略非法 src
    }
  }

  return null;
};

const inferFromLocation = (): string => {
  if (typeof window === "undefined") {
    return "/";
  }
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return "/";
  }
  return `/${segments[0]}/`;
};

export const setAssetBaseUrl = (baseUrl?: string | null) => {
  if (!baseUrl) {
    explicitAssetBaseUrl = null;
    inferredAssetBaseUrl = null;
    return;
  }
  explicitAssetBaseUrl = normalizeBaseUrl(baseUrl);
};

export const getAssetBaseUrl = (): string => {
  if (explicitAssetBaseUrl) {
    return explicitAssetBaseUrl;
  }

  if (configuredAssetBaseUrl) {
    return normalizeBaseUrl(configuredAssetBaseUrl);
  }

  if (inferredAssetBaseUrl) {
    return inferredAssetBaseUrl;
  }

  const nuxtBase = inferFromNuxtRuntime();
  if (nuxtBase) {
    inferredAssetBaseUrl = nuxtBase;
    return inferredAssetBaseUrl;
  }

  const scriptBase = inferFromScripts();
  if (scriptBase) {
    inferredAssetBaseUrl = normalizeBaseUrl(scriptBase);
    return inferredAssetBaseUrl;
  }

  inferredAssetBaseUrl = normalizeBaseUrl(inferFromLocation());
  return inferredAssetBaseUrl;
};

export const resolveAssetUrl = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const baseUrl = getAssetBaseUrl();
  if (!value.startsWith(ASSET_PREFIX)) {
    const canonicalAbsolutePrefix = PROTOCOL_RE.test(baseUrl)
      ? `${baseUrl}assets/`
      : "";
    if (
      canonicalAbsolutePrefix &&
      value.startsWith(canonicalAbsolutePrefix) &&
      !value.includes("?v=") &&
      !value.includes("&v=")
    ) {
      return appendConfiguredVersion(value);
    }
    return value;
  }

  if (baseUrl === "/") {
    return value;
  }

  return appendConfiguredVersion(`${baseUrl}${value.slice(1)}`);
};

const isPlainObject = (value: unknown): value is Record<string, any> =>
  Object.prototype.toString.call(value) === "[object Object]";

export const rewriteAssetUrlsDeep = <T>(input: T): T => {
  if (typeof input === "string") {
    return resolveAssetUrl(input) as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => rewriteAssetUrlsDeep(item)) as T;
  }

  if (isPlainObject(input)) {
    const output: Record<string, any> = {};
    Object.keys(input).forEach((key) => {
      output[key] = rewriteAssetUrlsDeep((input as Record<string, any>)[key]);
    });
    return output as T;
  }

  return input;
};

export const resolveAssetUrlsInDataSource = <T extends Record<string, any>>(
  dataSource: T[],
  imageField: string,
): T[] =>
  dataSource.map((item) => {
    const imageValue = item?.[imageField];
    if (typeof imageValue !== "string") {
      return item;
    }
    return {
      ...item,
      [imageField]: resolveAssetUrl(imageValue),
    };
  });
