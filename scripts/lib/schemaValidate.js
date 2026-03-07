const fs = require("fs");
const path = require("path");

const validateLocalizedText = (value, fieldPath, errors) => {
  if (!value || typeof value !== "object") {
    errors.push(`${fieldPath} must be object`);
    return;
  }
  for (const key of ["zh", "ja", "en"]) {
    if (typeof value[key] !== "string" || !value[key].trim()) {
      errors.push(`${fieldPath}.${key} must be non-empty string`);
    }
  }
};

const validateLibraryItems = (library, items) => {
  const errors = [];
  const warnings = [];
  if (!Array.isArray(items)) {
    return {
      errors: [`${library} is not an array`],
      warnings,
    };
  }

  const idSet = new Set();
  items.forEach((item, index) => {
    const prefix = `${library}[${index}]`;
    if (!item || typeof item !== "object") {
      errors.push(`${prefix} must be object`);
      return;
    }
    if (typeof item.id !== "string" || !item.id.trim()) {
      errors.push(`${prefix}.id must be non-empty string`);
    }
    if (item.library !== library) {
      errors.push(`${prefix}.library must equal ${library}`);
    }
    if (typeof item.avatar !== "string" || !item.avatar.trim()) {
      errors.push(`${prefix}.avatar must be non-empty string`);
    }
    validateLocalizedText(item.names, `${prefix}.names`, errors);

    if (library === "shikigami") {
      if (typeof item.rarity !== "string" || !item.rarity.trim()) {
        errors.push(`${prefix}.rarity must be non-empty string`);
      }
    }

    if (library === "yuhun") {
      if (typeof item.type !== "string" || !item.type.trim()) {
        errors.push(`${prefix}.type must be non-empty string`);
      }
      validateLocalizedText(item.shortNames, `${prefix}.shortNames`, errors);
    }

    if (library === "onmyojiSkill") {
      if (typeof item.onmyojiId !== "string" || !item.onmyojiId.trim()) {
        errors.push(`${prefix}.onmyojiId must be non-empty string`);
      }
      if (typeof item.skillId !== "string" || !item.skillId.trim()) {
        errors.push(`${prefix}.skillId must be non-empty string`);
      }
    }

    const id = typeof item.id === "string" ? item.id.trim() : "";
    if (id) {
      if (idSet.has(id)) {
        errors.push(`${library} has duplicated id: ${id}`);
      }
      idSet.add(id);
    }
  });

  return { errors, warnings };
};

const validateAvatarFiles = (rootDir, items) => {
  const errors = [];
  items.forEach((item, index) => {
    const avatar = typeof item.avatar === "string" ? item.avatar : "";
    const normalizedAvatar = avatar.replace(/^\//, "");
    const avatarPath = path.join(rootDir, normalizedAvatar);
    if (!fs.existsSync(avatarPath)) {
      errors.push(`missing avatar file for item[${index}] => ${avatar}`);
    }
  });
  return errors;
};

const validateSkillOwnership = (onmyojiItems, onmyojiSkillItems) => {
  const errors = [];
  const ownerSet = new Set(
    (Array.isArray(onmyojiItems) ? onmyojiItems : [])
      .map((item) => (typeof item?.id === "string" ? item.id.trim() : ""))
      .filter(Boolean),
  );

  (Array.isArray(onmyojiSkillItems) ? onmyojiSkillItems : []).forEach((item, index) => {
    const owner = typeof item?.onmyojiId === "string" ? item.onmyojiId.trim() : "";
    if (owner && !ownerSet.has(owner)) {
      errors.push(`onmyojiSkill[${index}] owner missing: ${owner}`);
    }
  });

  return errors;
};

module.exports = {
  validateLibraryItems,
  validateAvatarFiles,
  validateSkillOwnership,
};
