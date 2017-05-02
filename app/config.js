// Use this file to change prototype configuration.

// Note: prototype config can be overridden using environment variables (eg on heroku)

module.exports = {
  // Service name used in header. Eg: 'Renew your passport'
  serviceName: 'Prove you can apply for benefits in the UK',

  // Default port that prototype runs on
  port: '3000',

  // Enable or disable password protection on production
  useAuth: 'true',

  // Automatically stores form data, and send to all views
  useAutoStoreData: 'true',

  // Enable or disable built-in docs and examples.
  useDocumentation: 'true',

  // Force HTTP to redirect to HTTPs on production
  useHttps: 'false',

  // Cookie warning - update link to service's cookie page.
  cookieText: 'This service uses cookies to make the site simpler. <a href="/help/cookies" title="Find out more about cookies">Find out more about cookies</a>',

  // use the routing for sub applications within app
  useSubapplications: true,

  // Enable or disable Browser Sync
  useBrowserSync: 'true'

}
