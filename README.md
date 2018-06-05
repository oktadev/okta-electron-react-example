# Okta Example with Electron, React, and GraphQL.

This is an attempt to develop an app that runs in [Electron](https://electronjs.org/) and authenticates with [Okta](https://developer.okta.com).

After getting the Sign-In Widget working and the app developed, I ran into [AuthSdkError: Unable to parse a token from the url](https://github.com/okta/okta-oidc-js/issues/121#issuecomment-394123880). It seems the postMessage logic that the Sign-In Widget uses doesn't work in Electron.

Then I tried the code in this Gist: [PKCE flow in Electron](https://gist.github.com/adeperio/73ce6680d4b80b45e624ab62bacfbdca). I got it mostly working, but after posting the code, Okta does a redirect and Electron says its invalid.

The last thing I tried is [AppAuth-JS Electron sample](https://github.com/googlesamples/appauth-js-electron-sample). I got this working with Okta and PKCE, but ran into [an issue](https://github.com/openid/AppAuth-JS/issues/60) when I tried to port it back to this project.