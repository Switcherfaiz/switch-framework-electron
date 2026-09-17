'use strict';

const path = require('node:path');
const { app, BrowserWindow } = require('electron');
const { createLocalSession } = require('./session.js');
const { onServerReady, registerWindowIpc } = require('./ipc.js');
const { startServers, stopServerProcess } = require('./servers.js');

async function attachLocalAuthCookie(win, host, port, token) {
  if (!token || !win) return;
  const url = `http://${host}:${port}/`;
  try {
    await win.webContents.session.cookies.set({
      url,
      name: 'switch-local-auth',
      value: token,
      httpOnly: true,
      path: '/',
    });
  } catch (err) {
    console.error('[switch-framework-electron] Failed to set local auth cookie:', err);
  }
}

function createSplashWindow(splashHtmlPath, bounds = { width: 1200, height: 800 }) {
  const splash = new BrowserWindow({
    ...bounds,
    center: true,
    frame: false,
    backgroundColor: '#f5f5f5',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splash.loadFile(splashHtmlPath);
  splash.once('ready-to-show', () => splash.show());
  return splash;
}

function createMainWindow({
  bounds,
  host,
  port,
  token,
  preloadPath,
  backgroundColor = '#f5f5f5',
  frame = false,
}) {
  return new Promise((resolve) => {
    process.env.SWITCH_WINDOW_HOST = host;
    process.env.SWITCH_WINDOW_PORT = String(port);

    const mainWindow = new BrowserWindow({
      ...bounds,
      frame,
      backgroundColor,
      show: false,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    registerWindowIpc(mainWindow);

    mainWindow.on('closed', () => {
      mainWindow._swClosed = true;
    });

    const appUrl = `http://${host}:${port}/`;

    mainWindow.webContents.on('did-fail-load', (_event, _code, description) => {
      console.error('[switch-framework-electron] Page failed to load:', description);
      setTimeout(() => {
        if (!mainWindow.isDestroyed()) mainWindow.loadURL(appUrl);
      }, 750);
    });

    mainWindow.once('ready-to-show', () => resolve(mainWindow));

    attachLocalAuthCookie(mainWindow, host, port, token).then(() => {
      mainWindow.loadURL(appUrl);
    });
  });
}

function bootstrapElectronApp(options = {}) {
  const {
    servers = [{ name: 'app', entry: 'server.js' }],
    preloadPath,
    splashHtmlPath,
    appRoot,
    cwd,
    windowBounds = { width: 1200, height: 800 },
    onReady,
  } = options;

  if (!preloadPath) throw new Error('bootstrapElectronApp requires preloadPath');
  if (!splashHtmlPath) throw new Error('bootstrapElectronApp requires splashHtmlPath');

  let splashWindow = null;
  let mainWindow = null;
  let localSession = null;
  let bootstrapping = false;

  async function openMainWindow(ports) {
    if (!splashWindow || splashWindow.isDestroyed()) return;

    const appServer = ports.app || Object.values(ports)[0];
    if (!appServer?.port) throw new Error('App server did not report a port');

    const host = appServer.host || '127.0.0.1';
    const bounds = splashWindow.getBounds();

    mainWindow = await createMainWindow({
      bounds,
      host,
      port: appServer.port,
      token: localSession?.token,
      preloadPath,
    });

    if (typeof onReady === 'function') {
      await onReady({ ports, mainWindow, splashWindow });
    }

    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
  }

  function bootstrap() {
    if (bootstrapping) return;
    bootstrapping = true;

    localSession = createLocalSession();
    splashWindow = createSplashWindow(splashHtmlPath, windowBounds);
    startServers(servers, localSession, { appRoot, cwd });

    onServerReady((ports) => {
      openMainWindow(ports)
        .catch((err) => {
          console.error('[switch-framework-electron] Failed to open main window:', err);
          if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
          if (!mainWindow) app.quit();
        })
        .finally(() => {
          bootstrapping = false;
        });
    });
  }

  app.on('before-quit', () => stopServerProcess());

  app.whenReady().then(() => {
    bootstrap();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) bootstrap();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

module.exports = {
  bootstrapElectronApp,
  createSplashWindow,
  createMainWindow,
  attachLocalAuthCookie,
};
