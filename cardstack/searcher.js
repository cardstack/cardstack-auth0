const request = require('request-promise');
const { rewriteExternalUser } = require('@cardstack/authentication');
const log = require('@cardstack/logger')('searcher')
module.exports = class Auth0Searcher {
  static create(...args) {
    return new this(...args);
  }
  constructor(opts) {
    let { domain, dataSource } = opts;
    this.domain = domain;
    this.clientId = opts["api-client-id"];
    this.clientSecret = opts["api-client-secret"];
    this.gravatarSubstitue = opts['substitute-gravatar-default'];
    this.dataSource = dataSource;
  }

  async get(session, type, id, next) {
    if (type === 'auth0-users') {
      return this._getUser(id);
    }
    return next();
  }

  async search(session, query, next) {
    log.info("in search!")
    return next();
  }

  async _getUser(login) {
    log.info("GET USER!!!", login)
    //Auth0 requires a priviledged API token
    let apiTokenOptions = {
      method: "POST",
      uri: `https://${this.domain}/oauth/token`,
      body: {
        grant_type: "client_credentials",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        audience: "https://cpurtlebaugh.auth0.com/api/v2/"
      },
      json: true,
    };

    let { access_token: accessToken } = await request(apiTokenOptions);
    log.info("access token:", accessToken)
    let options = {
      method: "GET",
      uri: `https://${this.domain}/api/v2/users/${encodeURIComponent(login)}`,
      json: true,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    };

    let response = await request(options);
    log.info("response in get user: ", response)
    if (this.gravatarSubstitue && response.picture) {
      response.picture = response.picture.replace(/(^http[s]*:\/\/s\.gravatar\.com\/avatar\/[^\?]+.*\&d=).+$/, '$1' + encodeURIComponent(this.gravatarSubstitue));
    }
    return rewriteExternalUser(response, this.dataSource);
  }


};
