'use strict';

const pkg = require('./package.json');

const ipc = require('./lib/ipc.js');
const session = require('./lib/session.js');
const servers = require('./lib/servers.js');
const bootstrap = require('./lib/bootstrap.js');
const paths = require('./lib/paths.js');
const messages = require('./lib/messages.js');
const constants = require('./lib/constants.js');

const VERSION = pkg.version;

module.exports = {
  VERSION,
  ...ipc,
  ...session,
  ...servers,
  ...bootstrap,
  ...paths,
  ...messages,
  ...constants,
  childEntry: require('node:path').join(__dirname, 'child.js'),
};
