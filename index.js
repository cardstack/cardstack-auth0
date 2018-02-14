/* eslint-env node */
'use strict';

module.exports = {
  name: 'cardstack-auth0',
  isDevelopingAddon() {
    return process.env.CARDSTACK_DEV;
  }
};
