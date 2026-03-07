const { fetchText } = require("../lib/http");

const collectOnmyojiSkillAssets = async () => {
  // 当前改为手工维护；此 provider 仅保留连通性探测能力。
  await fetchText("https://yys.163.com/");
  throw new Error("Official onmyojiSkill parser is not configured yet");
};

module.exports = {
  collectOnmyojiSkillAssets,
};
