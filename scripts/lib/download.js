const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

class DownloadHttpError extends Error {
  constructor(url, status) {
    super(`HTTP ${status} for ${url}`);
    this.name = "DownloadHttpError";
    this.url = url;
    this.status = status;
  }
}

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
        response.resume();
        file.close();
        fs.unlink(filePath, () => {});
        const nextUrl = new URL(response.headers.location, url).toString();
        resolve(downloadFile(nextUrl, filePath, redirectDepth + 1));
        return;
      }

      if (status < 200 || status >= 300) {
        response.resume();
        file.close();
        fs.unlink(filePath, () => {});
        reject(new DownloadHttpError(url, status));
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
  const missing = [];

  for (const item of assets) {
    const targetPath = path.join(rootDir, item.relativePath.replace(/^\/+/, ""));
    if (skipExisting && fs.existsSync(targetPath)) {
      skipped.push(item.relativePath);
      continue;
    }
    try {
      await downloadFile(item.url, targetPath);
    } catch (error) {
      if (item.optional && error instanceof DownloadHttpError && error.status === 404) {
        missing.push(item.relativePath);
        logger.warn(`missing optional asset ${item.relativePath}: ${item.url}`);
        continue;
      }
      throw error;
    }
    downloaded.push(item.relativePath);
    logger.log(`downloaded ${item.relativePath}`);
  }

  return { downloaded, skipped, missing };
};

module.exports = {
  DownloadHttpError,
  ensureDir,
  downloadFile,
  downloadAssets,
};
