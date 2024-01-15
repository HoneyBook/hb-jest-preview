'use strict';

require('fs');
var path = require('path');
require('crypto');
require('child_process');
require('url');
var camelcase = require('camelcase');
var slash = require('slash');
var core = require('@svgr/core');

function getRelativeFilename(filename) {
  return slash(filename.split(process.cwd())[1]);
}
function processFile(src, filename) {
  const relativeFilenameStringified = JSON.stringify(
    getRelativeFilename(filename)
  );
  if (filename.match(/\.svg$/)) {
    const pascalCaseFilename = camelcase(path.parse(filename).name, {
      pascalCase: true
    });
    const componentName = `Svg${pascalCaseFilename}`;
    try {
      const svgComponent = core.transform.sync(
        src,
        {
          // Do not insert `import * as React from "react";`
          jsxRuntime: "automatic"
        },
        { componentName }
      );
      const babel = require("@babel/core");
      const result = babel.transformSync(svgComponent, {
        plugins: ["@babel/plugin-transform-react-jsx"]
      });
      const componentCodeWithoutExport = result.code.split("\n").slice(0, -1).join("\n");
      return {
        // TODO: To render actual SVG to the snapshot
        code: `const React = require('react')
        ${componentCodeWithoutExport}
        module.exports = {
          __esModule: true,
          default: ${relativeFilenameStringified},
          ReactComponent: ${componentName}
        };`
      };
    } catch (error) {
      return {
        code: `const React = require('react');
      module.exports = {
        __esModule: true,
        default: ${relativeFilenameStringified},
        ReactComponent: React.forwardRef(function ${componentName}(props, ref) {
          return {
            $$typeof: Symbol.for('react.element'),
            type: 'span',
            ref: ref,
            key: null,
            props: Object.assign({}, props, {
              children: ${relativeFilenameStringified}
            })
          };
        }),
      };`
      };
    }
  }
  return {
    code: `module.exports = {
      __esModule: true,
      default: ${relativeFilenameStringified},
    };`
  };
}

function process$1(src, filename) {
  return processFile(src, filename);
}
var file = { process: process$1 };

module.exports = file;
