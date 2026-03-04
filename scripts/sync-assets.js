const fs = require("fs");
const path = require("path");
const {
  writeJsonWithBackup,
} = require("./lib/writeAtomic");
const { downloadAssets } = require("./lib/download");
const {
  validateLibraryItems,
  validateSkillOwnership,
} = require("./lib/schemaValidate");
const { buildReport, writeReport } = require("./lib/report");
const {
  collectShikigamiAssets,
} = require("./providers/shikigami.provider");
const { collectYuhunAssets } = require("./providers/yuhun.provider");

const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_ASSET_DIR = path.join(ROOT_DIR, "src", "data", "assets");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

const MODES = {
  JSON_SYNC: "json-sync",
  IMAGE_ONLY_SYNC: "image-only-sync",
  MANUAL_ONLY: "manual-only",
};

const LIBRARIES = {
  shikigami: {
    fileName: "shikigami.json",
    mode: MODES.JSON_SYNC,
    provider: collectShikigamiAssets,
    pruneRoots: ["assets/Shikigami"],
  },
  yuhun: {
    fileName: "yuhun.json",
    mode: MODES.IMAGE_ONLY_SYNC,
    provider: collectYuhunAssets,
    pruneRoots: [],
  },
  onmyoji: {
    fileName: "onmyoji.json",
    mode: MODES.MANUAL_ONLY,
    pruneRoots: [],
  },
  onmyojiSkill: {
    fileName: "onmyojiSkill.json",
    mode: MODES.MANUAL_ONLY,
    pruneRoots: [],
  },
};

const parseArgs = (argv) => {
  const options = {
    library: "all",
    dryRun: false,
    noDownload: false,
    prune: false,
    report: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--library") {
      options.library = argv[i + 1] || "all";
      i += 1;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--no-download") {
      options.noDownload = true;
      continue;
    }
    if (arg === "--prune") {
      options.prune = true;
      continue;
    }
    if (arg === "--report") {
      options.report = argv[i + 1] || "";
      i += 1;
      continue;
    }
  }

  return options;
};

const readJsonFile = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const readLibraryAssets = (library) => {
  const filePath = path.join(SRC_ASSET_DIR, LIBRARIES[library].fileName);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const value = readJsonFile(filePath);
  return Array.isArray(value) ? value : [];
};

const readManifestSnapshot = () => {
  const manifestPath = path.join(SRC_ASSET_DIR, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return null;
  }
  const parsed = readJsonFile(manifestPath);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  return parsed;
};

