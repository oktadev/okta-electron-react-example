import React, { Component } from 'react';
import { BrowserRouter as Router, Redirect, Route } from 'react-router-dom';
import { ImplicitCallback, SecureRoute, Security } from '@okta/okta-react';
import Home from './Home';
import Login from './Login';
import Points from './Points';

function onAuthRequired({history}) {
  history.push('/login');
}

class App extends Component {
  render() {
    return (
      <Router>
        <div>{window.location.pathname.includes('index.html') && <Redirect to="/"/>}
          <Security issuer='https://dev-669532.oktapreview.com/oauth2/default'
                    client_id='0oaf8zw7lslnzoJia0h7'
                    redirect_uri='http://localhost:3000/implicit/callback'
                    onAuthRequired={onAuthRequired}>
            <Route path='/' exact={true} component={Home}/>
            <SecureRoute path='/points' component={Points}/>
            <Route path='/login' render={() => <Login baseUrl='https://dev-669532.oktapreview.com'/>}/>
            <Route path='/implicit/callback' component={ImplicitCallback}/>
          </Security>
        </div>
      </Router>
    );
  }
}

export default App;