"use strict";

const path = require("node:path");

const LEGACY_CONTAINERS = new Set(["configs", "stores", "ts", "utils"]);
const LOGICFLOW_PACKAGE_PREFIX = "@logicflow/";
const ROOT_DOCUMENT_TYPES = "core/document/types";
const ROOT_LOGICFLOW_TYPES = "core/logicflow/types";
const FLOW_RUNTIME_FACADE = "flowRuntime";
const FLOW_NODE_REGISTRY = "editor/node-types/registry";
const CORE_DOCUMENT_FORBIDDEN_PACKAGES = [
  "vue",
  "@vue",
  "pinia",
  "element-plus",
  "@logicflow",
];

const ALLOWED_INTERNAL_LAYERS = Object.freeze({
  shells: [
    "shells",
    "editor",
    "feature",
    "core-document",
    "core-logicflow",
    "shared",
    "data",
    "assets",
    "types",
  ],
  editor: [
    "editor",
    "feature",
    "core-document",
    "core-logicflow",
    "shared",
    "data",
    "assets",
    "types",
  ],
  feature: [
    "feature",
    "core-document",
    "core-logicflow",
    "shared",
    "data",
    "types",
  ],
  "core-document": ["core-document", "shared", "types"],
  "core-logicflow": ["core-logicflow", "core-document", "shared", "types"],
  shared: ["shared", "types"],
  data: ["data", "types"],
  types: ["types"],
  assets: ["assets"],
});

const normalizePath = (value) => value.split(path.sep).join("/");

