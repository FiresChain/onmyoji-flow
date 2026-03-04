const fs = require("fs");
const path = require("path");
const { writeJsonAtomic } = require("./lib/writeAtomic");
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
const { collectOnmyojiAssets } = require("./providers/onmyoji.provider");
const {
  collectOnmyojiSkillAssets,
} = require("./providers/onmyojiSkill.provider");

const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_ASSET_DIR = path.join(ROOT_DIR, "src", "data", "assets");
const FALLBACK_DIR = path.join(__dirname, "fallback");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

const LIBRARIES = {
  shikigami: {
    fileName: "shikigami.json",
    provider: collectShikigamiAssets,
    pruneRoots: ["assets/Shikigami"],
  },
  yuhun: {
    fileName: "yuhun.json",
    provider: collectYuhunAssets,
    pruneRoots: [],
  },
  onmyoji: {
    fileName: "onmyoji.json",
    provider: collectOnmyojiAssets,
    pruneRoots: ["assets/downloaded_images"],
  },
  onmyojiSkill: {
    fileName: "onmyojiSkill.json",
    provider: collectOnmyojiSkillAssets,
    pruneRoots: ["assets/downloaded_images"],
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

const readFallbackAssets = (library) => {
  const filePath = path.join(FALLBACK_DIR, LIBRARIES[library].fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fallback not found: ${filePath}`);
  }
  return readJsonFile(filePath);
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

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const selectedLibraries = selectLibraries(options.library);
  const runReport = {
    options,
    libraries: {},
    errors: [],
    warnings: [],
  };

  const outputAssets = {};

  for (const library of selectedLibraries) {
    const entry = LIBRARIES[library];
    let assets = [];
    let source = "fallback";
    let images = [];
    const warnings = [];

    try {
      const result = await entry.provider();
      if (!result || !Array.isArray(result.assets) || result.assets.length === 0) {
        throw new Error(`Official provider returned empty result: ${library}`);
      }
      assets = result.assets;
      source = result.source || "official";
      images = Array.isArray(result.images) ? result.images : [];
      (result.warnings || []).forEach((warning) => warnings.push(warning));
    } catch (error) {
      warnings.push(
        `official provider failed (${library}): ${error instanceof Error ? error.message : String(error)}`,
      );
      assets = readFallbackAssets(library);
      source = "fallback";
      images = [];
    }

    const validation = validateLibraryItems(library, assets);
    if (validation.errors.length > 0) {
      throw new Error(
        `${library} validation failed: ${validation.errors.join("; ")}`,
      );
    }
    warnings.push(...validation.warnings);

    if (!options.noDownload && images.length > 0) {
      const downloadResult = await downloadAssets(images, {
        rootDir: ROOT_DIR,
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

    outputAssets[library] = assets;

    if (!options.dryRun) {
      const targetPath = path.join(SRC_ASSET_DIR, entry.fileName);
      writeJsonAtomic(targetPath, assets);
    }

    runReport.libraries[library] = {
      source,
      count: assets.length,
      warnings,
    };
  }

  if (outputAssets.onmyoji && outputAssets.onmyojiSkill) {
    const ownershipErrors = validateSkillOwnership(
      outputAssets.onmyoji,
      outputAssets.onmyojiSkill,
    );
    if (ownershipErrors.length > 0) {
      throw new Error(`cross validation failed: ${ownershipErrors.join("; ")}`);
    }
  }

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    libraries: Object.fromEntries(
      Object.entries(runReport.libraries).map(([library, info]) => [
        library,
        {
          count: info.count,
          source: info.source,
        },
      ]),
    ),
  };

  if (!options.dryRun) {
    writeJsonAtomic(path.join(SRC_ASSET_DIR, "manifest.json"), manifest);
  }

  const finalReport = buildReport(runReport);
  writeReport(options.report, finalReport);

  console.log(JSON.stringify(finalReport, null, 2));
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
