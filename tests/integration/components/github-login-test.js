import { find } from '@ember/test-helpers';
import { moduleForComponent, skip } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('auth0-login', 'Integration | Component | auth0 login', {
  integration: true
});

skip('it renders', function(assert) {

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{auth0-login}}`);

  assert.equal(find('*').textContent.trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#auth0-login}}
      template block text
    {{/auth0-login}}
  `);

  assert.equal(find('*').textContent.trim(), 'template block text');
});
