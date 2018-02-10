import Ember from 'ember';
import layout from '../templates/components/auth0-login';

export default Ember.Component.extend({
  layout,
  tagName: '',
  auth0: Ember.inject.service(),
});
