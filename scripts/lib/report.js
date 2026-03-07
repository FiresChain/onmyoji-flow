const fs = require("fs");
const path = require("path");

const buildReport = (input) => ({
  generatedAt: new Date().toISOString(),
  ...input,
});

const writeReport = (targetPath, report) => {
  if (!targetPath) {
    return;
  }
  const fullPath = path.resolve(targetPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
};

module.exports = {
  buildReport,
  writeReport,
};
