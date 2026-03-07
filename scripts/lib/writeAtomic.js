const fs = require("fs");
const path = require("path");

const writeJsonAtomic = (targetPath, value) => {
  const dirPath = path.dirname(targetPath);
  fs.mkdirSync(dirPath, { recursive: true });
  const tempPath = `${targetPath}.tmp-${Date.now()}`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, targetPath);
};

const writeJsonWithBackup = (targetPath, value) => {
  const dirPath = path.dirname(targetPath);
  fs.mkdirSync(dirPath, { recursive: true });

  if (fs.existsSync(targetPath)) {
    const backupPath = `${targetPath}.bak`;
    fs.copyFileSync(targetPath, backupPath);
  }

  writeJsonAtomic(targetPath, value);
};

module.exports = {
  writeJsonAtomic,
  writeJsonWithBackup,
};
