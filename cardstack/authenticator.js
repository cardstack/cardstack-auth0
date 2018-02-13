const Error = require('@cardstack/plugin-utils/error');
const request = require('request-promise');
const jwt = require('jsonwebtoken');

function cleanupNamespacedProps(obj) {
  let result = {};
  Object.keys(obj).forEach(key => {
    let cleanKey = key.replace(/^(https:\/\/.*\/)?([^\/]+)$/, '$2');
    result[cleanKey] = obj[key];
  });

  return result;
}

module.exports = class {
  static create(...args) {
    return new this(...args);
  }
  constructor(params) {
    this.clientId = params['client-id'];
    this.clientSecret = params['client-secret'];
    this.domain = params['domain'];
    this.appUrl = params['app-url'];
    this.scope = params['scope'];
    this.toriiRemoteService = params['torii-remote-service'];
    this.popup = params['popup'];
    this.dataSource = params['dataSource'];
    this.apiClientId = params["api-client-id"];
    this.apiClientSecret = params["api-client-secret"];
    this.dbConnectionName = params["db-connection-name"];

    this.defaultUserTemplate = `{
      "data": {
        "id": "{{#if sub}}{{sub}}{{else}}{{user_id}}{{/if}}",
        "type": {{#if email_verified}}"auth0-users"{{else}}"partial-sessions"{{/if}},
        "attributes": {
          "name": "{{name}}",
          "email":"{{email}}",
          "avatar-url":"{{{picture}}}",
          "email-verified":{{email_verified}}
          {{#unless email_verified}},
            "message": {
              "state": "verify-email",
              "id": "{{#if sub}}{{sub}}{{else}}{{user_id}}{{/if}}"
            }
          {{/unless}}
        }
      }
      {{#unless email_verified}},
        "meta": {
          "partial-session": true
        }
      {{/unless}}
    }`;
  }

  async authenticate(payload /*, userSearcher */) {
    if (!payload.authorizationCode) {
      throw new Error("missing required field 'authorizationCode'", {
        status: 400
      });
    }
    let response = await request({
      method: "POST",
      uri: `https://${this.domain}/oauth/token`,
      body: {
        "grant_type": "authorization_code",
        "client_id": this.clientId,
        "client_secret": this.clientSecret,
        "code": payload.authorizationCode,
        "redirect_uri": this.appUrl
      },
      json: true,
      resolveWithFullResponse: true
    });

    let { body } = response;
    if (response.statusCode !== 200) {
      throw new Error(body.error, {
        status: response.statusCode,
        description: body.error_description
      });
    }

    let user =  jwt.decode(body.id_token);
    user = cleanupNamespacedProps(user);
    return user;
  }

  exposeConfig() {
    return {
      clientId: this.clientId,
      domain: this.domain,
      scope: this.scope,
      toriiRemoteService: this.toriiRemoteService,
      redirectUri: `${this.appUrl}/torii/redirect.html`,
      popup: this.popup
    };
  }

};