const toAssetPathSet = (assets) =>
  new Set(
    assets
      .map((item) => (typeof item?.avatar === "string" ? item.avatar : ""))
      .filter(Boolean)
      .map((avatar) => avatar.replace(/^\//, "")),
  );

const pruneFiles = (rootPath, expectedSet, options = {}) => {
  const removed = [];
  if (!fs.existsSync(rootPath)) {
    return removed;
  }

  const stack = [rootPath];
  while (stack.length > 0) {
    const current = stack.pop();
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      const children = fs.readdirSync(current);
      children.forEach((name) => stack.push(path.join(current, name)));
      continue;
    }

    const relativePath = path
      .relative(PUBLIC_DIR, current)
      .replace(/\\/g, "/");
    if (expectedSet.has(relativePath)) {
      continue;
    }

    if (options.dryRun) {
      removed.push(relativePath);
      continue;
    }

    fs.unlinkSync(current);
    removed.push(relativePath);
  }

  return removed;
};

const selectLibraries = (libraryArg) => {
  if (!libraryArg || libraryArg === "all") {
    return Object.keys(LIBRARIES);
  }
  if (!LIBRARIES[libraryArg]) {
    throw new Error(`Unknown library: ${libraryArg}`);
  }
  return [libraryArg];
};

const syncJsonLibrary = async (library, entry, options) => {
  const result = await entry.provider();
  if (!result || !Array.isArray(result.assets) || result.assets.length === 0) {
    throw new Error(`Official provider returned empty result: ${library}`);
  }

  const assets = result.assets;
  const source = result.source || "official";
  const images = Array.isArray(result.images) ? result.images : [];
  const warnings = Array.isArray(result.warnings) ? [...result.warnings] : [];

  const validation = validateLibraryItems(library, assets);
  if (validation.errors.length > 0) {
    throw new Error(`${library} validation failed: ${validation.errors.join("; ")}`);
  }
  warnings.push(...validation.warnings);

  let downloadResult = { downloaded: [], skipped: [] };
  if (!options.noDownload && !options.dryRun && images.length > 0) {
    downloadResult = await downloadAssets(images, {
      rootDir: PUBLIC_DIR,
      skipExisting: true,
      logger: console,
    });
    warnings.push(
      `${library} downloaded=${downloadResult.downloaded.length}, skipped=${downloadResult.skipped.length}`,
    );
  }

  if (options.prune && entry.pruneRoots.length > 0) {
    const expectedSet = toAssetPathSet(assets);
    const removed = [];
    entry.pruneRoots.forEach((relativeRoot) => {
      const removedInRoot = pruneFiles(
        path.join(PUBLIC_DIR, relativeRoot),
        expectedSet,
        {
          dryRun: options.dryRun,
        },
      );
      removed.push(...removedInRoot);
    });
    warnings.push(`${library} pruned=${removed.length}`);
  }

  if (!options.dryRun) {
    writeJsonWithBackup(path.join(SRC_ASSET_DIR, entry.fileName), assets);
  }

  return {
    mode: entry.mode,
    source,
    count: assets.length,
    warnings,
    downloaded: downloadResult.downloaded.length,
    skipped: downloadResult.skipped.length,
    assets,
  };
};

const syncImageOnlyLibrary = async (library, entry, options) => {
  const result = await entry.provider();
  const images = Array.isArray(result?.images) ? result.images : [];
  if (images.length === 0) {
    throw new Error(`Official provider returned no images: ${library}`);
  }

  const warnings = Array.isArray(result?.warnings) ? [...result.warnings] : [];
  const source = typeof result?.source === "string" && result.source
    ? result.source
    : "official-image-only";
  const foundIds = Array.isArray(result?.foundIds) ? result.foundIds : [];

  let downloadResult = { downloaded: [], skipped: [] };
  if (!options.noDownload && !options.dryRun) {
    downloadResult = await downloadAssets(images, {
      rootDir: PUBLIC_DIR,
      skipExisting: true,
      logger: console,
    });
  }
  warnings.push(
    `${library} downloaded=${downloadResult.downloaded.length}, skipped=${downloadResult.skipped.length}`,
  );

  return {
    mode: entry.mode,
    source,
    count: readLibraryAssets(library).length,
    warnings,
    downloaded: downloadResult.downloaded.length,
    skipped: downloadResult.skipped.length,
    foundIds,
  };
};

const syncManualOnlyLibrary = (library, entry) => {
  const existing = readLibraryAssets(library);
  return {
    mode: entry.mode,
    source: "manual",
    count: existing.length,
    warnings: [
      `${library} is manual-only and skipped by sync script`,
    ],
  };
};

const mergeManifest = (runLibraries, manifestSnapshot, currentAssetsByLibrary) => ({
  version: 2,
  generatedAt: new Date().toISOString(),
  libraries: Object.fromEntries(
    Object.keys(LIBRARIES).map((library) => {
      const runInfo = runLibraries[library];
      const previous = manifestSnapshot?.libraries?.[library] || {};
      const source = runInfo?.source
        || (typeof previous.source === "string" ? previous.source : "local-json");
      const syncMode = runInfo?.mode
        || (typeof previous.syncMode === "string"
          ? previous.syncMode
          : LIBRARIES[library].mode);
      return [
        library,
        {
          count: currentAssetsByLibrary[library].length,
          source,
          syncMode,
        },
      ];
    }),
  ),
});

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const selectedLibraries = selectLibraries(options.library);
  const manifestSnapshot = readManifestSnapshot();

  const runReport = {
    options,
    libraries: {},
    errors: [],
    warnings: [],
  };

  const currentAssetsByLibrary = Object.fromEntries(
    Object.keys(LIBRARIES).map((library) => [library, readLibraryAssets(library)]),
  );

  for (const library of selectedLibraries) {
    const entry = LIBRARIES[library];
    let result;
    if (entry.mode === MODES.JSON_SYNC) {
      result = await syncJsonLibrary(library, entry, options);
      currentAssetsByLibrary[library] = result.assets;
    } else if (entry.mode === MODES.IMAGE_ONLY_SYNC) {
      result = await syncImageOnlyLibrary(library, entry, options);
    } else {
      result = syncManualOnlyLibrary(library, entry);
    }

    const reportEntry = {
      mode: result.mode,
      source: result.source,
      count: result.count,
      warnings: result.warnings,
    };
    if (typeof result.downloaded === "number") {
      reportEntry.downloaded = result.downloaded;
    }
    if (typeof result.skipped === "number") {
      reportEntry.skipped = result.skipped;
    }
    if (Array.isArray(result.foundIds) && result.foundIds.length > 0) {
      reportEntry.foundIds = result.foundIds;
    }
    runReport.libraries[library] = reportEntry;
  }

  const ownershipErrors = validateSkillOwnership(
    currentAssetsByLibrary.onmyoji,
    currentAssetsByLibrary.onmyojiSkill,
  );
  if (ownershipErrors.length > 0) {
    throw new Error(`cross validation failed: ${ownershipErrors.join("; ")}`);
  }

  const manifest = mergeManifest(
    runReport.libraries,
    manifestSnapshot,
    currentAssetsByLibrary,
  );

  if (!options.dryRun) {
    writeJsonWithBackup(path.join(SRC_ASSET_DIR, "manifest.json"), manifest);
  }

  const finalReport = buildReport(runReport);
  writeReport(options.report, finalReport);

  console.log(JSON.stringify(finalReport, null, 2));
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
