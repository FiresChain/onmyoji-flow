const https = require("https");
const http = require("http");

const fetchText = (url, options = {}, redirectDepth = 0) =>
  new Promise((resolve, reject) => {
    if (redirectDepth > 5) {
      reject(new Error(`Too many redirects for ${url}`));
      return;
    }

    const protocol = url.startsWith("https") ? https : http;
    const req = protocol.request(
      url,
      {
        method: options.method || "GET",
        headers: options.headers || {},
        timeout: options.timeout || 20000,
      },
      (res) => {
        const status = res.statusCode || 0;
        if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
          const nextUrl = new URL(res.headers.location, url).toString();
          resolve(fetchText(nextUrl, options, redirectDepth + 1));
          return;
        }

        if (status < 200 || status >= 300) {
          reject(new Error(`HTTP ${status} for ${url}`));
          return;
        }

        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve(body);
        });
      },
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error(`Request timeout for ${url}`));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });

const fetchJson = async (url, options = {}) => {
  const text = await fetchText(url, options);
  return JSON.parse(text);
};

module.exports = {
  fetchText,
  fetchJson,
};
