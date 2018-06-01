import { bootstrap } from 'vesper';
import { PointsController } from './controller/PointsController';
import { Points } from './entity/Points';
import { createConnection, getManager } from 'typeorm';
import { User } from './entity/User';
import { GraphQLDate, GraphQLTime, GraphQLDateTime } from 'graphql-iso-date';
import * as OktaJwtVerifier from '@okta/jwt-verifier';
import { CurrentUser } from './CurrentUser';

const oktaJwtVerifier = new OktaJwtVerifier({
  clientId: '0oaf8zw7lslnzoJia0h7',
  issuer: 'https://dev-669532.oktapreview.com/oauth2/default'
});

bootstrap({
  port: 4000,
  controllers: [
    PointsController
  ],
  entities: [
    Points,
    User
  ],
  schemas: [
    __dirname + '/schema/**/*.graphql'
  ],
  // https://github.com/vesper-framework/vesper/issues/4
  customResolvers: {
    Date: GraphQLDate,
    Time: GraphQLTime,
    DateTime: GraphQLDateTime,
  },
  /*setupContainer: async (container, action) => {
    const request = action.request; // user request, you can get http headers from it
    // require every request to have an authorization header
    if (!request.headers.authorization) {
      throw Error('Authorization header is required');
    }
    let parts = request.headers.authorization.trim().split(' ');
    let accessToken = parts.pop();
    await oktaJwtVerifier.verifyAccessToken(accessToken)
      .then(async jwt => {
        const currentUser = new CurrentUser(jwt.claims.uid, jwt.claims.sub);
        container.set(CurrentUser, currentUser);
      })
      .catch(error => {
        throw Error('JWT Validation failed!');
      })
  },*/
  cors: true
}).then(() => {
  console.log('Your app is up and running on http://localhost:4000. ' +
    'You can use playground in development mode on http://localhost:4000/playground');

}).catch(error => {
  console.error(error.stack ? error.stack : error);
});
