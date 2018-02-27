import Ember from 'ember';
import { configure, getConfiguration } from 'torii/configuration';
import { task } from 'ember-concurrency';
import { hubURL } from '@cardstack/plugin-utils/environment';
let bowser = window.require('bowser');
const { getOwner } = Ember;

function extendToriiProviders(newConfig) {
  let toriiConfig = Object.assign({}, getConfiguration());
  if (!toriiConfig.providers) {
    toriiConfig.providers = {};
  }
  Object.assign(toriiConfig.providers, newConfig)
  configure(toriiConfig);
}

export default Ember.Service.extend({
  session: Ember.inject.service(),
  torii: Ember.inject.service(),

  source: 'auth0',

  fetchConfig: task(function * () {
    if (typeof FastBoot !== "undefined") { return; }

    let { clientId,
          domain,
          toriiRemoteService,
          popup,
          redirectUri,
          forcePopupBrowserList,
          scope } = yield getOwner(this).lookup('authenticator:cardstack').fetchConfig(this.get('source'));
    let opts = {
      'auth0-oauth2': {
        baseUrl: `https://${domain}/authorize`,
        apiKey: clientId,
        scope,
        redirectUri
      }
    };
    console.log("bowser", bowser);
    if (toriiRemoteService) {
      opts["auth0-oauth2"]["remoteServiceName"] = toriiRemoteService;
    }
    extendToriiProviders(opts);
    this.set("popup", popup);
  }).observes('source').on('init'),

  login: task(function * () {
    // this should wait for fetchConfig to be done, but if we block
    // before opening the popup window we run afoul of popup
    // blockers. So instead in our template we don't render ourself at
    // all until after fetchConfig finishes. Fixing this more nicely
    // would require changes to Torii.
    let { authorizationCode } = yield this.get('torii').open('auth0-oauth2', this.get("popup") || {});

    if (authorizationCode) {
      yield this.get('authenticate').perform(authorizationCode);
    }
  }).drop(),

  authenticate: task(function * (authorizationCode) {
    yield this.get('session').authenticate('authenticator:cardstack', this.get('source'), { authorizationCode });
  }),

  sendChangePasswordEmail: task(function * (email) {
    yield fetch(`${hubURL}/auth0/change-password-email/${email}`, { method: "POST" });
  }).drop(),

  cancelLogin: task(function * () {
    this.get("login").cancelAll();
    yield this.get('torii').close('auth0-oauth2');
  }).drop(),
});

