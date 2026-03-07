"use strict";

function isGlobalAddEventListenerCall(node) {
  if (node.type !== "CallExpression") return false;
  const callee = node.callee;
  if (!callee || callee.type !== "MemberExpression" || callee.computed) {
    return false;
  }
  if (callee.property.type !== "Identifier") return false;
  if (callee.property.name !== "addEventListener") return false;
  if (callee.object.type !== "Identifier") return false;
  return callee.object.name === "window" || callee.object.name === "document";
}

function isTopLevelStatement(node) {
  let current = node.parent;

  while (current) {
    if (current.type === "Program") return true;

    if (
      current.type === "FunctionDeclaration" ||
      current.type === "FunctionExpression" ||
      current.type === "ArrowFunctionExpression"
    ) {
      return false;
    }

    current = current.parent;
  }

  return false;
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow top-level global addEventListener side effects; bind/unbind listeners in lifecycle-managed functions",
      recommended: false,
    },
    schema: [],
    messages: {
      topLevelGlobalListener:
        "Avoid top-level '{{objectName}}.addEventListener(...)'. Register and cleanup listeners in lifecycle-managed functions.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isGlobalAddEventListenerCall(node)) return;
        if (!isTopLevelStatement(node)) return;

        const calleeObject = node.callee.object;
        const objectName =
          calleeObject.type === "Identifier" ? calleeObject.name : "global";

        context.report({
          node,
          messageId: "topLevelGlobalListener",
          data: { objectName },
        });
      },
    };
  },
};
