"use strict";

const {
  createStateWriteBoundaryRule,
} = require("./create-state-write-boundary-rule");
const {
  createStateWriteBoundaryOptions,
} = require("./state-write-boundaries.config");

module.exports = createStateWriteBoundaryRule(
  createStateWriteBoundaryOptions("fileList")
);
