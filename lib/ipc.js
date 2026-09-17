'use strict';

const { ipcMain } = require('electron');
const { SERVER_READY_MESSAGE } = require('./messages.js');

const serverPorts = {};
const pendingServers = new Set();
const readyListeners = [];
let allReady = false;

function expectServers(names = []) {
  pendingServers.clear();
  names.forEach((name) => pendingServers.add(name));
  allReady = pendingServers.size === 0;
}

function notifyAllReady() {
  allReady = true;
  readyListeners.splice(0).forEach((listener) => listener({ ...serverPorts }));
}

function onServerInfo(info) {
  if (!info || info.type !== SERVER_READY_MESSAGE) return;
  if (info.name) {
    serverPorts[info.name] = { port: info.port, host: info.host };
    pendingServers.delete(info.name);
  }
  if (pendingServers.size === 0) notifyAllReady();
}

function onServerReady(listener) {
  if (allReady) {
    listener({ ...serverPorts });
    return;
  }
  readyListeners.push(listener);
}

function whenServerReady() {
  return new Promise((resolve) => onServerReady(resolve));
}

function resetServerReady() {
  allReady = false;
  Object.keys(serverPorts).forEach((key) => delete serverPorts[key]);
}

function registerServerIpc(serverProcess) {
  serverProcess.on('message', onServerInfo);
}

function registerWindowIpc(mainWindow) {
  try { ipcMain.removeHandler('window:is-maximized'); } catch (_) {}
  ipcMain.removeAllListeners('window:minimize');
  ipcMain.removeAllListeners('window:maximize');
  ipcMain.removeAllListeners('window:close');

  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window:maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });

  ipcMain.on('window:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('window:is-maximized', () => {
    return mainWindow?.isMaximized?.() ?? false;
  });
}

function getServerPorts() {
  return { ...serverPorts };
}

module.exports = {
  SERVER_READY_MESSAGE,
  expectServers,
  registerServerIpc,
  registerWindowIpc,
  onServerReady,
  whenServerReady,
  resetServerReady,
  getServerPorts,
};