const stripModuleSuffix = (value) =>
  value
    .replace(/[?#].*$/, "")
    .replace(/\.(?:[cm]?[jt]sx?|vue)$/, "")
    .replace(/\/index$/, "");

const classifyModule = (relativePath) => {
  const canonicalPath = stripModuleSuffix(normalizePath(relativePath));
  const segments = canonicalPath.split("/").filter(Boolean);
  const [topLevel, secondLevel] = segments;

  if (segments.length === 1) {
    return { layer: "root", canonicalPath };
  }
  if (topLevel === "shells") {
    return { layer: "shells", canonicalPath };
  }
  if (topLevel === "editor") {
    return { layer: "editor", canonicalPath };
  }
  if (topLevel === "features" && secondLevel) {
    return {
      layer: "feature",
      canonicalPath,
      featureName: secondLevel,
      featurePath: segments.slice(2).join("/"),
    };
  }
  if (topLevel === "core" && secondLevel === "document") {
    return { layer: "core-document", canonicalPath };
  }
  if (topLevel === "core" && secondLevel === "logicflow") {
    return { layer: "core-logicflow", canonicalPath };
  }
  if (topLevel === "shared") {
    return { layer: "shared", canonicalPath };
  }
  if (topLevel === "data") {
    return { layer: "data", canonicalPath };
  }
  if (topLevel === "types") {
    return { layer: "types", canonicalPath };
  }
  if (topLevel === "assets") {
    return { layer: "assets", canonicalPath };
  }
  if (LEGACY_CONTAINERS.has(topLevel)) {
    return { layer: "legacy", canonicalPath };
  }
  return { layer: "unowned", canonicalPath };
};

const resolveInternalModule = (specifier, filename, sourceRoot) => {
  const cleanSpecifier = specifier.replace(/[?#].*$/, "");
  let absoluteTarget;

  if (cleanSpecifier === "@") {
    absoluteTarget = sourceRoot;
  } else if (cleanSpecifier.startsWith("@/")) {
    absoluteTarget = path.resolve(sourceRoot, cleanSpecifier.slice(2));
  } else if (cleanSpecifier.startsWith(".")) {
    absoluteTarget = path.resolve(path.dirname(filename), cleanSpecifier);
  } else {
    return null;
  }

  const relativeTarget = path.relative(sourceRoot, absoluteTarget);
  if (
    relativeTarget === "" ||
    relativeTarget === ".." ||
    relativeTarget.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeTarget)
  ) {
    return null;
  }
  return classifyModule(relativeTarget);
};

const isFeaturePublicEntry = (moduleInfo) =>
  moduleInfo.layer === "feature" &&
  (moduleInfo.featurePath === "public" ||
    moduleInfo.featurePath === "public/index");

const isTeamCodeLegacyException = (source, target) =>
  source.canonicalPath === "features/workspace/teamCodeImportAdapter" &&
  target.canonicalPath === "utils/teamCodeService";

const isRootDependencyAllowed = (source, target) => {
  if (target.layer === "root" || target.layer === "shells") return true;
  if (isFeaturePublicEntry(target)) return true;
  if (
    target.canonicalPath === ROOT_DOCUMENT_TYPES ||
    target.canonicalPath === ROOT_LOGICFLOW_TYPES
  ) {
    return true;
  }
  if (source.canonicalPath !== FLOW_RUNTIME_FACADE) return false;
  return (
    target.layer === "core-logicflow" ||
    target.canonicalPath === FLOW_NODE_REGISTRY
  );
};

const isRootFacadeDependencyAllowed = (source, target) =>
  source.layer === "shells" && target.canonicalPath === FLOW_RUNTIME_FACADE;

const isTypeOnlyDependency = (node) => {
  if (node.importKind === "type" || node.exportKind === "type") return true;
  if (node.type !== "ImportDeclaration" || node.specifiers.length === 0) {
    return false;
  }
  return node.specifiers.every(
    (specifier) =>
      specifier.type === "ImportSpecifier" && specifier.importKind === "type",
  );
};

const isLogicFlowRuntimeImport = (specifier) =>
  specifier.startsWith(LOGICFLOW_PACKAGE_PREFIX) && !specifier.endsWith(".css");

const isCoreDocumentFrameworkImport = (specifier) =>
  CORE_DOCUMENT_FORBIDDEN_PACKAGES.some(
    (packageName) =>
      specifier === packageName || specifier.startsWith(`${packageName}/`),
  );

const getLiteralSpecifier = (node) => {
  if (!node) return null;
  if (typeof node.value === "string") return node.value;
  return null;
};

const getDependencySource = (node) => {
  if (
    node.type === "ImportDeclaration" ||
    node.type === "ExportNamedDeclaration" ||
    node.type === "ExportAllDeclaration"
  ) {
    return node.source;
  }
  if (node.type === "ImportExpression") return node.source;
  if (node.type === "CallExpression") {
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === "require" &&
      node.arguments.length === 1
    ) {
      return node.arguments[0];
    }
    if (node.callee.type === "Import" && node.arguments.length === 1) {
      return node.arguments[0];
    }
  }
  if (
    node.type === "TSImportEqualsDeclaration" &&
    node.moduleReference?.type === "TSExternalModuleReference"
  ) {
    return node.moduleReference.expression;
  }
  return null;
};

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "enforce feature-module directory dependency boundaries",
      recommended: false,
    },
    schema: [],
    messages: {
      forbiddenLayer:
        "{{sourceLayer}} modules must not depend on {{targetLayer}} module '{{targetPath}}'.",
      featurePublic:
        "Imports from feature '{{featureName}}' must go through '@/features/{{featureName}}/public'.",
      legacyContainer:
        "Legacy container '{{targetPath}}' is not an internal dependency boundary.",
      logicflowInLayer:
        "{{sourceLayer}} modules must use the core LogicFlow adapter instead of importing '{{packageName}}'.",
      runtimeDataDependency:
        "Data modules must not have runtime dependency '{{dependency}}'.",
      sharedValueInDocument:
        "core/document may only use type-only imports from shared modules.",
      documentFrameworkDependency:
        "core/document must not depend on framework package '{{dependency}}'.",
      storeDependency:
        "Serializable stores must not depend on '{{dependency}}'.",
    },
  },
  create(context) {
    const filename = context.getPhysicalFilename?.() || context.getFilename();
    const sourceRoot = path.resolve(context.getCwd(), "src");
    const relativeSource = path.relative(sourceRoot, filename);

    if (
      relativeSource === "" ||
      relativeSource === ".." ||
      relativeSource.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativeSource)
    ) {
      return {};
    }

    const source = classifyModule(relativeSource);
    const isSerializableStore = /(?:^|\/)[^/]*store$/i.test(
      source.canonicalPath,
    );

    const checkDependency = (node) => {
      const dependencyNode = getDependencySource(node);
      const specifier = getLiteralSpecifier(dependencyNode);
      if (!specifier) return;

      const target = resolveInternalModule(specifier, filename, sourceRoot);
      if (!target) {
        if (
          source.layer === "core-document" &&
          isCoreDocumentFrameworkImport(specifier)
        ) {
          context.report({
            node: dependencyNode,
            messageId: "documentFrameworkDependency",
            data: { dependency: specifier },
          });
        }
        if (
          (source.layer === "shells" || source.layer === "feature") &&
          isLogicFlowRuntimeImport(specifier)
        ) {
          context.report({
            node: dependencyNode,
            messageId: "logicflowInLayer",
            data: { sourceLayer: source.layer, packageName: specifier },
          });
        }
        if (source.layer === "data" && !isTypeOnlyDependency(node)) {
          context.report({
            node: dependencyNode,
            messageId: "runtimeDataDependency",
            data: { dependency: specifier },
          });
        }
        if (
          isSerializableStore &&
          (specifier.startsWith(LOGICFLOW_PACKAGE_PREFIX) ||
            specifier === "element-plus" ||
            specifier.startsWith("element-plus/"))
        ) {
          context.report({
            node: dependencyNode,
            messageId: "storeDependency",
            data: { dependency: specifier },
          });
        }
        return;
      }

      if (target.layer === "legacy") {
        if (!isTeamCodeLegacyException(source, target)) {
          context.report({
            node: dependencyNode,
            messageId: "legacyContainer",
            data: { targetPath: target.canonicalPath },
          });
        }
        return;
      }

      if (
        target.layer === "feature" &&
        source.featureName !== target.featureName &&
        !isFeaturePublicEntry(target)
      ) {
        context.report({
          node: dependencyNode,
          messageId: "featurePublic",
          data: { featureName: target.featureName },
        });
        return;
      }

      if (
        source.layer === "core-document" &&
        target.layer === "shared" &&
        !isTypeOnlyDependency(node)
      ) {
        context.report({
          node: dependencyNode,
          messageId: "sharedValueInDocument",
        });
        return;
      }

      if (
        isSerializableStore &&
        (target.layer === "editor" || target.canonicalPath.includes("/ui/"))
      ) {
        context.report({
          node: dependencyNode,
          messageId: "storeDependency",
          data: { dependency: target.canonicalPath },
        });
        return;
      }

      let allowed;
      if (source.layer === "root") {
        allowed = isRootDependencyAllowed(source, target);
      } else if (target.layer === "root") {
        allowed = isRootFacadeDependencyAllowed(source, target);
      } else {
        allowed = ALLOWED_INTERNAL_LAYERS[source.layer]?.includes(target.layer);
      }

      if (!allowed) {
        context.report({
          node: dependencyNode,
          messageId: "forbiddenLayer",
          data: {
            sourceLayer: source.layer,
            targetLayer: target.layer,
            targetPath: target.canonicalPath,
          },
        });
      }
    };

    return {
      ImportDeclaration: checkDependency,
      ExportNamedDeclaration: checkDependency,
      ExportAllDeclaration: checkDependency,
      ImportExpression: checkDependency,
      CallExpression: checkDependency,
      TSImportEqualsDeclaration: checkDependency,
    };
  },
};
