var express = require('express')
var router = express.Router()
var path = require('path')
var locationServiceV1 = require('./services/location-v1')
var locationServiceV2 = require('./services/location-v2')
var locationServiceV3 = require('./services/location-v3')
var demoLocationService = require('./services/demo-location-v1')
var config = require(path.join(__dirname + '/config.js'))

// include sub-application routing if enabled in the configuration file
if (config.useSubapplications) router.use('/', require(path.join(__dirname + '/subapps.js')))

// Route index page
router.get('/', function (req, res) {
  res.render('index')
})

router.get('/country-picker', function (req, res) {
  var locale = 'en-GB'

  res.render('location-picker/index', {
    html_lang: 'en',
    graph: locationServiceV3.locationGraph,
    locations: locationServiceV3.canonicalLocationList(locale),
    reverseMap: locationServiceV3.locationReverseMap(locale),
    locale: locale
  })
})

module.exports = router
