# @cardstack/auth0

This README outlines the details of collaborating on this Ember addon.

## Installation

 `ember install @cardstack/auth0`

## Running

To run the demo app and interact with Auth0, you need to setup Auth0:
1. Create an Auth0 Single Page app client. This is the client that will present a login form that users will interact with.
2. Set the allowed callback URL in your SPA Auth0 client to `http://<your app's URL>/torii/redirect.html`
3. Create an Auth0 "Non Interactive" client. This is the client that the cardstack hub server will use to interact with users, aka the "API Client".
4. Adjust the scopes for the non-interactive client: API-> Non Interactive clients -> click down arrow on the non interactive client created in #3. Set the scopes to include at least: `read:users` `read:users_app_metadata`
5. Set environment variables for the various Auth0 settings above: `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_DOMAIN`, `AUTH0_API_CLIENT_ID`, `AUTH0_API_CLIENT_SECRET`, and `AUTH0_APP_URL` (this is the URL of your app). This allows this plugin to act as an OAuth2 client that speaks to GitHub on behalf of users who authorize it.

* To view a working demo of this addon, run `ember serve` (with the environment variables mentioned above set).
* Visit your app at [http://localhost:4200](http://localhost:4200).

## Running Tests

* `npm test` (Runs `ember try:each` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).
