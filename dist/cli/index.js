#!/usr/bin/env node
'use strict';

var commander = require('commander');
var updateNotifier = require('update-notifier');
var chalk = require('chalk');

commander.program.command("config-cra").description("Integrate Jest Preview with CRA.").action(() => {
  Promise.resolve().then(function () { return require('./configCra.js'); });
});
commander.program.command("clear-cache").description("Clear Jest and Jest Preview cache.").action(() => {
  Promise.resolve().then(function () { return require('./clearCache.js'); });
});
commander.program.description("Start Jest Preview server.").action(() => {
  Promise.resolve().then(function () { return require('./previewServer.js'); });
});
commander.program.parse(process.argv);
const notifier = updateNotifier({
  // Built output is at /cli so the relative path is ../package.json
  pkg: require("../../package.json"),
  updateCheckInterval: 0,
  // How often to check for updates
  shouldNotifyInNpmScript: true,
  // Allows notification to be shown when running as an npm script
  distTag: "latest"
  // Can be use to notify user about pre-relase version
});
notifier.notify({
  defer: true,
  // Try not to annoy user by showing the notification after the process has exited
  message: [
    `${chalk.blue("{packageName}")} has an update available: ${chalk.gray(
      "{currentVersion}"
    )} \u2192 ${chalk.green("{latestVersion}")}`,
    `Please run ${chalk.cyan("`{updateCommand}`")} to update.`
  ].join("\n")
});
