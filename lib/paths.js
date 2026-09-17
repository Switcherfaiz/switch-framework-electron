'use strict';

const path = require('node:path');
const fs = require('node:fs');

function getAppRoot(appRootOverride) {
  if (appRootOverride) return appRootOverride;
  const { app } = require('electron');
  return app.isPackaged ? app.getAppPath() : process.cwd();
}

function configurePackagedPaths() {
  const { app } = require('electron');
  if (!app.isPackaged) return;

  const esbuildBinary = path.join(
    process.resourcesPath,
    'app.asar.unpacked',
    'node_modules',
    '@esbuild',
    `${process.platform}-${process.arch}`,
    process.platform === 'win32' ? 'esbuild.exe' : 'bin/esbuild',
  );

  if (fs.existsSync(esbuildBinary)) {
    process.env.ESBUILD_BINARY_PATH = esbuildBinary;
  }
}

module.exports = { getAppRoot, configurePackagedPaths };
