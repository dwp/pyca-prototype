const _ = require('lodash')
const thisAppData = require(__dirname + '/data.js')

/**
 * routes function for this particular 'subapp'
 * @method exports
 * @param  {object} router prototyping kit's routes app
 * @param  {object} config object of data for this particular subapp
 * @return {updated router}        express router
 */
module.exports = function(router, config) {
  
	// example of a route will be used on all pages within the subapp's views 
  router.all([config.route.page, config.route.root + '**/*'], function(req,res,next){
		
		_.merge(res.locals,{
			postData: (req.body ? req.body : false),
			session: req.session,
			currentApp: {
				data: thisAppData
			}
		})
		
    next()
  
  });
	
	// you can write a route for specific pages/directories using the
	// config.route.root property. 
	// For example if you subapplication / version is in a directory 
	// called 'sprint1' then the output would be
	// /apps/sprint1/views/index
	router.all(config.route.root + 'index', function(req,res,next){
		next()
	})
  
	// handles the user login
	router.all(config.route.root + 'login', function(req,res,next){
		
		let postData = (req.body ? req.body : false)
		
		if(postData.username == 'paul.smith40@dwp.gsi.gov.uk') {
			console.log('Found the user!');
		}
		
		// redirect from login to this page
    return res.redirect('work-list')
		
		next()
	})
  
	// grabs the subnavigation from data.js for a subsection if the key is Found
	// within subnavs object and sets within the 'currentApp' object passed to 
	// context
	router.all(config.route.root + ':subsection/*', function(req,res,next){
		
		let thisSubSection = req.params.subsection
		
		if (thisSubSection in thisAppData.subnavs) {
			_.merge(res.locals.currentApp, {
				subnav: thisAppData.subnavs[thisSubSection]
			})
		}
		
		next()
    
	})
  
	router.all(config.route.root + 'activity/:page*', function(req,res,next){
		
    let postData = (req.body ? req.body : false)
		let page = req.params.page
    
		if(page == 'interview_route') {
			
	    if(postData.interview_type == "office") {
				return res.redirect('interview-office')
			} else {
				return res.redirect('interview-phone')
			}
			
		}
		
		if(page == 'interview-security-check') {
			
			if(postData['interview-paid-into'].toLowerCase() == 'hsbc') {
				return res.redirect('interview-record')
			} else {
				return res.redirect('interview-security-notice')
			}
			
		}
		
		next()
    
	})

  return router
	
}