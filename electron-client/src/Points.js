import React, { Component } from 'react';
import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';
import gql from 'graphql-tag';

import { withAuth } from '@okta/okta-react';
import { Link } from 'react-router-dom';

export const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql'
});

export default withAuth(class Points extends Component {
  constructor(props) {
    super(props);
    this.state = {user: null, points: []};
  }

  async componentDidMount() {
    const user = await this.props.auth.getUser();
    this.setState({user});

    const authLink = setContext(async (_, { headers }) => {
      const token = await this.props.auth.getAccessToken();

      // return the headers to the context so httpLink can read them
      return {
        headers: {
          ...headers,
          authorization: token ? `Bearer ${token}` : '',
          'x-forwarded-user': user ? JSON.stringify(user) : ''
        }
      }
    });

    const client = new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache()
    });

    client.query({
      query: gql`
          {
            points {
                id,
                user {
                    id,
                    lastName
                }
                date,
                alcohol,
                exercise,
                diet,
                notes
            }
          }
      `
    })
    .then(result => {
      console.log(result);
      this.setState({points: result.data.points});
    });
  }

  render() {
    const {user, points} = this.state;
    const message = user ? <p>Hello {user.given_name} {user.family_name}</p> : '';

    return (
      <div>
        <h2>21 Points</h2>
        {message}
        <h3>Your Points</h3>
        <table>
          <thead>
          <tr>
            <th>Date</th>
            <th>Points</th>
            <th>Notes</th>
          </tr>
          </thead>
          <tbody>
          {points.map(p =>
            <tr key={p.id}>
              <td><Link to={`${this.props.match.url}/${p.id}`}>{p.date}</Link></td>
              <td>{p.exercise + p.diet + p.alcohol}</td>
              <td>{p.notes}</td>
            </tr>
          )}
          </tbody>
        </table>
        <Link to='/'>Home</Link>
      </div>
    );
  }
})