import Ember from 'ember';
import { get, set } from '@ember/object';
import layout from '../templates/components/auth0-login';

export default Ember.Component.extend({
  auth0: Ember.inject.service(),
  layout,
  tagName: '',

  init() {
    this._super();

    let service = get(this, 'auth0');
    let onAuthentication = get(this, 'onAuthenticationSuccess');
    let onPartialAuthentication = get(this, 'onPartialAuthenticationSuccess');
    let onAuthenticationFailed = get(this, 'onAuthenticationFailed');

    if (typeof onAuthentication === 'function') {
      set(service, 'authenticationHandler', onAuthentication.bind(this));
    }
    if (typeof onPartialAuthentication === 'function') {
      set(service, 'partialAuthenticationHandler', onPartialAuthentication.bind(this));
    }
    if (typeof onAuthenticationFailed === 'function') {
      set(service, 'authenticationFailedHandler', onAuthenticationFailed.bind(this));
    }
  },
});
