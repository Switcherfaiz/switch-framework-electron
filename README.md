# switch-framework-electron

Electron helpers for [Switch Framework](https://github.com/Switcherfaiz/switch-framework) desktop apps — child server forking, dynamic ports, IPC, splash bootstrap, and window controls.

## Install

```bash
npm install switch-framework-electron switch-framework switch-framework-backend
npm install electron --save-dev
```

Scaffold a full app with the CLI:

```bash
npx create-switch-framework-app my-app --app-type electron
```

## Usage

**`electron/servers.js`** — declare child processes:

```javascript
module.exports = [
  { name: 'app', entry: 'server.js' },
  { name: 'worker', entry: 'worker-server.js' },
];
```

**`electron/main.js`** — bootstrap:

```javascript
const path = require('node:path');
const { bootstrapElectronApp } = require('switch-framework-electron');
const servers = require('./servers.js');

bootstrapElectronApp({
  servers,
  preloadPath: path.join(__dirname, 'preload.js'),
  splashHtmlPath: path.join(__dirname, 'splash.html'),
  appRoot: path.join(__dirname, '..'),
  cwd: path.join(__dirname, '..'),
});
```

Each **`entry`** file is a normal Node script that starts an HTTP server (via `switch-framework-backend` or raw `http.createServer`). The package assigns a free localhost port and reports it over IPC.

## API

| Export | Description |
|--------|-------------|
| `bootstrapElectronApp(options)` | Splash → fork servers → open main window |
| `startServers(list, session, opts)` | Fork all entries from `servers.js` |
| `onServerReady(cb)` / `whenServerReady()` | Called when every server reported a port |
| `registerWindowIpc(win)` | Minimize / maximize / close for frameless windows |
| `createLocalSession()` | Random token for local auth cookie |
| `childEntry` | Internal fork script path |

## Docs

[Desktop Server](https://github.com/Switcherfaiz/switch-framework-docs) · [Multiple child servers](https://github.com/Switcherfaiz/switch-framework-docs) · [Package reference](https://github.com/Switcherfaiz/switch-framework-docs)

## License

MIT © Faiz Ahmad Ally (Switcherfaiz)
