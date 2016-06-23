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

// Branching for citizens

router.get('/citizen/wherefrom', function (req, res) {
  var citizen = req.query.citizen;
  if (citizen == "true"){
    // redirect to the relevant page
    res.redirect("outcomes/UK");
  } else {
    res.render('citizen/wherefrom');
  }
});

router.get('/citizen/EEA/haveaprevjob', function (req, res) {
  var job = req.query.job;
  if (job == "true"){
    // redirect to the relevant page
    res.redirect("/citizen/outcomes/EEAjob");
  } else {
    res.render('citizen/EEA/haveaprevjob');
  }

});

router.get('/citizen/EEA/prevjob', function (req, res) {
  var prevJob = req.query.prevJob;
  if (prevJob == "false"){
    // redirect to the relevant page
    res.redirect("/citizen/EEA/fiveYears");
  } else {
    res.render('citizen/EEA/nojob/prevjob');
  }

});

router.get('/citizen/EEA/nojob/family', function (req, res) {
  var naturalised = req.query.naturalised;
  if (naturalised == "true"){
    // redirect to the relevant page
    res.redirect("/citizen/outcomes/naturalised");
  } else {
    res.render('citizen/EEA/nojob/family');
  }

});

// non-EEA citizens

router.get('/citizen/nonEEA/visa', function (req, res) {
  var refugee = req.query.refugee;
  if (refugee == "true"){
    // redirect to the relevant page
    res.redirect("/citizen/outcomes/refugee");
  } else {
    res.render('citizen/nonEEA/visa');
  }

});


router.get('/citizen/nonEEA/married', function (req, res) {
  var visa = req.query.visa;
  if (visa == "true"){
    // redirect to the relevant page
    res.redirect("/citizen/outcomes/visa");
  } else {
    res.render('citizen/nonEEA/married');
  }

});

router.get('/citizen/nonEEA/partner', function (req, res) {
  var married = req.query.married;
  if (married == "true"){
    // redirect to the relevant page
    res.redirect("/citizen/outcomes/EEAmarried");
  } else {
    res.render('citizen/nonEEA/partner');
  }

});

router.get('/citizen/outcomes/noteligible', function (req, res) {
  var partner = req.query.partner;
  if (partner == "true"){
    // redirect to the relevant page
    res.redirect("/citizen/outcomes/EEApartner");
  } else {
    res.render('citizen/outcomes/noteligible');
  }

});

// Branching for agents

router.get('/agent/wherefrom', function (req, res) {
  var citizen = req.query.citizen;
  if (citizen == "true"){
    // redirect to the relevant page
    res.redirect("outcomes/UK");
  } else {
    res.render('agent/wherefrom');
  }
});

router.get('/agent/EEA/haveaprevjob', function (req, res) {
  var job = req.query.job;
  if (job == "true"){
    // redirect to the relevant page
    res.redirect("/agent/outcomes/EEAjob");
  } else {
    res.render('agent/EEA/haveaprevjob');
  }

});

router.get('/agent/EEA/prevjob', function (req, res) {
  var prevJob = req.query.prevJob;
  if (prevJob == "false"){
    // redirect to the relevant page
    res.redirect("/agent/EEA/fiveYears");
  } else {
    res.render('agent/EEA/nojob/prevjob');
  }

});

router.get('/agent/EEA/nojob/family', function (req, res) {
  var naturalised = req.query.naturalised;
  if (naturalised == "true"){
    // redirect to the relevant page
    res.redirect("/agent/outcomes/naturalised");
  } else {
    res.render('agent/EEA/nojob/family');
  }

});

// non-EEA citizens

router.get('/agent/nonEEA/visa', function (req, res) {
  var refugee = req.query.refugee;
  if (refugee == "true"){
    // redirect to the relevant page
    res.redirect("/agent/outcomes/refugee");
  } else {
    res.render('agent/nonEEA/visa');
  }

});


router.get('/agent/nonEEA/married', function (req, res) {
  var visa = req.query.visa;
  if (visa == "true"){
    // redirect to the relevant page
    res.redirect("/agent/outcomes/visa");
  } else {
    res.render('agent/nonEEA/married');
  }

});

router.get('/agent/nonEEA/partner', function (req, res) {
  var married = req.query.married;
  if (married == "true"){
    // redirect to the relevant page
    res.redirect("/agent/outcomes/EEAmarried");
  } else {
    res.render('agent/nonEEA/partner');
  }

});

router.get('/agent/outcomes/noteligible', function (req, res) {
  var partner = req.query.partner;
  if (partner == "true"){
    // redirect to the relevant page
    res.redirect("/agent/outcomes/EEApartner");
  } else {
    res.render('agent/outcomes/noteligible');
  }

});

module.exports = router;
