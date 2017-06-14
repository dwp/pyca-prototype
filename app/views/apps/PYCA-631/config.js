// Use this file to change subapp configuration.
module.exports = {
	
	// properties in here will override those in that affect the templates
	// with in the global config file (app/config.js)
	overrides: {
	
	  // Service name used in header. Eg: 'Renew your passport'
	  // serviceName: 'Renew your passport'

	  // Cookie warning - update link to service's cookie page.
	  // cookieText: 'GOV.UK uses cookies to make the site simpler. <a href="#" title="Find out more about cookies">Find out more about cookies</a>'
		
	},
	
	// changes the default css file name for the this sub-application
	// you will need to rename the file as well.
	// file is located: app/views/apps/[SUB APPLICATION DIR]/assets/sass/
	cssFile: 'sub-application.css',
	
	// changes the default javascript file name for the this sub-application 
	// sub-application but you will need to rename the file as well.
	// file is located: app/views/apps/[SUB APPLICATION DIR]/assets/javascripts/
	jsFile: 'sub-application.js'
	
}
