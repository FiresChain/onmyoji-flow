"use strict";

const {
  createStateWriteBoundaryRule,
} = require("./create-state-write-boundary-rule");

module.exports = createStateWriteBoundaryRule({
  stateIdentifier: "fileList",
  statePropertyName: "value",
  allowedWriteFunctions: ["importData", "initializeWithPrompt", "resetWorkspace"],
  runtimeEntryFunctions: [
    "setActiveFile",
    "addTab",
    "removeTab",
    "setVisible",
    "deleteFile",
    "renameFile",
  ],
  docsDescription:
    "enforce fileList runtime write boundary in useStore: only whitelist entry points may assign fileList.value",
  messages: {
    runtimeEntry:
      "fileList.value must not be written directly in runtime entry '{{functionName}}'. Use whitelist bootstrap entries instead.",
    nonWhitelist:
      "fileList.value may only be written in whitelist entries (importData, initializeWithPrompt, resetWorkspace). Found in '{{functionName}}'.",
  },
});
