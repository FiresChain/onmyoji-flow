const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const USE_STORE_PATH = path.resolve(__dirname, "../src/ts/useStore.ts");
const ALLOWED_WRITE_FUNCTIONS = new Set([
  "setActiveFileForBootstrap",
  "switchActiveFile",
]);
const RUNTIME_ENTRY_FUNCTIONS = new Set([
  "setActiveFile",
  "addTab",
  "removeTab",
  "setVisible",
  "deleteFile",
]);

function getEnclosingFunctionName(node) {
  let current = node;
  while (current) {
    if (ts.isFunctionDeclaration(current) && current.name) {
      return current.name.text;
    }
    if (
      ts.isMethodDeclaration(current) &&
      current.name &&
      ts.isIdentifier(current.name)
    ) {
      return current.name.text;
    }
    if (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) {
      const parent = current.parent;
      if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
        return parent.name.text;
      }
      if (ts.isPropertyAssignment(parent)) {
        const name = parent.name;
        if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
          return name.text;
        }
      }
    }
    current = current.parent;
  }
  return null;
}

function isActiveFileIdValueAssignment(node) {
  return (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    ts.isPropertyAccessExpression(node.left) &&
    node.left.name.text === "value" &&
    ts.isIdentifier(node.left.expression) &&
    node.left.expression.text === "activeFileId"
  );
}

function main() {
  const sourceText = fs.readFileSync(USE_STORE_PATH, "utf8");
  const sourceFile = ts.createSourceFile(
    USE_STORE_PATH,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const writeAssignments = [];
  const writeFunctions = new Set();
  const violations = [];

  const visit = (node) => {
    if (isActiveFileIdValueAssignment(node)) {
      const functionName = getEnclosingFunctionName(node) || "<unknown>";
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart())
        .line + 1;

      writeAssignments.push({ functionName, line });
      writeFunctions.add(functionName);

      if (!ALLOWED_WRITE_FUNCTIONS.has(functionName)) {
        violations.push({ functionName, line });
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  for (const functionName of RUNTIME_ENTRY_FUNCTIONS) {
    if (writeFunctions.has(functionName)) {
      violations.push({ functionName, line: null });
    }
  }

  if (violations.length > 0) {
    const details = violations
      .map(({ functionName, line }) =>
        line
          ? `- ${functionName} writes activeFileId at line ${line}`
          : `- ${functionName} must not write activeFileId directly`
      )
      .join("\n");

    console.error(
      "[activeFileId-boundary] Static check failed.\n" +
        "Only switchActiveFile and setActiveFileForBootstrap may write activeFileId.\n" +
        details
    );
    process.exit(1);
  }

  const writeSummary = writeAssignments
    .map(({ functionName, line }) => `${functionName}@${line}`)
    .join(", ");

  console.log(
    `[activeFileId-boundary] OK: writes are restricted to whitelist (${writeSummary}).`
  );
}

main();
