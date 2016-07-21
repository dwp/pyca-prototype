var express = require('express');
var router = express.Router();

// List of EEA countries
var countries = {
  EEA: [
    'Austria',
    'Belgium',
    'Bulgaria',
    'Croatia',
    'Czech Republic',
    'Denmark',
    'Estonia',
    'Finland',
    'France',
    'Germany',
    'Greece',
    'Hungary',
    'Iceland',
    'Ireland',
    'Italy',
    'Latvia',
    'Liechtenstein',
    'Lithuania',
    'Luxembourg',
    'Malta',
    'Netherlands',
    'Norway',
    'Poland',
    'Portugal',
    'Republic of Cyprus',
    'Romania',
    'Slovakia',
    'Slovenia',
    'Spain',
    'Sweden',
    'United Kingdom'
  ]
};

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
  var selfemployed = req.query.selfemployed;
  var employed = req.query.employed;
  if (selfemployed == "true"){
    res.redirect("/citizen/EEA/selfemppartner");
  } else if (employed == "true"){
    // redirect to the relevant page
    res.redirect("/citizen/EEA/employedpartner");
  } else {
    res.render('citizen/EEA/haveaprevjob');
  }

});
router.get('/citizen/EEA/nojob/liveincta', function (req, res) {
  var emppartner = req.query.emppartner;
  var partner = req.query.partner;
  if (emppartner == "false"){
    // redirect to the relevant page
    res.redirect("/citizen/outcomes/EEAnointerview");
  } else if (emppartner == "true") {
    res.redirect("/citizen/outcomes/EEAjob");
  } else if (partner == "true") {
    res.redirect("/citizen/outcomes/EEApartner");
  } else {
    res.render('citizen/EEA/nojob/liveincta');
  }

});

router.get('/citizen/EEA/nojob/partner', function (req, res) {
  var prevJob = req.query.prevJob;
  if (prevJob == "redundant" || prevJob == "ill"){
    // redirect to the relevant page
    res.redirect("/citizen/outcomes/EEAprevjob");
  }
   else {
    res.render('citizen/EEA/nojob/partner');
  }

});

router.get('/citizen/EEA/nojob/family', function (req, res) {
  var cta = req.query.cta;
  if (cta == "true"){
    // redirect to the relevant page
    res.redirect("/citizen/outcomes/cta");
  } else {
    res.render('citizen/EEA/nojob/family');
  }

});

router.get('/citizen/EEA/nojob/fiveyears', function (req, res) {
  var family = req.query.family;
  if (family == "false"){
    // redirect to the relevant page
    res.render("citizen/EEA/nojob/fiveyears");
  } else {
    res.redirect('/citizen/outcomes/complicated');
  }

});
router.get('/citizen/outcomes/complicated', function (req, res) {
  var schoolUK = req.query.schoolUK;
  if (schoolUK == "false"){
    // redirect to the relevant page
    res.redirect("/citizen/outcomes/noteligible");
  } else {
    res.render('citizen/outcomes/complicated');
  }

});
router.get('/citizen/EEA/nojob/children', function (req, res) {
  var naturalised = req.query.naturalised;
  if (naturalised == "true"){
    // redirect to the relevant page
    res.redirect('/citizen/outcomes/naturalised');
  } else {
    res.render('citizen/EEA/nojob/children');
  }

});
router.get('/citizen/outcomes/EEAselfemp', function (req, res) {
  var partner = req.query.partner;
  if (partner == "true"){
    // redirect to the relevant page
    res.redirect('/citizen/outcomes/EEAselfemppartner');
  } else {
    res.render('citizen/outcomes/EEAselfemp');
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

router.get('/citizen/nonEEA/partner', function (req, res) {
  var visa = req.query.visa;
  if (visa == "true"){
    // redirect to the relevant page
    res.redirect("/citizen/outcomes/visa");
  } else {
    res.render('citizen/nonEEA/partner');
  }

});

router.get('/citizen/outcomes/noteligible', function (req, res) {
  var partner = req.query.partner;
  var nationality = req.query.nationality;
  if (partner == "true" && countries.EEA.indexOf(nationality) !== -1){
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
  var selfemployed = req.query.selfemployed;
  var employed = req.query.employed;
  if (selfemployed == "true"){
    res.redirect("/agent/EEA/partner");
  } else if (employed == "true"){
    // redirect to the relevant page
    res.redirect("/agent/EEA/employedpartner");
  } else {
    res.render('agent/EEA/haveaprevjob');
  }

});
router.get('/agent/EEA/liveincta', function (req, res) {
  var emppartner = req.query.emppartner;
  var partner = req.query.partner;
  if (emppartner == "false"){
    // redirect to the relevant page
    res.redirect("/agent/outcomes/EEAnointerview");
  } else if (partner == "true") {
    res.redirect("/agent/outcomes/EEApartner");
  } else {
    res.render('agent/EEA/liveincta');
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

router.get('/agent/EEA/fiveyears', function (req, res) {
  var prevJob = req.query.prevJob;
  if (prevJob == "true"){
    // redirect to the relevant page
    res.redirect("/agent/outcomes/EEAprevjob");
  } else {
    res.render('agent/EEA/fiveyears');
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

router.get('/agent/nonEEA/partner', function (req, res) {
  var visa = req.query.visa;
  if (visa == "true"){
    // redirect to the relevant page
    res.redirect("/agent/outcomes/visa");
  } else {
    res.render('agent/nonEEA/partner');
  }

});

router.get('/agent/outcomes/noteligible', function (req, res) {
  var partner = req.query.partner;
  var nationality = req.query.nationality;
  if (partner == "true" && countries.EEA.indexOf(nationality) !== -1){
    // redirect to the relevant page
    res.redirect("/agent/outcomes/EEApartner");
  } else {
    res.render('agent/outcomes/noteligible');
  }

});

module.exports = router;
