'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var child_process = require('child_process');
var url = require('url');
require('camelcase');
var slash = require('slash');
require('@svgr/core');

const CACHE_FOLDER = "./node_modules/.cache/jest-preview";
const SASS_LOAD_PATHS_CONFIG = "cache-sass-load-paths.config";

function createCacheFolderIfNeeded() {
  if (!fs.existsSync(CACHE_FOLDER)) {
    fs.mkdirSync(CACHE_FOLDER, {
      recursive: true
    });
  }
}

const cssLangs = `\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)`;
const cssModuleRE = new RegExp(`\\.module${cssLangs}`);
function isSass(filename) {
  return /.(sass|scss)$/.test(filename);
}
function isLess(filename) {
  return /.(less)$/.test(filename);
}
function isPreProcessor(filename) {
  return isSass(filename) || isLess(filename);
}
function havePostCss() {
  const checkHavePostCssFileContent = `const postcssrc = require('postcss-load-config');
  
  postcssrc().then(({ plugins, options }) => {
    console.log(true)
  })
  .catch(error=>{
    if (!/No PostCSS Config found/.test(error.message)) {
      throw new Error("Failed to load PostCSS config", error)
    }
    console.log(false)
  });`;
  const tempFileName = createTempFile(checkHavePostCssFileContent);
  const result = child_process.spawnSync("node", [tempFileName]);
  fs.unlink(tempFileName, (error) => {
    if (error)
      throw error;
  });
  const stderr = result.stderr.toString("utf-8").trim();
  if (stderr)
    console.error(stderr);
  if (result.error)
    throw result.error;
  return result.stdout.toString().trim() === "true";
}
function getRelativeFilename(filename) {
  return slash(filename.split(process.cwd())[1]);
}
function processCss(src, filename) {
  const relativeFilename = getRelativeFilename(filename);
  console.time(`Processing ${relativeFilename}`);
  let cssSrc = src;
  const isModule = cssModuleRE.test(filename);
  const isPreProcessorFile = isPreProcessor(filename);
  const haveTailwindCss = fs.existsSync(path.join(process.cwd(), "tailwind.config.js")) || fs.existsSync(path.join(process.cwd(), "tailwind.config.cjs"));
  const usePostCssExplicitly = havePostCss();
  if (!isModule && !isPreProcessorFile && !usePostCssExplicitly && !haveTailwindCss) {
    console.timeEnd(`Processing ${relativeFilename}`);
    return {
      code: `const relativeCssPath = "${relativeFilename}";
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = relativeCssPath;
  document.head.appendChild(link);
  
  module.exports = JSON.stringify(relativeCssPath);`
    };
  }
  if (isSass(filename)) {
    cssSrc = processSass(filename);
  }
  if (isLess(filename)) {
    cssSrc = processLess(filename);
  }
  if (usePostCssExplicitly || haveTailwindCss || isModule) {
    console.timeEnd(`Processing ${relativeFilename}`);
    return processPostCss(cssSrc, filename, {
      useConfigFile: usePostCssExplicitly,
      isModule,
      haveTailwindCss
    });
  }
  console.timeEnd(`Processing ${relativeFilename}`);
  return {
    code: `const style = document.createElement('style');
  style.appendChild(document.createTextNode(${JSON.stringify(cssSrc)}));
  document.head.appendChild(style);
  module.exports = {}`
  };
}
function parsePostCssExternalOutput(output) {
  const lines = output.trim().split("---");
  const result = {
    cssModulesExportedTokens: "",
    css: ""
  };
  for (const line of lines) {
    const [key, value] = line.trim().split("|||");
    if (key === "cssModulesExportedTokens") {
      result.cssModulesExportedTokens = value;
    }
    if (key === "css") {
      result.css = value;
    }
  }
  return result;
}
function createTempFile(content) {
  createCacheFolderIfNeeded();
  const tempFileName = path.join(
    CACHE_FOLDER,
    crypto.randomBytes(16).toString("hex")
  );
  fs.writeFileSync(tempFileName, content);
  return tempFileName;
}
function processPostCss(src, filename, options = { useConfigFile: true, isModule: false, haveTailwindCss: false }) {
  var _a;
  const cssModulesPluginsContent = `require('postcss-modules')({
    getJSON: (cssFileName, json, outputFileName) => {
      console.log('cssModulesExportedTokens|||', JSON.stringify(json));
      console.log('---')
    },
    // Use custom scoped name to prevent different hash between operating systems
    // Because new line characters can be different between operating systems. Reference: https://stackoverflow.com/a/10805198
    // Original hash function: https://github.com/madyankin/postcss-modules/blob/7d5965d4df201ef301421a5e35805d1b47f3c914/src/generateScopedName.js#L6
    generateScopedName: function (name, filename, css) {
      const stringHash = require('string-hash');
      const i = css.indexOf('.' + name);
      const line = css.substr(0, i).split(/[\\r\\n|\\n|\\r]/).length;
      // This is not how the real app work, might be an issue if we try to make the snapshot interactive
      // https://github.com/nvh95/jest-preview/issues/84#issuecomment-1146578932
      const removedNewLineCharactersCss = css.replace(/(\\r\\n|\\n|\\r)/g, '');
      const hash = stringHash(removedNewLineCharactersCss).toString(36).substr(0, 5);
      return '_' + name + '_' + hash + '_' + line;
    },
  })`;
  let processPostCssFileContent = `const postcss = require('postcss');
  const postcssrc = require('postcss-load-config');
  const isModule = ${options.isModule}
  const cssSrc = ${JSON.stringify(src)};
  
  // TODO: We have to re-execute "postcssrc()" every CSS file.
  // Can we do better? Singleton?
  postcssrc().then(({ plugins, options }) => {
    plugins.unshift(require('postcss-import')())
    if (isModule) {
      plugins.push(
        ${cssModulesPluginsContent},
      )
    }
    postcss(plugins)
      .process(cssSrc, { ...options, from: ${JSON.stringify(filename)} })
      .then((result) => {
        console.log('css|||', result.css);
        console.log('---')
      });
  });`;
  if (!options.useConfigFile) {
    processPostCssFileContent = `const postcss = require('postcss');
const isModule = ${options.isModule};
const haveTailwindCss = ${options.haveTailwindCss};
const cssSrc = ${JSON.stringify(src)};

let plugins = [];
if (isModule) {
  plugins.unshift(require('postcss-import')())
  plugins.push(
    ${cssModulesPluginsContent},
  )
}
if (haveTailwindCss) {
  // tailwindCss auto resolve config
  // https://github.com/tailwindlabs/tailwindcss/blob/cef02e2dc395ed5b5d31b72183cf7504b3bd76c1/src/util/resolveConfigPath.js#L45-L52
  plugins.push(require("tailwindcss")())
}
postcss(plugins)
.process(cssSrc, { from: ${JSON.stringify(filename)} })
.then((result) => {
  console.log('css|||', result.css);
  console.log('---')
});`;
  }
  const tempFileName = createTempFile(processPostCssFileContent);
  const result = child_process.spawnSync("node", [tempFileName]);
  fs.unlink(tempFileName, (error) => {
    if (error)
      throw error;
  });
  const stderr = (_a = result.stderr) == null ? void 0 : _a.toString("utf-8").trim();
  if (stderr)
    console.error(stderr);
  if (result.error)
    throw result.error;
  const output = parsePostCssExternalOutput(result.stdout.toString());
  return {
    code: `const style = document.createElement("style");
style.type = "text/css";
const styleContent = ${JSON.stringify(output.css)};
style.appendChild(document.createTextNode(styleContent.replace(/\\\\/g, '')));
document.head.appendChild(style);
module.exports = ${output.cssModulesExportedTokens || "{}"}`
  };
}
function processSass(filename) {
  let sass;
  try {
    sass = require("sass");
  } catch (err) {
    console.log(err);
    throw new Error("Sass not found. Please install sass and try again.");
  }
  const sassLoadPathsConfigPath = path.join(
    CACHE_FOLDER,
    SASS_LOAD_PATHS_CONFIG
  );
  let sassLoadPathsConfig;
  if (fs.existsSync(sassLoadPathsConfigPath)) {
    const sassLoadPathsString = fs.readFileSync(path.join(CACHE_FOLDER, SASS_LOAD_PATHS_CONFIG), "utf8").trim();
    sassLoadPathsConfig = JSON.parse(sassLoadPathsString);
  } else {
    sassLoadPathsConfig = [];
  }
  let cssResult;
  const tildeImporter = (url$1) => {
    if (!url$1.startsWith("~"))
      return null;
    return new URL(
      // TODO: Search in node_modules by require.resolve (monorepo)
      // E.g: input: ~animate-sass/animate
      // output: file:/Users/yourname/oss/jest-preview/node_modules/animate-sass/animate
      // => require.resolve('animate-sass') + animate
      path.join(url.pathToFileURL("node_modules").href, url$1.substring(1))
    );
  };
  if (sass.compile) {
    cssResult = sass.compile(filename, {
      loadPaths: sassLoadPathsConfig,
      importers: [
        {
          findFileUrl(url) {
            return tildeImporter(url);
          }
        }
      ]
    }).css;
  } else if (sass.renderSync) {
    cssResult = sass.renderSync({
      file: filename,
      includePaths: sassLoadPathsConfig,
      importer: [
        function(url) {
          return tildeImporter(url);
        }
      ]
    }).css.toString();
  } else {
    throw new Error(
      "Cannot compile sass to css: No compile method is available."
    );
  }
  return cssResult;
}
function processLess(filename) {
  console.log("processLess", filename);
  try {
    require("less");
  } catch (err) {
    console.log(err);
    throw new Error("Less not found. Please install less and try again.");
  }
  const processLessFileContent = `const less = require('less');
  const fs = require('fs');
  const path = require('path');
  const cssContent = fs.readFileSync(${JSON.stringify(filename)}, 'utf8');
  less.render(cssContent, { filename: ${JSON.stringify(
    filename
  )}}).then((output) => {
    console.log(output.css);
  });`;
  const tempFileName = createTempFile(processLessFileContent);
  const result = child_process.spawnSync("node", [tempFileName]);
  fs.unlink(tempFileName, (error) => {
    if (error)
      throw error;
  });
  const stderr = result.stderr.toString("utf-8").trim();
  if (stderr)
    console.error(stderr);
  if (result.error)
    throw result.error;
  return result.stdout.toString();
}

function process$1(src, filename) {
  return processCss(src, filename);
}
var css = { process: process$1 };

module.exports = css;
