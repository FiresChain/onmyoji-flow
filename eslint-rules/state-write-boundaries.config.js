"use strict";

const stateWriteBoundaries = {
  activeFileId: {
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
  },
  fileList: {
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
  },
};

function createStateWriteBoundaryOptions(stateIdentifier) {
  const stateBoundary = stateWriteBoundaries[stateIdentifier];

  if (!stateBoundary) {
    throw new Error(
      `Unknown state write boundary config for '${stateIdentifier}'.`
    );
  }

  return {
    stateIdentifier,
    statePropertyName: "value",
    allowedWriteFunctions: stateBoundary.allowedWriteFunctions,
    runtimeEntryFunctions: stateBoundary.runtimeEntryFunctions,
    docsDescription: stateBoundary.docsDescription,
    messages: stateBoundary.messages,
  };
}

module.exports = {
  createStateWriteBoundaryOptions,
};

