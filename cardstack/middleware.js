const log = require('@cardstack/logger')('cardstack-auth0');
const Error = require('@cardstack/plugin-utils/error');
const compose = require('koa-compose');
const route = require('koa-better-route');
const request = require('request-promise');

const { declareInjections } = require('@cardstack/di');
const { withJsonErrorHandling } = Error;

function addCorsHeaders(response) {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type');
}

const prefix = 'auth0';
const sourceName = "auth0";

module.exports = declareInjections({
  sources: 'hub:data-sources',
},

class Auth0Middleware {
  middleware() {
    return compose([
      this._sendVerificationEmail(),
      this._sendPasswordChangeEmail(),
    ]);
  }

  async _locateAuthenticationSource() {
    let activeSources = await this.sources.active();
    let source = activeSources.get(sourceName);
    return source.authenticator;
  }

  _sendPasswordChangeEmail() {
    return route.post(`/${prefix}/change-password-email/:email`, compose([
      async (ctxt) => {
        addCorsHeaders(ctxt.response);
        await withJsonErrorHandling(ctxt, async () => {
          let email = ctxt.routeParams.email;
          let { clientId, domain, dbConnectionName } = await this._locateAuthenticationSource();

          // Note that this only makes sense when Auth0 is using the connection type of DB,
          // otherwise the password is managed in a 3rd party system like google
          if (!dbConnectionName) {
            ctxt.status = 405;
            return;
          }

          let options = {
            method: "POST",
            uri: `https://${domain}/dbconnections/change_password`,
            body: {
              email,
              client_id: clientId,
              connection: dbConnectionName
            },
            json: true,
            resolveWithFullResponse: true
          };

          log.debug(`Issuing change password email request for email ${email}`);
          let { body, statusCode } = await request(options);
          log.debug(`Received change password email response for email ${email}: ${statusCode} - ${JSON.stringify(body)}`);
          ctxt.status = 204;

          if (statusCode >= 200 && statusCode <= 299) {
            ctxt.status = 204;
          } else {
            log.error(`Unsuccessful response received from change password email for email ${email}: ${statusCode} - ${JSON.stringify(body)}`);
            ctxt.status = 500;
            ctxt.body = {
              errors: [{
                title: "Unexpected response from Auth0",
                detail: `Unsuccessful response received from change password email for email ${email}: ${statusCode} - ${JSON.stringify(body)}`
              }]
            };
          }
        });
      }
    ]));
  }

  _sendVerificationEmail() {
    return route.post(`/${prefix}/verification-email/:id`, compose([
      async (ctxt) => {
        addCorsHeaders(ctxt.response);
        await withJsonErrorHandling(ctxt, async () => {
          let { clientId, apiClientId, apiClientSecret, domain } = await this._locateAuthenticationSource();

          let id = ctxt.routeParams.id;

          let apiTokenOptions = {
            method: "POST",
            uri: `https://${domain}/oauth/token`,
            body: {
              grant_type: "client_credentials",
              client_id: apiClientId,
              client_secret: apiClientSecret,
              audience: "https://cardstack.auth0.com/api/v2/"
            },
            json: true,
          };

          let { access_token: accessToken } = await request(apiTokenOptions);

          let options = {
            method: "POST",
            uri: `https://${domain}/api/v2/jobs/verification-email`,
            headers: {
              Authorization: `Bearer ${accessToken}`
            },
            body: {
              user_id: id,
              client_id: clientId
            },
            json: true,
            resolveWithFullResponse: true
          };

          log.debug(`Issuing email verification request for user id ${id}`);
          let { body, statusCode } = await request(options);

          log.debug(`Received email verification response for user id ${id}: ${statusCode} - ${JSON.stringify(body)}`);

          if (statusCode >= 200 && statusCode <= 299) {
            ctxt.status = 204;
          } else {
            log.error(`Unsuccessful response received from email verification for user id ${id}: ${statusCode} - ${JSON.stringify(body)}`);
            ctxt.status = 500;
            ctxt.body = {
              errors: [{
                title: "Unexpected response from Auth0",
                detail: `Unsuccessful response received from email verification for user id ${id}: ${statusCode} - ${JSON.stringify(body)}`
              }]
            };
          }
        });
      }
    ]));
  }
});
