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

router.get('/citizen/wherefrom', function (req, res) {

  // get the answer from the query string (eg. ?over18=false)
  var citizen = req.query.citizen;

  if (citizen == "true"){

    // redirect to the relevant page
    res.redirect("outcomes/UK");

  } else {

    // if over18 is any other value (or is missing) render the page requested
    res.render('citizen/wherefrom');

  }

});

router.get('/citizen/areyouarefugee', function (req, res) {

  // get the answer from the query string (eg. ?over18=false)
  var refugee = req.query.refugee;

  if (refugee == "true"){

    // redirect to the relevant page
    res.redirect("outcomes/refugee");

  } else {

    // if over18 is any other value (or is missing) render the page requested
    res.render('citizen/areyouarefugee');

  }

});

// add your routes here

router.get('/citizen/EEA/job/job', function (req, res) {

  // get the answer from the query string (eg. ?over18=false)
  var job = req.query.job;

  if (job == "false"){

    // redirect to the relevant page
    res.redirect("/citizen/EEA/haveaprevjob");

  } else {

    // if over18 is any other value (or is missing) render the page requested
    res.render('citizen/EEA/job/job');

  }

});

router.get('/citizen/EEA/prevjob', function (req, res) {

  // get the answer from the query string (eg. ?over18=false)
  var prevJob = req.query.prevJob;

  if (prevJob == "false"){

    // redirect to the relevant page
    res.redirect("/citizen/EEA/fiveYears");

  } else {

    // if over18 is any other value (or is missing) render the page requested
    res.render('citizen/EEA/nojob/prevjob');

  }

});

router.get('/citizen/EEA/nojob/family', function (req, res) {

  // get the answer from the query string (eg. ?over18=false)
  var naturalised = req.query.naturalised;

  if (naturalised == "true"){

    // redirect to the relevant page
    res.redirect("/citizen/outcomes/naturalised");

  } else {

    // if over18 is any other value (or is missing) render the page requested
    res.render('citizen/EEA/nojob/family');

  }

});

module.exports = router;
