'use strict';

const crypto = require('node:crypto');

function createLocalSession() {
  return {
    token: crypto.randomBytes(32).toString('hex'),
  };
}

module.exports = { createLocalSession };
