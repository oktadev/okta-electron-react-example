import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import OktaSignInWidget from './OktaSignInWidget';
import { withAuth } from '@okta/okta-react';
import AuthService from './AuthService';
const { BrowserWindow } = window.require('electron').remote;

export default withAuth(class Login extends Component {
  authService;

  constructor(props) {
    super(props);
    this.onSuccess = this.onSuccess.bind(this);
    this.onError = this.onError.bind(this);
    this.state = {
      authenticated: null
    };
    this.checkAuthentication();
    this.authService = new AuthService();
  }

  async checkAuthentication() {
    const authenticated = await this.props.auth.isAuthenticated();
    if (authenticated !== this.state.authenticated) {
      this.setState({authenticated});
    }
  }

  componentDidMount() {
    this.signIn();
  }

  signIn() {
    console.log('signing in ...');
    if (!this.authService.loggedIn()) {
      return this.authService.fetchServiceConfiguration().then(
        () => this.authService.makeAuthorizationRequest());
    } else {
      return Promise.resolve();
    }
  }

  componentDidUpdate() {
    this.checkAuthentication();
  }

  onSuccess(res) {

  }

  onError(err) {
    console.log('error logging in', err);
  }

  render() {
    if (this.state.authenticated === null) return null;
    return this.state.authenticated ?
      <Redirect to={{pathname: '/'}}/> :
      <p>Redirecting to login...</p>;
  }
});