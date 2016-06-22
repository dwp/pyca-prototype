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

router.get('/areyourefugee', function (req, res) {

  // get the answer from the query string (eg. ?over18=false)
  var citizen = req.query.citizen;

  if (citizen == "true"){

    // redirect to the relevant page
    res.redirect("UK");

  } else {

    // if over18 is any other value (or is missing) render the page requested
    res.render('areyourefugee');

  }

});

router.get('/whereFrom', function (req, res) {

  // get the answer from the query string (eg. ?over18=false)
  var refugee = req.query.refugee;

  if (refugee == "true"){

    // redirect to the relevant page
    res.redirect("refugee");

  } else {

    // if over18 is any other value (or is missing) render the page requested
    res.render('whereFrom');

  }

});

// add your routes here

router.get('/EEA/job/job', function (req, res) {

  // get the answer from the query string (eg. ?over18=false)
  var job = req.query.job;

  if (job == "false"){

    // redirect to the relevant page
    res.redirect("/EEA/nojob/nojob");

  } else {

    // if over18 is any other value (or is missing) render the page requested
    res.render('EEA/job/job');

  }

});

router.get('/EEA/noJob/prevjob', function (req, res) {

  // get the answer from the query string (eg. ?over18=false)
  var prevJob = req.query.prevJob;

  if (prevJob == "false"){

    // redirect to the relevant page
    res.redirect("/EEA/fiveYears");

  } else {

    // if over18 is any other value (or is missing) render the page requested
    res.render('EEA/noJob/prevjob');

  }

});

router.get('/EEA/noJob/family', function (req, res) {

  // get the answer from the query string (eg. ?over18=false)
  var naturalised = req.query.naturalised;

  if (naturalised == "true"){

    // redirect to the relevant page
    res.redirect("/EEA/naturalised");

  } else {

    // if over18 is any other value (or is missing) render the page requested
    res.render('EEA/noJob/family');

  }

});

module.exports = router;
