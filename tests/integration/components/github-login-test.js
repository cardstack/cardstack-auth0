import { find } from '@ember/test-helpers';
import { module, skip } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | auth0 login', function(hooks) {
  setupRenderingTest(hooks);

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
});
