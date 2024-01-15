#!/usr/bin/env node
'use strict';

var child_process = require('child_process');
var path = require('path');
var fs = require('fs');

const jestPath = require.resolve("jest/bin/jest");
const CACHE_DIRECTORY = path.resolve(
  // Post install: process.env.INIT_CWD
  // CLI: process.cwd()
  process.env.INIT_CWD || process.cwd(),
  "./node_modules/.cache/jest-preview"
);
function clearJestCache() {
  if (process.env.INIT_CWD === process.env.PWD) {
    console.log("Inside Jest Preview. Do not clear Cache.");
  } else {
    console.log("Clearing Jest cache...");
    child_process.execSync(`node ${jestPath} --clearCache`, { stdio: "inherit" });
    console.log("Cleared Jest cache...");
  }
}
function clearJestPreviewCache() {
  if (fs.existsSync(CACHE_DIRECTORY)) {
    fs.rmSync(CACHE_DIRECTORY, { recursive: true });
    console.log("Cleared Jest Preview cache...");
  }
}
try {
  clearJestCache();
} catch (error) {
  console.log(error);
}
try {
  clearJestPreviewCache();
} catch (error) {
  console.log(error);
}
