"use strict";

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

function isStateWriteAssignment(node, stateIdentifier, statePropertyName) {
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
    object.name === stateIdentifier &&
    property.type === "Identifier" &&
    property.name === statePropertyName
  );
}

function createStateWriteBoundaryRule(options) {
  const stateIdentifier = options.stateIdentifier;
  const statePropertyName = options.statePropertyName || "value";
  const allowedWriteFunctions = options.allowedWriteFunctions || [];
  const runtimeEntryFunctions = options.runtimeEntryFunctions || [];
  const docsDescription = options.docsDescription;
  const messages = options.messages || {};

  const allowedWriteFunctionSet = new Set(allowedWriteFunctions);
  const runtimeEntryFunctionSet = new Set(runtimeEntryFunctions);

  return {
    meta: {
      type: "problem",
      docs: {
        description: docsDescription,
        recommended: false,
      },
      schema: [],
      messages: {
        runtimeEntry: messages.runtimeEntry,
        nonWhitelist: messages.nonWhitelist,
      },
    },
    create(context) {
      return {
        AssignmentExpression(node) {
          if (!isStateWriteAssignment(node, stateIdentifier, statePropertyName)) return;

          const functionName = getEnclosingFunctionName(node) || "<unknown>";

          if (runtimeEntryFunctionSet.has(functionName)) {
            context.report({
              node,
              messageId: "runtimeEntry",
              data: { functionName },
            });
            return;
          }

          if (!allowedWriteFunctionSet.has(functionName)) {
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
}

module.exports = {
  createStateWriteBoundaryRule,
};
