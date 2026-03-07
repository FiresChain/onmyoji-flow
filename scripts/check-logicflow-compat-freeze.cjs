"use strict";

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const srcDir = path.join(projectRoot, "src");
const typesDir = path.join(srcDir, "types");

const ALLOWED_COMPAT_FILES = new Set([
  "logicflow-core-compat.d.ts",
  "logicflow-extension-compat.d.ts",
  "logicflow-vue-node-registry-compat.d.ts",
]);

function walkFiles(dir, predicate, collector = []) {
  if (!fs.existsSync(dir)) return collector;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, predicate, collector);
      return;
    }
    if (predicate(fullPath)) {
      collector.push(fullPath);
    }
  });

  return collector;
}

function toProjectRelative(filePath) {
  return path.relative(projectRoot, filePath).replaceAll("\\", "/");
}

function failWith(title, lines) {
  console.error(`[compat-freeze] ${title}`);
  lines.forEach((line) => console.error(`  - ${line}`));
  process.exit(1);
}

const compatFiles = walkFiles(typesDir, (filePath) =>
  filePath.endsWith("-compat.d.ts"),
);

const unexpectedCompatFiles = compatFiles.filter((filePath) => {
  return !ALLOWED_COMPAT_FILES.has(path.basename(filePath));
});

if (unexpectedCompatFiles.length > 0) {
  failWith(
    "Found new compat declaration files outside allowlist.",
    unexpectedCompatFiles.map(toProjectRelative),
  );
}

const dtsFiles = walkFiles(srcDir, (filePath) => filePath.endsWith(".d.ts"));
const logicflowDeclareRegex = /declare\s+module\s+["']@logicflow\//;
const unexpectedDeclareLocations = [];

dtsFiles.forEach((filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  if (!logicflowDeclareRegex.test(content)) return;
  if (ALLOWED_COMPAT_FILES.has(path.basename(filePath))) return;
  unexpectedDeclareLocations.push(toProjectRelative(filePath));
});

if (unexpectedDeclareLocations.length > 0) {
  failWith(
    "Found new '@logicflow/*' ambient module declarations outside compat allowlist.",
    unexpectedDeclareLocations,
  );
}

console.log(
  `[compat-freeze] pass (${compatFiles.length} compat declaration file(s) currently present)`,
);
