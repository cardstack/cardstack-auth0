/* eslint-env node */
module.exports = [
  {
    type: 'data-sources',
    id: 'default',
    attributes: {
      'source-type': '@cardstack/ephemeral',
    }
  },
  {
    type: 'data-sources',
    id: 'auth0',
    attributes: {
        'source-type': '@cardstack/auth0',
        params: {
          'client-id': process.env.AUTH0_CLIENT_ID,
          'client-secret': process.env.AUTH0_CLIENT_SECRET,
          'domain': process.env.AUTH0_DOMAIN,
          'app-url': process.env.AUTH0_APP_URL, // This most be set to the URL of the application that made the initial token request
          'scope': 'openid profile email',
          'popup': { height: 700, width: 500 },
          'api-client-id': process.env.AUTH0_API_CLIENT_ID,
          'api-client-secret': process.env.AUTH0_API_CLIENT_SECRET,
          'audience': process.env.AUTH0_AUDIENCE,
          'db-connection-name': process.env.AUTH0_DB_CONNECTION_NAME,
          'substitute-gravatar-default': 'https://cardstack.com/assets/images/default-avatar.png'
        }
        // include this if you want the login to appear as an iframe (this generally doesn't work with 3rd party auth sources like google or facebook as those hosts use X-Frame-Options set to sameorigin.
        // 'torii-remote-service': 'iframe',
    }
  },
  {
    type: 'plugin-configs',
    id: '@cardstack/hub',
    relationships: {
      'default-data-source': {
        data: { type: 'data-sources', id: 'default' }
      }
    }
  }
];
