const Handlebars = require('handlebars');
const { declareInjections } = require('@cardstack/di');

const sourceName = "auth0";

const template = Handlebars.compile(`
define("cardstack-auth0/environment", ["exports"], function (exports) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  {{#each properties as |property|}}
    exports.{{property.name}} = "{{property.value}}";
  {{/each}}
});
`);

module.exports = declareInjections({
  sources: 'hub:data-sources',
},

class LiveQueryCodeGenerator {

  async generateCode() {
    let activeSources = await this.sources.active();
    let source = activeSources.get(sourceName);
    if (!source || !source.authenticator) { return; }

    let { clientId,
          domain,
          scope,
          toriiRemoteService,
          appUrl,
          popup,
          forcePopupBrowserList
    } = source.authenticator;

    return template({ properties: [{
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
    }]});
  }
});
