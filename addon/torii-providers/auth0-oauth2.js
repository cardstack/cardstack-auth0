import Oauth2 from 'torii/providers/oauth2-code';
import {configurable} from 'torii/configuration';

/**
 * This class implements authentication against Linked In
 * using the OAuth2 authorization flow in a popup window.
 *
 * @class LinkedInOauth2
 */
var Auth0OAuth2 = Oauth2.extend({
  name:       'auth0-oauth2',
  baseUrl:    configurable('baseUrl'),

  responseParams: ['code', 'state'],

});

export default Auth0OAuth2;
