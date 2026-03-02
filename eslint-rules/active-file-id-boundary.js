"use strict";

const {
  createStateWriteBoundaryRule,
} = require("./create-state-write-boundary-rule");

module.exports = createStateWriteBoundaryRule({
  stateIdentifier: "activeFileId",
  statePropertyName: "value",
  allowedWriteFunctions: ["switchActiveFile", "setActiveFileForBootstrap"],
  runtimeEntryFunctions: [
    "setActiveFile",
    "addTab",
    "removeTab",
    "setVisible",
    "deleteFile",
  ],
  docsDescription:
    "enforce activeFileId runtime write boundary in useStore: only whitelist entry points may assign activeFileId.value",
  messages: {
    runtimeEntry:
      "activeFileId.value must not be written directly in runtime entry '{{functionName}}'. Use switchActiveFile instead.",
    nonWhitelist:
      "activeFileId.value may only be written in whitelist entries (switchActiveFile, setActiveFileForBootstrap). Found in '{{functionName}}'.",
  },
});
