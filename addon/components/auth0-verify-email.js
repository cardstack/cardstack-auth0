import Ember from 'ember';
import layout from '../templates/components/auth0-verify-email';
import { hubURL } from '@cardstack/plugin-utils/environment';
import { task } from 'ember-concurrency';

export default Ember.Component.extend({
  layout,
  tagName: '',

  resendEmail: task(function* (id) {
    yield fetch(`${hubURL}/auth0/verification-email/${id}`, { method: "POST" });
  }).drop(),
})
