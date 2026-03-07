const fs = require("fs");
const path = require("path");
const {
  validateLibraryItems,
  validateAvatarFiles,
  validateSkillOwnership,
} = require("./lib/schemaValidate");

const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_ASSET_DIR = path.join(ROOT_DIR, "src", "data", "assets");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

const LIBRARIES = ["shikigami", "yuhun", "onmyoji", "onmyojiSkill"];

const readJsonFile = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const main = () => {
  const allErrors = [];
  const allWarnings = [];
  const assetsMap = {};

  for (const library of LIBRARIES) {
    const filePath = path.join(SRC_ASSET_DIR, `${library}.json`);
    if (!fs.existsSync(filePath)) {
      allErrors.push(`${library} file missing: ${filePath}`);
      continue;
    }

    const items = readJsonFile(filePath);
    assetsMap[library] = items;

    const validation = validateLibraryItems(library, items);
    allErrors.push(...validation.errors.map((item) => `[${library}] ${item}`));
    allWarnings.push(
      ...validation.warnings.map((item) => `[${library}] ${item}`),
    );

    const avatarErrors = validateAvatarFiles(PUBLIC_DIR, items);
    allErrors.push(...avatarErrors.map((item) => `[${library}] ${item}`));
  }

  const ownershipErrors = validateSkillOwnership(
    assetsMap.onmyoji || [],
    assetsMap.onmyojiSkill || [],
  );
  allErrors.push(...ownershipErrors.map((item) => `[cross] ${item}`));

  if (allWarnings.length > 0) {
    console.log("warnings:");
    allWarnings.forEach((warning) => console.log(`- ${warning}`));
  }

  if (allErrors.length > 0) {
    console.error("errors:");
    allErrors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log("asset verification passed");
};

main();
