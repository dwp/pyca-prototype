var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
  res.render('index');
});

// Reset session at citizen/agent start
router.get('/:type', function (req, res, next) {
  req.session = null;
  next();
});

// Add new isPartnerFlow variable to all views
router.all('*', function(req, res, next){
  res.locals.isPartnerFlow = typeof req.query.partner !== 'undefined';
  next();
});

// Intercept outcome pages, check for partner
router.all('/:type/outcomes/:outcomeId', function (req, res, next) {
  var type = req.params.type;
  var outcomeId = req.params.outcomeId;
  var isPartnerFlow = res.locals.isPartnerFlow;

  // Save outcome ID
  req.session.outcomeId = outcomeId;

  // No partner or not asked yet
  if (!isPartnerFlow || typeof req.query.partner === 'undefined') {
    res.redirect('/' + type + '/questions/partner');
  }

  next();
});

// Branching for citizens/agents
router.all('/:type/questions/uk-national', function (req, res, next) {
  var type = req.params.type;
  var ukNational = req.body.ukNational;
  var isPartnerFlow = res.locals.isPartnerFlow;

  if (ukNational) {
    req.session.ukNational = ukNational;

    // UK national
    if (ukNational == 'yes') {
      res.redirect('/' + type + '/outcomes/END001' + (isPartnerFlow ? '?partner' : ''));
    }

    // Non-UK national
    else if (ukNational == 'no') {
      res.redirect('/' + type + '/questions/nationality' + (isPartnerFlow ? '?partner' : ''));
    }

    else if (isPartnerFlow && ukNational === 'unknown') {
      res.redirect('/' + type + '/outcomes/END003' + (isPartnerFlow ? '?partner' : ''));
    }
  }

  next();
});

router.all('/:type/questions/nationality', function (req, res, next) {
  var type = req.params.type;
  var nationality = req.body.nationality;
  var isPartnerFlow = res.locals.isPartnerFlow;

  if (nationality) {
    req.session.nationality = nationality;

    // List countries, pull out names
    var listEEA = res.locals.countriesByEEA;
    var listNonEEA = res.locals.countriesByNonEEA;

    // EEA nationality
    if (listEEA.indexOf(nationality) !== -1) {
      req.session.isEEA = true;
      res.redirect('/' + type + '/questions/employee-status' + (isPartnerFlow ? '?partner' : ''));
    }

    // Non-EEA nationality
    else if (listNonEEA.indexOf(nationality) !== -1) {
      req.session.isEEA = false;
      res.redirect('/' + type + '/questions/refugee' + (isPartnerFlow ? '?partner' : ''));
    }
  }

  next();
});

router.all('/:type/questions/employee-status', function (req, res, next) {
  var type = req.params.type;
  var employeeStatus = req.body.employeeStatus;
  var isPartnerFlow = res.locals.isPartnerFlow;

  if (employeeStatus) {
    req.session.employeeStatus = employeeStatus;

    // Employed
    if (employeeStatus.employed === 'true') {
      res.redirect('/' + type + '/outcomes/END002' + (isPartnerFlow ? '?partner' : ''));
    }

    // Self-employed or Not working
    else if (employeeStatus.selfEmployed === 'true' || employeeStatus.dontWork === 'true') {
      res.redirect('/' + type + '/outcomes/END003' + (isPartnerFlow ? '?partner' : ''));
    }
  }

  next();
});

router.all('/:type/questions/refugee', function (req, res, next) {
  var type = req.params.type;
  var refugee = req.body.refugee;
  var isPartnerFlow = res.locals.isPartnerFlow;

  if (refugee) {
    req.session.refugee = refugee;

    // Refugee
    if (refugee === 'yes') {
      res.redirect('/' + type + '/outcomes/END008' + (isPartnerFlow ? '?partner' : ''));
    }

    // Non-refugee
    else if (refugee === 'no') {
      res.redirect('/' + type + '/questions/no-recourse-to-public-funds' + (isPartnerFlow ? '?partner' : ''));
    }

    else if (isPartnerFlow && refugee === 'unknown') {
      res.redirect('/' + type + '/outcomes/END003' + (isPartnerFlow ? '?partner' : ''));
    }
  }

  next();
});

router.all('/:type/questions/partner', function (req, res, next) {
  var type = req.params.type;
  var partner = req.body.partner;
  var outcomeId = req.session.outcomeId;

  console.log(partner);
  console.log(outcomeId);

  if (partner) {
    req.session.partner = partner;

    if (partner === 'yes') {
      res.redirect('/' + type + '/questions/uk-national?partner');
    }

    else if (partner === 'no' && outcomeId) {
      res.redirect('/' + type + '/outcomes/' + outcomeId + '?partner');
    }
  }

  next();
});

router.all('/:type/questions/no-recourse-to-public-funds', function (req, res, next) {
  var type = req.params.type;
  var noRecourseToPublicFunds = req.body.noRecourseToPublicFunds;
  var isPartnerFlow = res.locals.isPartnerFlow;

  if (noRecourseToPublicFunds) {
    req.session.noRecourseToPublicFunds = noRecourseToPublicFunds;

    // Stamped visa
    if (noRecourseToPublicFunds === 'yes') {
      res.redirect('/' + type + '/outcomes/END003' + (isPartnerFlow ? '?partner' : ''));
    }

    // No stamped visa
    else if (noRecourseToPublicFunds === 'no') {
      res.redirect('/' + type + '/outcomes/END009' + (isPartnerFlow ? '?partner' : ''));
    }

    else if (isPartnerFlow && noRecourseToPublicFunds === 'unknown') {
      res.redirect('/' + type + '/outcomes/END003' + (isPartnerFlow ? '?partner' : ''));
    }
  }

  next();
});

module.exports = router;
