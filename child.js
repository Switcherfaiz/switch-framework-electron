'use strict';

const path = require('node:path');
const http = require('http');
const { SERVER_READY_MESSAGE } = require('./lib/messages.js');
const {
  SERVER_CHILD_FLAG,
  APP_ROOT_ENV,
} = require('./lib/constants.js');

if (process.env[SERVER_CHILD_FLAG] !== '1') {
  throw new Error('switch-framework-electron/child.js must run as a forked server child');
}

const origListen = http.Server.prototype.listen;
http.Server.prototype.listen = function patchedListen() {
  const port = process.env.PORT === undefined ? 0 : Number(process.env.PORT);
  const host = process.env.SWITCH_BIND_HOST || '127.0.0.1';
  this.once('listening', () => {
    const addr = this.address();
    const info = {
      type: SERVER_READY_MESSAGE,
      name: process.env.SWITCH_SERVER_NAME || 'app',
      port: typeof addr === 'object' && addr ? addr.port : port,
      host: typeof addr === 'object' && addr ? addr.address : host,
    };
    console.log(`[switch-framework-electron:${info.name}] http://${info.host}:${info.port}`);
    if (typeof process.send === 'function') process.send(info);
  });
  return origListen.call(this, Number.isFinite(port) ? port : 0, host);
};

const appRoot = process.env[APP_ROOT_ENV];
const entry = process.env.SWITCH_SERVER_ENTRY || 'server.js';
require(path.join(appRoot, entry));
