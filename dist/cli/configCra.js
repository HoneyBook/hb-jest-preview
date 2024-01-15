#!/usr/bin/env node
'use strict';

var path = require('path');
var fs = require('fs');
var findNodeModules = require('find-node-modules');

const cwdNodeModules = findNodeModules({ relative: false });
module.paths.push(...cwdNodeModules);
try {
  const createJestConfig = require("react-scripts/scripts/utils/createJestConfig.js");
  const jestConfig = createJestConfig(
    (filePath) => path.posix.join("<rootDir>", filePath),
    null,
    true
  );
  jestConfig.transform = {
    "^.+\\.(js|jsx|mjs|cjs|ts|tsx)$": "react-scripts/config/jest/babelTransform.js",
    "^.+\\.(css|scss|sass|less)$": "jest-preview/transforms/css",
    "^(?!.*\\.(js|jsx|mjs|cjs|ts|tsx|css|json)$)": "jest-preview/transforms/file"
  };
  jestConfig.transformIgnorePatterns = jestConfig.transformIgnorePatterns.filter(
    (pattern) => pattern !== "^.+\\.module\\.(css|sass|scss)$"
  );
  delete jestConfig.moduleNameMapper["^.+\\.module\\.(css|sass|scss)$"];
  const jestConfigFileContent = `module.exports = ${JSON.stringify(
    jestConfig,
    null,
    2
  )}
`;
  fs.writeFileSync("jest.config.js", jestConfigFileContent);
  console.log(`Added jest.config.js to the project.`);
  const execSync = require("child_process").execSync;
  try {
    execSync("prettier jest.config.js --write");
  } catch (error) {
  }
} catch (error) {
  console.error(error);
}
try {
  const testFile = require.resolve("react-scripts/scripts/test.js");
  let content = fs.readFileSync(testFile, "utf8");
  content = content.replace(
    /\/\/ @remove-on-eject-begin([\s\S]*?)\/\/ @remove-on-eject-end/gm,
    ""
  ).replace(
    `require('../config/env');`,
    `require('react-scripts/config/env');`
  ).trim() + "\n";
  console.log(`Added scripts/test.js to the project.`);
  if (!fs.existsSync("scripts")) {
    fs.mkdirSync("scripts");
  }
  fs.writeFileSync(path.resolve(process.cwd(), "scripts/test.js"), content);
  const packageJson = require(path.resolve(process.cwd(), "package.json"));
  packageJson.scripts.test = "node scripts/test.js";
  if (!packageJson.scripts["jest-preview"]) {
    packageJson.scripts["jest-preview"] = "jest-preview";
  }
  fs.writeFileSync(
    path.resolve(process.cwd(), "package.json"),
    JSON.stringify(packageJson, null, 2) + "\n"
  );
  console.log(`Update test script in package.json.`);
} catch (error) {
  console.error(error);
}
function injectToFileIfExisted(filePath, content) {
  if (fs.existsSync(filePath)) {
    fs.appendFileSync(filePath, content);
  }
}
try {
  const configToInject = `import { jestPreviewConfigure } from 'jest-preview'
// TODO: To add your global css here
import './index.css';

jestPreviewConfigure({
  // Opt-in to automatic mode to preview failed test case automatically.
  autoPreview: true,
})
`;
  injectToFileIfExisted(
    path.resolve(process.cwd(), "src/setupTests.ts"),
    configToInject
  );
  injectToFileIfExisted(
    path.resolve(process.cwd(), "src/setupTests.js"),
    configToInject
  );
  console.log(`Configured Jest Preview in src/setupTests.(ts|js).`);
} catch (error) {
  console.error(error);
}
console.log(
  "\nTo continue, run `npm run jest-preview` to open Jest Preview server, then `npm run test` to run Jest. It will preview any failed test in your browser."
);
