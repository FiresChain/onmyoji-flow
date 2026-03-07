const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const downloadFile = (url, filePath, redirectDepth = 0) =>
  new Promise((resolve, reject) => {
    if (redirectDepth > 5) {
      reject(new Error(`Too many redirects for ${url}`));
      return;
    }

    ensureDir(path.dirname(filePath));
    const protocol = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(filePath);

    const request = protocol.get(url, (response) => {
      const status = response.statusCode || 0;
      if ([301, 302, 303, 307, 308].includes(status) && response.headers.location) {
        file.close();
        fs.unlink(filePath, () => {});
        const nextUrl = new URL(response.headers.location, url).toString();
        resolve(downloadFile(nextUrl, filePath, redirectDepth + 1));
        return;
      }

      if (status < 200 || status >= 300) {
        file.close();
        fs.unlink(filePath, () => {});
        reject(new Error(`HTTP ${status} for ${url}`));
        return;
      }

      response.pipe(file);
      file.on("finish", () => {
        file.close(() => resolve(undefined));
      });
    });

    request.on("error", (error) => {
      file.close();
      fs.unlink(filePath, () => {});
      reject(error);
    });
  });

const downloadAssets = async (assets, options = {}) => {
  const { rootDir, skipExisting = true, logger = console } = options;
  const downloaded = [];
  const skipped = [];

  for (const item of assets) {
    const targetPath = path.join(rootDir, item.relativePath.replace(/^\/+/, ""));
    if (skipExisting && fs.existsSync(targetPath)) {
      skipped.push(item.relativePath);
      continue;
    }
    await downloadFile(item.url, targetPath);
    downloaded.push(item.relativePath);
    logger.log(`downloaded ${item.relativePath}`);
  }

  return { downloaded, skipped };
};

module.exports = {
  ensureDir,
  downloadFile,
  downloadAssets,
};
