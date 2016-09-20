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

// Branching for citizens/agents

router.all('/:type/questions/uk-national', function (req, res, next) {
  var type = req.params.type;
  var ukNational = req.body.ukNational;

  if (ukNational) {
    req.session.ukNational = ukNational;

    // UK national
    if (ukNational == 'yes') {
      res.redirect('/' + type + '/outcomes/END001');
    }

    // Non-UK national
    else if (ukNational == 'no') {
      res.redirect('/' + type + '/questions/nationality');
    }
  }

  next();
});

router.all('/:type/questions/nationality', function (req, res, next) {
  var type = req.params.type;
  var nationality = req.body.nationality;

  if (nationality) {
    req.session.nationality = nationality;

    // List countries, pull out names
    var listEEA = res.locals.countriesByEEA;
    var listNonEEA = res.locals.countriesByNonEEA;

    // EEA nationality
    if (listEEA.indexOf(nationality) !== -1) {
      req.session.isEEA = true;
      res.redirect('/' + type + '/questions/employee-status');
    }

    // Non-EEA nationality
    else if (listNonEEA.indexOf(nationality) !== -1) {
      req.session.isEEA = false;
      res.redirect('/' + type + '/questions/refugee');
    }
  }

  next();
});

router.all('/:type/questions/employee-status', function (req, res, next) {
  var type = req.params.type;
  var employeeStatus = req.body.employeeStatus;

  if (employeeStatus) {
    req.session.employeeStatus = employeeStatus;

    // Employed
    if (employeeStatus.employed === 'true') {
      res.redirect('/' + type + '/outcomes/END002');
    }

    // Self-employed or Not working
    else if (employeeStatus.selfEmployed === 'true' || employeeStatus.dontWork === 'true') {
      res.redirect('/' + type + '/outcomes/END003');
    }
  }

  next();
});

router.all('/:type/questions/refugee', function (req, res, next) {
  var type = req.params.type;
  var refugee = req.body.refugee;

  if (refugee) {
    req.session.refugee = refugee;

    // Refugee
    if (refugee === 'yes') {
      res.redirect('/' + type + '/outcomes/END008');
    }

    // Non-refugee
    else if (refugee === 'no') {
      res.redirect('/' + type + '/questions/no-recourse-to-public-funds');
    }
  }

  next();
});

router.all('/:type/questions/no-recourse-to-public-funds', function (req, res, next) {
  var type = req.params.type;
  var noRecourseToPublicFunds = req.body.noRecourseToPublicFunds;

  if (noRecourseToPublicFunds) {
    req.session.noRecourseToPublicFunds = noRecourseToPublicFunds;

    // Stamped visa
    if (noRecourseToPublicFunds === 'yes') {
      res.redirect('/' + type + '/outcomes/END003');
    }

    // No stamped visa
    else if (noRecourseToPublicFunds === 'no') {
      res.redirect('/' + type + '/outcomes/END009');
    }
  }

  next();
});

module.exports = router;
