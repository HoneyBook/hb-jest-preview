#!/usr/bin/env node
'use strict';

var http = require('http');
var path = require('path');
var fs = require('fs');
var connect = require('connect');
var sirv = require('sirv');
var chokidar = require('chokidar');
var ws = require('ws');
var child_process = require('child_process');
var open = require('open');

const OSX_CHROME = "google chrome";
function openBrowser(url) {
  let browser = process.env.BROWSER;
  if (browser === "none") {
    return false;
  }
  const shouldTryOpenChromeWithAppleScript = process.platform === "darwin" && (typeof browser !== "string" || browser === OSX_CHROME);
  if (shouldTryOpenChromeWithAppleScript) {
    const supportedChromiumBrowsers = [
      "Google Chrome Canary",
      "Google Chrome Dev",
      "Google Chrome Beta",
      "Google Chrome",
      "Microsoft Edge",
      "Brave Browser",
      "Vivaldi",
      "Chromium"
    ];
    for (const chromiumBrowser of supportedChromiumBrowsers) {
      try {
        child_process.execSync(`ps cax | grep "${chromiumBrowser}"`);
        child_process.execSync(
          `osascript openChrome.applescript "${encodeURI(
            url
          )}" "${chromiumBrowser}"`,
          {
            cwd: __dirname,
            stdio: "ignore"
          }
        );
        return true;
      } catch (err) {
      }
    }
  }
  if (process.platform === "darwin" && browser === "open") {
    browser = void 0;
  }
  try {
    const options = { app: { name: browser } };
    open(url, options).catch(() => {
    });
    return true;
  } catch (err) {
    return false;
  }
}

const app = connect();
const port = process.env.PORT || 3336;
const wsPort = Number(port) + 1;
const CACHE_DIRECTORY = "./node_modules/.cache/jest-preview";
const INDEX_BASENAME = "index.html";
const INDEX_PATH = path.join(CACHE_DIRECTORY, INDEX_BASENAME);
const PUBLIC_CONFIG_BASENAME = "cache-public.config";
const PUBLIC_CONFIG_PATH = path.join(CACHE_DIRECTORY, PUBLIC_CONFIG_BASENAME);
const FAV_ICON_PATH = "./node_modules/jest-preview/dist/cli/favicon.ico";
let publicFolder = "public";
if (fs.existsSync(PUBLIC_CONFIG_PATH)) {
  publicFolder = fs.readFileSync(PUBLIC_CONFIG_PATH, "utf8").trim();
}
if (fs.existsSync(INDEX_PATH)) {
  const files = fs.readdirSync(CACHE_DIRECTORY);
  files.forEach((file) => {
    if (!file.startsWith("cache-")) {
      fs.unlinkSync(path.join(CACHE_DIRECTORY, file));
    }
  });
} else {
  fs.mkdirSync(CACHE_DIRECTORY, {
    recursive: true
  });
}
const defaultIndexHtml = `<!DOCTYPE html>
<html>
<head>
  <link rel="shortcut icon" href="${FAV_ICON_PATH}">
  <title>Jest Preview Dashboard</title>
</head>
<body>
No preview found.<br/>
Please add following lines to your test: <br /> <br />
<div style="background-color: grey;width: fit-content;padding: 8px;">
  <code>
  import { debug } from 'jest-preview';
  <br />
  <br />
  // Inside your tests
  <br />
  debug();
  </code>
</div>
<br />
Then rerun your tests.
<br />
See an example in the <a href="https://www.jest-preview.com/docs/getting-started/usage#3-preview-your-html-from-jest-following-code-demo-how-to-use-it-with-react-testing-library" target="_blank" rel="noopener noreferrer">documentation</a>
</body>
</html>`;
fs.writeFileSync(INDEX_PATH, defaultIndexHtml);
const wss = new ws.WebSocketServer({ port: wsPort });
wss.on("connection", function connection(ws) {
  ws.on("message", function message(data) {
    console.log("received: %s", data);
    try {
      const dataJSON = JSON.parse(data);
      if (dataJSON.type === "publicFolder") {
        publicFolder = dataJSON.payload;
      }
    } catch (error) {
      console.error(error);
    }
  });
});
const watcher = chokidar.watch([INDEX_PATH, PUBLIC_CONFIG_PATH], {
  // ignored: ['**/node_modules/**', '**/.git/**'],
  ignoreInitial: true,
  ignorePermissionErrors: true,
  disableGlobbing: true
});
function handleFileChange(filePath) {
  const basename = path.basename(filePath);
  if (basename === INDEX_BASENAME) {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: "reload" }));
      }
    });
  }
  if (basename === PUBLIC_CONFIG_BASENAME) {
    publicFolder = fs.readFileSync(PUBLIC_CONFIG_PATH, "utf8").trim();
  }
}
watcher.on("change", handleFileChange).on("add", handleFileChange).on("unlink", handleFileChange);
app.use((req, res, next) => {
  const serve = sirv(".", {
    dev: true,
    etag: true
  });
  if (req.url === "/") {
    return next();
  }
  const filePath = path.join(".", req.url);
  if (!fs.existsSync(filePath)) {
    const newPath = path.join(publicFolder, req.url);
    if (fs.existsSync(newPath)) {
      req.url = newPath;
    } else {
      console.log("[WARN] File not found: ", req.url);
      console.log(`[WARN] Please check if ${req.url} is existed.`);
      console.log(
        `[WARN] If it is existed, likely you forget to setup the code transformation, or you haven't flushed the old cache yet. Try to run "./node_modules/.bin/jest --clearCache" to clear the cache.
`
      );
    }
  }
  serve(req, res, next);
});
app.use("/", (req, res) => {
  const reloadScriptContent = fs.readFileSync(path.join(__dirname, "./ws-client.js"), "utf-8").replace(/\$PORT/g, `${wsPort}`);
  let indexHtml = fs.readFileSync(INDEX_PATH, "utf-8");
  indexHtml += `<script>${reloadScriptContent}<\/script>`;
  res.end(indexHtml);
});
const server = http.createServer(app);
server.listen(port, () => {
  console.log(`Jest Preview Server listening on port ${port}`);
  openBrowser(`http://localhost:${port}`);
});
