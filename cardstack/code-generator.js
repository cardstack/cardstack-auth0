const Handlebars = require('handlebars');
const { declareInjections } = require('@cardstack/di');

const template = Handlebars.compile(`
  {{#each properties as |property|}}
    export const {{property.name}} = "{{property.value}}";
  {{/each}}

`);

module.exports = declareInjections({
  sources: 'hub:data-sources',
},

class Auth0CodeGenerator {
  async generateModules() {
    let activeSources = await this.sources.active();
    let source = Array.from(activeSources.values()).find(s => s.sourceType === '@cardstack/auth0');
    if (!source || !source.authenticator) { 
      return new Map()
    } else {
      let { clientId,
        domain,
        scope,
        toriiRemoteService,
        appUrl,
        popup,
        forcePopupBrowserList
      } = source.authenticator;
      let properties = [{
        name: 'clientId',
        value: clientId,
      },{
        name: 'domain',
        value: domain
      },{
        name: 'appUrl',
        value: appUrl
      },{
        name: 'scope',
        value: scope
      },{
        name: 'toriiRemoteService',
        value: toriiRemoteService
      },{
        name: 'redirectUri',
        value: `${appUrl}/torii/redirect.html`,
      },{
        name: 'popup',
        value: popup
      },{
        name: 'forcePopupBrowserList',
        value: (forcePopupBrowserList || []).join(',')
      }];
      let compiled = template({ properties });
      return new Map([['environment', compiled]]);
    }
  }
});
