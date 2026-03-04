const { fetchText } = require("../lib/http");

const collectOnmyojiAssets = async () => {
  // 预留官方抓取位：页面结构稳定前先尝试请求，失败由 fallback 接管。
  await fetchText("https://yys.163.com/");
  throw new Error("Official onmyoji parser is not configured yet");
};

module.exports = {
  collectOnmyojiAssets,
};
