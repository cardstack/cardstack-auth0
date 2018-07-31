/* eslint-env node */
'use strict';

module.exports = {
  name: '@cardstack/auth0',
  isDevelopingAddon() {
    return process.env.CARDSTACK_DEV;
  },

  included(app) {
    this._super.included(app);

    app.import('node_modules/bowser/bowser.js');
    app.import('vendor/bowser-shim.js', {
      exports: {
        bowser: ['default']
      }
    });
  }
};
