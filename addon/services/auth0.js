import Ember from 'ember';
import { configure, getConfiguration } from 'torii/configuration';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import { hubURL } from '@cardstack/plugin-utils/environment';
import bowser from 'bowser';

const { get, set } = Ember;

function extendToriiProviders(newConfig) {
  let toriiConfig = Object.assign({}, getConfiguration());
  if (!toriiConfig.providers) {
    toriiConfig.providers = {};
  }
  Object.assign(toriiConfig.providers, newConfig)
  configure(toriiConfig);
}

export default Ember.Service.extend({
  session: service(),
  cardstackSession: service(),
  torii: service(),

  source: 'auth0',
  authenticationHandler: null,
  partialAuthenticationHandler: null,
  authenticationFailedHandler: null,

  init() {
    this._super();

    let env;
    try {
      env = window.require('@cardstack/auth0/environment');
    } catch (err) {
      // running in an env that @cardstack/auth0 is not available like prember or fastboot...
      return;
    }

    let { clientId,
          toriiRemoteService,
          domain,
          popup,
          redirectUri,
          forcePopupBrowserList,
          scope } = env;

    let opts = {
      'auth0-oauth2': {
        baseUrl: `https://${domain}/authorize`,
        apiKey: clientId,
        scope,
        redirectUri
      }
    };

    let forcePopup;
    let forcePopupBrowsers = forcePopupBrowserList ? forcePopupBrowserList.split(',') : [];
    forcePopupBrowsers.forEach(browser => {
      forcePopup = forcePopup || !!bowser[browser];
    });

    if (toriiRemoteService && !forcePopup) {
      opts["auth0-oauth2"]["remoteServiceName"] = toriiRemoteService;
    }
    extendToriiProviders(opts);
    set(this,"popup", popup);
  },


  login: task(function* () {
    // this should wait for fetchConfig to be done, but if we block
    // before opening the popup window we run afoul of popup
    // blockers. So instead in our template we don't render ourself at
    // all until after fetchConfig finishes. Fixing this more nicely
    // would require changes to Torii.
    let { authorizationCode } = yield get(this, 'torii').open('auth0-oauth2', get(this, "popup") || {});

    if (authorizationCode) {
      yield get(this, 'authenticate').perform(authorizationCode);
    }
  }).drop(),

  authenticate: task(function* (authorizationCode) {
    let message;

    try {
      yield get(this, 'session').authenticate('authenticator:cardstack', get(this, 'source'), { authorizationCode });
    } catch(err) {
      message = err.message;
    }

    let session = get(this, 'cardstackSession');
    let onAuthenticationHandler = get(this, 'authenticationHandler');
    let onPartialAuthenticationHandler = get(this, 'partialAuthenticationHandler');
    let onAuthenticationFailedHandler = get(this, 'authenticationFailedHandler');

    if (get(session, 'isAuthenticated') &&
      typeof onAuthenticationHandler === 'function') {
      onAuthenticationHandler(session);
    } else if (get(session, 'isPartiallyAuthenticated') && typeof
      onPartialAuthenticationHandler === 'function') {
      onPartialAuthenticationHandler(session);
    } else if (!get(session, 'isAuthenticated') &&
      !get(session, 'isPartiallyAuthenticated') && typeof
      onAuthenticationFailedHandler === 'function') {
      onAuthenticationFailedHandler(message);
    }
  }),

  sendChangePasswordEmail: task(function* (email) {
    yield fetch(`${hubURL}/auth0/change-password-email/${email}`, { method: "POST" });
  }).drop(),

  cancelLogin: task(function* () {
    get(this, "login").cancelAll();
    yield get(this, 'torii').close('auth0-oauth2');
  }).drop(),
});

