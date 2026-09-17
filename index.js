'use strict';

const ipc = require('./lib/ipc.js');
const session = require('./lib/session.js');
const servers = require('./lib/servers.js');
const bootstrap = require('./lib/bootstrap.js');
const paths = require('./lib/paths.js');
const messages = require('./lib/messages.js');
const constants = require('./lib/constants.js');

module.exports = {
  ...ipc,
  ...session,
  ...servers,
  ...bootstrap,
  ...paths,
  ...messages,
  ...constants,
  childEntry: require('node:path').join(__dirname, 'child.js'),
};
