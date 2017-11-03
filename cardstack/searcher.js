const request = require('request-promise');
const { rewriteExternalUser } = require('@cardstack/authentication');

module.exports = class Auth0Searcher {
  static create(...args) {
    return new this(...args);
  }
  constructor(opts) {
    let { domain, dataSource } = opts;
    this.domain = domain;
    this.clientId = opts["api-client-id"];
    this.clientSecret = opts["api-client-secret"];
    this.dataSource = dataSource;
  }

  async get(branch, type, id, next) {
    if (type === 'auth0-users') {
      return this._getUser(id);
    }
    return next();
  }

  async search(branch, query, next) {
    return next();
  }

  async _getUser(login) {
    //Auth0 requires a priviledged API token
    let apiTokenOptions = {
      method: "POST",
      uri: `https://${this.domain}/oauth/token`,
      body: {
        grant_type: "client_credentials",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        audience: "https://cardstack.auth0.com/api/v2/"
      },
      json: true,
    };

    let { access_token: accessToken } = await request(apiTokenOptions);

    let options = {
      method: "GET",
      uri: `https://${this.domain}/api/v2/users/${encodeURIComponent(login)}`,
      json: true,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    };

    let response = await request(options);
    response["sub"] = response["user_id"]; // the shape of the user is not symmetric between the API response and the original authenticate response
    return rewriteExternalUser(response, this.dataSource);
  }


};
