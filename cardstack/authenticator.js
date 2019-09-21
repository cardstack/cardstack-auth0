const Error = require('@cardstack/plugin-utils/error');
const request = require('request-promise');
const jwt = require('jsonwebtoken');
const log = require('@cardstack/logger')('authenticator')

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
    this.forcePopupBrowserList = params["force-popup-browser-list"];
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
    log.info("payload", payload)
    if (!payload.authorizationCode && !payload.refreshToken) {
      throw new Error("missing required field 'authorizationCode' or 'refreshToken'", {
        status: 400
      });
    }

    if (payload.authorizationCode && payload.refreshToken) {
      throw new Error("only 'authorizationCode' or 'refreshToken' is allowed", {
        status: 400
      });
    }

    let requestBody = {
      "client_id": this.clientId,
      "client_secret": this.clientSecret,
    }

    if(payload.authorizationCode){
      requestBody['grant_type'] = 'authorization_code';
      requestBody['code'] = payload.authorizationCode;
      requestBody['redirect_uri'] = this.appUrl;
    }

    if(payload.refreshToken){
      requestBody['grant_type'] = 'refresh_token';
      requestBody['refresh_token'] = payload.refreshToken;
    }

    log.info('requestBody:', requestBody);
    let response = await request({
      method: "POST",
      uri: `https://${this.domain}/oauth/token`,
      body: requestBody,
      json: true,
      resolveWithFullResponse: true
    });

    let { body } = response;
    log.info("body:", body);
    if (response.statusCode !== 200) {
      throw new Error(body.error, {
        status: response.statusCode,
        description: body.error_description
      });
    }

    let user =  jwt.decode(body.id_token);
    user.refreshToken = body.refresh_token;
    user = cleanupNamespacedProps(user);
    return user;
  }
};
