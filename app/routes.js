var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
  
  res.render('index');

});


// Example routes - feel free to delete these

// Passing data into a page

router.get('/examples/template-data', function (req, res) {

  res.render('examples/template-data', { 'name' : 'Foo' });

});

// Branching

router.get('/whereFrom', function (req, res) {

  // get the answer from the query string (eg. ?over18=false)
  var citizen = req.query.citizen;

  if (citizen == "true"){

    // redirect to the relevant page
    res.redirect("whereFromUK");

  } else {

    // if over18 is any other value (or is missing) render the page requested
    res.render('whereFrom');

  }

});

// add your routes here

router.get('/EEAjob', function (req, res) {

  // get the answer from the query string (eg. ?over18=false)
  var job = req.query.job;

  if (job == "false"){

    // redirect to the relevant page
    res.redirect("EEAnojob");

  } else {

    // if over18 is any other value (or is missing) render the page requested
    res.render('EEAjob');

  }

});

module.exports = router;
