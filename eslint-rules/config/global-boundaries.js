"use strict";

const BROWSER_STATE_GLOBALS = Object.freeze([
  "document",
  "window",
  "localStorage",
  "sessionStorage",
  "navigator",
]);

const createRestrictedGlobalsRule = (scopeName) => [
  "error",
  ...BROWSER_STATE_GLOBALS.map((name) => ({
    name,
    message: `${scopeName} must access ${name} through an injected adapter.`,
  })),
];

const createCoreDocumentRestrictedGlobalsRule = () =>
  createRestrictedGlobalsRule("core/document");

const createStoreRestrictedGlobalsRule = () =>
  createRestrictedGlobalsRule("Serializable stores");

module.exports = {
  BROWSER_STATE_GLOBALS,
  createCoreDocumentRestrictedGlobalsRule,
  createStoreRestrictedGlobalsRule,
};
