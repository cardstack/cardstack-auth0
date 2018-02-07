const Error = require('@cardstack/plugin-utils/error');
const request = require('request-promise');
const jwt = require('jsonwebtoken');

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

    this.defaultUserTemplate = params["default-user-template"] ||
                               `{ "data": { "id": "{{sub}}", "type": "auth0-users", "attributes": { "name": "{{name}}", "email":"{{email}}", "avatar-url":"{{{picture}}}" }}}`;
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
