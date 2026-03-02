"use strict";

const ALLOWED_WRITE_FUNCTIONS = new Set([
  "switchActiveFile",
  "setActiveFileForBootstrap",
]);
const RUNTIME_ENTRY_FUNCTIONS = new Set([
  "setActiveFile",
  "addTab",
  "removeTab",
  "setVisible",
  "deleteFile",
]);

function getFunctionNameFromPropertyKey(key) {
  if (!key) return null;
  if (key.type === "Identifier") return key.name;
  if (key.type === "Literal" && typeof key.value === "string") return key.value;
  return null;
}

function getEnclosingFunctionName(node) {
  let current = node;

  while (current) {
    if (current.type === "FunctionDeclaration" && current.id) {
      return current.id.name;
    }

    if (
      (current.type === "ArrowFunctionExpression" ||
        current.type === "FunctionExpression") &&
      current.parent
    ) {
      const parent = current.parent;

      if (parent.type === "VariableDeclarator" && parent.id.type === "Identifier") {
        return parent.id.name;
      }

      if (parent.type === "Property") {
        const propertyName = getFunctionNameFromPropertyKey(parent.key);
        if (propertyName) return propertyName;
      }
    }

    current = current.parent;
  }

  return null;
}

function isActiveFileIdValueAssignment(node) {
  if (
    node.type !== "AssignmentExpression" ||
    node.operator !== "=" ||
    node.left.type !== "MemberExpression"
  ) {
    return false;
  }

  if (node.left.computed) return false;

  const object = node.left.object;
  const property = node.left.property;

  return (
    object.type === "Identifier" &&
    object.name === "activeFileId" &&
    property.type === "Identifier" &&
    property.name === "value"
  );
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "enforce activeFileId runtime write boundary in useStore: only whitelist entry points may assign activeFileId.value",
      recommended: false,
    },
    schema: [],
    messages: {
      runtimeEntry:
        "activeFileId.value must not be written directly in runtime entry '{{functionName}}'. Use switchActiveFile instead.",
      nonWhitelist:
        "activeFileId.value may only be written in whitelist entries (switchActiveFile, setActiveFileForBootstrap). Found in '{{functionName}}'.",
    },
  },
  create(context) {
    return {
      AssignmentExpression(node) {
        if (!isActiveFileIdValueAssignment(node)) return;

        const functionName = getEnclosingFunctionName(node) || "<unknown>";

        if (RUNTIME_ENTRY_FUNCTIONS.has(functionName)) {
          context.report({
            node,
            messageId: "runtimeEntry",
            data: { functionName },
          });
          return;
        }

        if (!ALLOWED_WRITE_FUNCTIONS.has(functionName)) {
          context.report({
            node,
            messageId: "nonWhitelist",
            data: { functionName },
          });
        }
      },
    };
  },
};
