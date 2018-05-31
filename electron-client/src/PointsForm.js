import React, { Component } from 'react';
import { withAuth } from '@okta/okta-react';
import { ApolloClient } from 'apollo-client';
import { Link } from 'react-router-dom';
import gql from 'graphql-tag';
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';

import httpLink from './Points';

export default withAuth(class PointsForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      points: {}
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async componentDidMount() {
    const id = this.props.match.params.id;
    if (id !== 'new') {
      const authLink = setContext(async (_, {headers}) => {
        const token = await this.props.auth.getAccessToken();
        return {
          headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : ''
          }
        }
      });

      const client = new ApolloClient({
        link: authLink.concat(httpLink),
        cache: new InMemoryCache()
      });

      client.query({
        query: gql`{
            query GetPoints(id: Int) {
                pointsGet(id: $id) {
                    date,
                    alcohol,
                    exercise,
                    diet,
                    notes
                }
            }
        }
        `,
        variables: {id: id}
      })
      .then(result => {
        console.log(result);
        this.setState({points: result.data.points});
      });
    } else {
      console.log('new!');
    }
  }

  handleChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({[name]: value});
  }

  handleSubmit(event) {
    alert('The form was submitted: ' + this.state);
    event.preventDefault();
  }

  render() {
    return (<h1>Hello {this.props.match.params.id} <Link to='/points'>Cancel</Link></h1>);
      {/*<form onSubmit={this.handleSubmit}>
        <label>
          Date
          <input type="date" value={this.state.points.date} onChange={this.handleChange}/>
        </label>
        <label>
          <input type="checkbox" value={this.state.points.exercise} onChange={this.handleChange}/>
          Did you exercise?
        </label>
        <label>
          <input type="checkbox" value={this.state.points.diet} onChange={this.handleChange}/>
          Did you eat well?
        </label>
        <label>
          <input type="checkbox" value={this.state.points.alcohol} onChange={this.handleChange}/>
          Did you drink responsibly?
        </label>
        <label>
          Notes
          <textarea value={this.state.points.notes} onChange={this.handleChange}/>
        </label>
        <input type="submit" value="Submit"/>
      </form>*/}
  }
})