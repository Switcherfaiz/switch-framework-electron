'use strict';

const path = require('node:path');
const { fork } = require('node:child_process');
const {
  SERVER_CHILD_FLAG,
  APP_ROOT_ENV,
  USER_DATA_ENV,
  IS_PACKAGED_ENV,
} = require('./constants.js');
const { registerServerIpc, expectServers } = require('./ipc.js');
const { configurePackagedPaths, getAppRoot } = require('./paths.js');

const processes = new Map();

function getChildScriptPath() {
  return path.join(__dirname, '..', 'child.js');
}

function stopServerProcess(name) {
  if (name) {
    const child = processes.get(name);
    if (child && !child.killed) child.kill();
    processes.delete(name);
    return;
  }
  for (const [key, child] of processes) {
    if (child && !child.killed) child.kill();
    processes.delete(key);
  }
}

function startServerProcess(spec = {}, session = {}, options = {}) {
  const name = spec.name || 'app';
  if (processes.has(name)) return processes.get(name);

  const { app } = require('electron');
  configurePackagedPaths();

  const childPath = getChildScriptPath();
  const forkCwd = app.isPackaged ? process.resourcesPath : (options.cwd || process.cwd());
  const appRoot = getAppRoot(options.appRoot);
  const userDataPath = app.getPath('userData');

  const child = fork(childPath, [], {
    cwd: forkCwd,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      [SERVER_CHILD_FLAG]: '1',
      [APP_ROOT_ENV]: appRoot,
      [USER_DATA_ENV]: userDataPath,
      [IS_PACKAGED_ENV]: app.isPackaged ? '1' : '0',
      SWITCH_SERVER_NAME: name,
      SWITCH_SERVER_ENTRY: spec.entry || 'server.js',
      PORT: '0',
      SWITCH_BIND_HOST: '127.0.0.1',
      SWITCH_LOCAL_AUTH_TOKEN: session.token || '',
      ...(spec.env || {}),
    },
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  });

  registerServerIpc(child);

  child.on('error', (err) => {
    console.error(`[switch-framework-electron:${name}] Process error:`, err);
  });

  child.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`[switch-framework-electron:${name}] Process exited:`, { code, signal });
    }
    processes.delete(name);
  });

  processes.set(name, child);
  return child;
}

function startServers(serverList = [], session = {}, options = {}) {
  const list = Array.isArray(serverList) ? serverList : [serverList];
  expectServers(list.map((item) => item.name || 'app'));
  return list.map((item) => startServerProcess(item, session, options));
}

module.exports = {
  startServerProcess,
  startServers,
  stopServerProcess,
  getChildScriptPath,
};
