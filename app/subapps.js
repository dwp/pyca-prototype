'use strict'

const path = require('path')
const express = require('express')
const router = express.Router()
const app = express()
const glob = require('globby')
const _ = require('lodash')
const appsDir = 'apps'
const baseSubAppPath = `${__dirname}/views/`
const sentenceCase = require('sentence-case')
let subApps = new Array()

/**
 * assembles an object from a given path of a routes file
 * @method getSubAppData
 * @param  {string}       path the system path of the routes file passed in
 * @return {object}            data derrived from the routes file and it's path
 */
let getSubAppData = function(currentPath) {

	let splitPathArray = currentPath.split('/')

	// this takes the file path and returns the relative path to it
	// within the prototyping kit
  let computedPath = _.join(
			_.slice(
				splitPathArray, (
					_.indexOf(splitPathArray, 'views') +1
				)
			),
		'/'
	);

	// gets the sub directory name
	let appDirName = computedPath.split('/')[1]

  let appRelativePath = `${appsDir}/${appDirName}`

	// the 'absolute' path of the app e.g '/apps/version-1/'
	let appAbsolutePath = `/${appsDir}/${appDirName}`

	// the 'absolute' path of the app view directory e.g '/apps/version-1/views/'
	let appRouteString = `${appAbsolutePath}/views`
	// the title based on the app's directory/folder name. Set to be sentance-case
	let title = sentenceCase(appDirName)
	let titleSlug = title.replace(/\s+/g, '-').toLowerCase()

	// returns and object of data derrived from the subapp path that was passed in
  return {

		// a formatted string for the title of the subapp
		title: title,

		// the directory name for the subapp
    appDirName: appDirName,

		// a string used to give the app a unique body class
		body_class: title.replace(/\s+/g, '-').toLowerCase(),
		slug: titleSlug,
    startURL: `${appAbsolutePath}/views/index`,

		// url paths constructed from the passed in subapp path
		urlPaths: {
			appRoot: appAbsolutePath,
      root: `${appAbsolutePath}/views`,
			assetsPath: `${appAbsolutePath}/assets/`,
			scriptsPath: `${appAbsolutePath}/assets/javascripts/`,
			stylesPath: `${appAbsolutePath}/assets/sass/`,
			imagesPath: `${appAbsolutePath}/assets/images/`
		},

		// file paths, to be used primarily by nunjucks for rendering layouts,
		// accessing routes, etc.
		filePaths: {
			routesFile: computedPath,
			subAppDir: path.dirname(computedPath),
			layoutsDir: `${path.dirname(computedPath)}/layouts/`,
			includesDir: `${path.dirname(computedPath)}/includes/`,
			coreLayoutsDirPathRel: path.relative(path.dirname(currentPath + '/layouts/'), `${__dirname}/views/layouts/`),
			configFile: `${path.dirname(computedPath)}/config.js`,
			dataFile: `${path.dirname(computedPath)}/data.js`
		},

		// route strings
		route: {
			root: appRouteString,
			rootRel: appRouteString.substr(1),
			page: appRouteString + '/:page'
		}


  }

}

/**
 * this route is a fudge to be able to serve the assets without editing the
 * gov.uk prototying kit's server.js file to specifically serve the usuaul way
 *  using static middleware.
 */
router.get('/apps/:subapp*/assets/:type/:file*', function(req, res){
	let requestedFile = `${__dirname}/views/apps/${req.params.subapp}/assets/${req.params.type}/${req.params.file}`
  // Don't let them peek at /etc/passwd
  if (req.params.file.indexOf('..') === -1) {
    return res.sendFile(requestedFile)
  } else {
    res.status = 404
    return res.send('Not Found')
  }
})

/**
 * loop over the sub 'routes' files and add them to the overall router
 */
glob.sync(baseSubAppPath + appsDir + '/**/*-routes.js').forEach(function(currentPath, index){

	// get some data based on the current subapp path
	let appData = getSubAppData(currentPath)

	// add specific subApp config (can override some of app/config)
	appData.config = require(`${baseSubAppPath + appData.filePaths.configFile}`)
	appData.data = require(`${baseSubAppPath + appData.filePaths.dataFile}`)

	// push that to a collection of all the subapps
	subApps.push(appData)

	let subRoutes = [
    appData.urlPaths.appRoot,
    `${appData.urlPaths.appRoot}/:page`,
    `${appData.urlPaths.appRoot}/views/:page*`,
    `${appData.urlPaths.appRoot}/views/**/:page*`
  ]

	// grabs the subnavigation from data.js for a subsection if the key is found
	// within subnavs object. Sets it within the 'currentApp' object eventually
	// passed to the context
	router.all(`${appData.urlPaths.appRoot}/views/:subsection/*`, (req,res,next) => {
		let thisSubSection = req.params.subsection
		if (thisSubSection in appData.data.subnavs) {
			_.merge(appData, {
				subnav: appData.data.subnavs[thisSubSection]
			})
		}
		next()
	})

	// do the following things when clicking 'start' button in a subapplicaiton
	router.all(`${appData.urlPaths.appRoot}/views/start`, function(req, res, next){

		if(req.query.page) {

			let iteration = req.query.iteration ? `&iteration=${req.query.iteration}` : ``

      // build a url to redirect to
      let redirectionURL = `${appData.urlPaths.appRoot}/views/${req.query.page}${iteration}`

      // if we have a session then destroy it
			if(req.session) {

        console.log(`Current session looks like:`);
        console.log(req.session);

				req.session.destroy()
				console.log(`Destroyed session for ${appData.slug}`);

        console.log(`Current session after destroy looks like:`);
        console.log(req.session);

			}

			console.log(`Redirecting to ${redirectionURL}`);
			return res.redirect(`${redirectionURL}`)

		} else {
			return res.send('You need to pass a start page URL path in the query string')
		}

    next()

	})

	router.all(subRoutes, function(req,res,next){

	  if (!req.session[appData.slug]){
	    req.session[appData.slug] = {};
	  }

	  for (var i in req.body){
	    // any input where the name starts with _ is ignored
	    if (i.indexOf("_") != 0){
	      req.session[appData.slug][i] = req.body[i];
	    }
	  }

    appData.session = req.session[appData.slug]
		appData.query = req.query

	  _.merge(res.locals, {
      session: req.session,
	    currentApp: appData,
			postData: (req.body ? req.body : false)
	  }, appData.config.overrides)

		next();

	})

	// require the current subapp's routes file passing the overall app router
	// and the subapp's data object
	require(currentPath)(router, appData)

	// if the user hits the root of the subapp's views, then redirect to the
	// index page
	router.all(appData.route.root, function(req,res,next){
		return res.redirect('index')
	});

});

// Route index page including the collection of apps in the context
router.get('/', function (req, res, next) {
	console.log('using this');
  // remove 'live version from the list' we will link to that directly.
  res.locals.apps = subApps.filter(item => item.slug !== 'live');
  res.render('index')
  next()
})

module.exports = router
