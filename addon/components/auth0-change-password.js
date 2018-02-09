import Ember from 'ember';
import layout from '../templates/components/auth0-change-password';
import { hubURL } from '@cardstack/plugin-utils/environment';
import { task } from 'ember-concurrency';

export default Ember.Component.extend({
  layout,
  tagName: '',

  sendChangePasswordEmail: task(function * (email) {
    yield fetch(`${hubURL}/auth0/change-password-email/${email}`, { method: "POST" });
  }).drop(),
})
