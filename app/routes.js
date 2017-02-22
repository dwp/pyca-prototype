var express = require('express')
var router = express.Router()
var path = require('path')
var config = require(path.join(__dirname + '/config.js'))

// include sub-application routing if enabled in the configuration file
if (config.useSubapplications) router.use('/', require(path.join(__dirname + '/subapps.js')))

// Route index page
router.get('/', function (req, res) {
  res.render('index')
})

module.exports = router
