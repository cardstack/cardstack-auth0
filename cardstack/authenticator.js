const Error = require('@cardstack/plugin-utils/error');
const request = require('request-promise');
const jwt = require('jsonwebtoken');
const log = require('@cardstack/logger');

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
    this.requireClientIdAndSecret = params['require-client-id-and-secret'];
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
    if (!payload.authorizationCode && !payload.refreshToken) {
      throw new Error("missing required field 'authorizationCode' or 'refreshToken'", {
        status: 400
      });
    }

    if (payload.authorizationCode && payload.refreshToken) {
      throw new Error("only an 'authorizationCode' or a 'refreshToken' is required", {
        status: 400
      });
    }

    // if clientId & clientSecret check is required 
    // (best for server-to-server auth)
    if(this.requireClientIdAndSecret){
      await this.checkClientIdAndSecret(payload);
    }

    let requestBody = await this.createAuthBody(payload);
    let response = await request({
      method: "POST",
      uri: `https://${this.domain}/oauth/token`,
      body: requestBody,
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
    user.refreshToken = body.refresh_token;
    user = cleanupNamespacedProps(user);
    return user;
  }

  async createAuthBody(payload){
    let requestBody = {
      "client_id": this.clientId,
      "client_secret": this.clientSecret,
    };

    if(payload.authorizationCode){
      requestBody['grant_type'] = 'authorization_code';
      requestBody['code'] = payload.authorizationCode;
      log.info('payload', payload)
      log.info("payload redirect", !payload.redirectUrl);
      (!payload.redirectUrl) ? requestBody['redirect_uri'] = this.appUrl : requestBody['redirect_uri'] = payload.redirectUrl;
    } else {
      requestBody['grant_type'] = 'refresh_token';
      requestBody['refresh_token'] = payload.refreshToken;
    };

    return requestBody;
  };

  async checkClientIdAndSecret(payload){
    if(payload.clientId !== this.clientId){
      throw new Error("Incorrect client id.", {
        status: 400
      });
    }
    
    if(payload.clientSecret !== this.clientSecret){
      throw new Error("Incorrect client secret.", {
        status: 400
      });
    }
    return;
  }
};
