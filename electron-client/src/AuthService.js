/*
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import { AuthorizationRequest } from '@openid/appauth/built/authorization_request';
import { AuthorizationNotifier } from '@openid/appauth/built/authorization_request_handler';
import { AuthorizationServiceConfiguration } from '@openid/appauth/built/authorization_service_configuration';
import { NodeBasedHandler } from '@openid/appauth/built/node_support/node_request_handler';
import { NodeRequestor } from '@openid/appauth/built/node_support/node_requestor';
import {
  GRANT_TYPE_AUTHORIZATION_CODE,
  GRANT_TYPE_REFRESH_TOKEN,
  TokenRequest
} from '@openid/appauth/built/token_request';
import { BaseTokenRequestHandler } from '@openid/appauth/built/token_request_handler';

import { EventEmitter } from 'events';

export class AuthStateEmitter extends EventEmitter {
  static ON_TOKEN_RESPONSE = 'on_token_response';
}

/* the Node.js based HTTP client. */
const requestor = new NodeRequestor();

/* an example open id connect provider */
const openIdConnectUrl = 'https://dev-669532.oktapreview.com/oauth2/default';

/* example client configuration */
const clientId = '0oafavni96j2yJNvQ0h7';
const redirectUri = 'http://127.0.0.1:8000';
const scope = 'openid profile offline_access';

export default class AuthService {
  notifier;
  authorizationHandler;
  tokenHandler;
  authStateEmitter;
  challengePair;

  // state
  configuration;
  refreshToken;
  accessTokenResponse;

  constructor() {
    this.notifier = new AuthorizationNotifier();
    this.authStateEmitter = new AuthStateEmitter();
    this.authorizationHandler = new NodeBasedHandler();
    this.tokenHandler = new BaseTokenRequestHandler(requestor);
    // set notifier to deliver responses
    this.authorizationHandler.setAuthorizationNotifier(this.notifier);
    // set a listener to listen for authorization responses
    // make refresh and access token requests.
    this.notifier.setAuthorizationListener((request, response, error) => {
      console.log('Authorization request complete ', request, response, error);
      if (response) {
        this.makeRefreshTokenRequest(response.code)
            .then(result => this.performWithFreshTokens())
            .then(() => {
              this.authStateEmitter.emit(AuthStateEmitter.ON_TOKEN_RESPONSE);
              console.log('All Done.');
            })
      }
    });
  }

  fetchServiceConfiguration() {
    return AuthorizationServiceConfiguration
        .fetchFromIssuer(openIdConnectUrl, requestor)
        .then(response => {
          console.log('Fetched service configuration', response);
          this.configuration = response;
        });
  }

  makeAuthorizationRequest(username) {
    if (!this.configuration) {
      console.log('Unknown service configuration');
      return;
    }

    const extras = {'prompt': 'consent', 'access_type': 'offline'};
    if (username) {
      extras['login_hint'] = username;
    }

    this.challengePair = AuthService.getPKCEChallengePair();

    // PKCE
    extras['code_challenge'] = this.challengePair.challenge;
    extras['code_challenge_method'] = 'S256';

    // create a request
    const request = new AuthorizationRequest(
        clientId, redirectUri, scope, AuthorizationRequest.RESPONSE_TYPE_CODE,
        undefined /* state */, extras);

    console.log('Making authorization request ', this.configuration, request);

    this.authorizationHandler.performAuthorizationRequest(
        this.configuration, request);
  }

  makeRefreshTokenRequest(code) {
    if (!this.configuration) {
      console.log('Unknown service configuration');
      return Promise.resolve();
    }

    let tokenRequestExtras = { code_verifier: this.challengePair.verifier };

    // use the code to make the token request.
    let request = new TokenRequest(
        clientId, redirectUri, GRANT_TYPE_AUTHORIZATION_CODE, code, undefined, tokenRequestExtras);

    return this.tokenHandler.performTokenRequest(this.configuration, request)
        .then(response => {
          console.log(`Refresh Token is ${response.refreshToken}`);
          this.refreshToken = response.refreshToken;
          this.accessTokenResponse = response;
          return response;
        })
        .then(() => {});
  }

  loggedIn() {
    return !!this.accessTokenResponse && this.accessTokenResponse.isValid();
  }

  signOut() {
    // forget all cached token state
    this.accessTokenResponse = null;
  }

  performWithFreshTokens() {
    if (!this.configuration) {
      console.log('Unknown service configuration');
      return Promise.reject('Unknown service configuration');
    }
    if (!this.refreshToken) {
      console.log('Missing refreshToken.');
      return Promise.resolve('Missing refreshToken.');
    }
    if (this.accessTokenResponse && this.accessTokenResponse.isValid()) {
      // do nothing
      return Promise.resolve(this.accessTokenResponse.accessToken);
    }
    let request = new TokenRequest(
        clientId, redirectUri, GRANT_TYPE_REFRESH_TOKEN, undefined,
        this.refreshToken);
    return this.tokenHandler.performTokenRequest(this.configuration, request)
        .then(response => {
          this.accessTokenResponse = response;
          return response.accessToken;
        });
  }

  static getPKCEChallengePair() {
    let verifier = AuthService.base64URLEncode(crypto.randomBytes(32));
    let challenge = AuthService.base64URLEncode(AuthService.sha256(verifier));
    return {verifier, challenge};
  }

  static base64URLEncode(str) {
    return str.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  static sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest();
  }
}
