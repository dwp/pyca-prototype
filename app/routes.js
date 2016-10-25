var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
  res.render('index');
});

// Reset session at citizen/agent start
router.get('/:type', function (req, res, next) {

  // Session defaults
  req.session = {
    answers: {
      claimant: {},
      partner: {}
    }
  };

  next();
});

// Set up locals/session for all routes
router.all('/:type/*', function(req, res, next) {
  var type = req.params.type;
  var answers = req.session.answers || { claimant: {}, partner: {} };
  var isPartnerFlow = answers.claimant.partner === 'yes';

  // Allow partner override by query string
  if (typeof req.query.partner !== 'undefined') {
    isPartnerFlow = true;
  }

  // Allow claimant override by query string
  if (typeof req.query.claimant !== 'undefined') {
    isPartnerFlow = false;
  }

  // Claimant type suffix
  var claimantType = isPartnerFlow ? 'partner' : 'claimant';

  res.locals.type = type;
  res.locals.isPartnerFlow = isPartnerFlow;
  res.locals.claimantType = claimantType;
  req.session.answers = answers;

  next();
});

// Intercept outcome pages, check for partner
router.all('/:type/outcomes/:outcomeId', function (req, res, next) {
  var type = req.params.type;
  var isPartnerFlow = res.locals.isPartnerFlow;
  var outcomeId = req.params.outcomeId;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  // Save outcome ID
  req.session.outcomeId = outcomeId;

  // No partner or not asked yet
  if (typeof answers.claimant.partner === 'undefined') {
    res.redirect('/' + type + '/questions/partner?claimant');
  }

  // Override this outcome based on partner
  else if (answers.claimant.partner === 'yes') {

    // Redirect END001, END002, END008 or END009 outcomes
    if (outcomeId === 'END001' || outcomeId === 'END002' || outcomeId === 'END008' || outcomeId === 'END009') {

      // Claimant is EEA, self employed
      if (answers.claimant.isEEA && answers.claimant.employeeStatus && (answers.claimant.employeeStatus.selfEmployed === 'true' || answers.claimant.employeeStatus.dontWork === 'true')) {
        res.redirect('/' + type + '/outcomes/END003?' + claimantType);
        return;
      }

      // Claimant is Non-EEA, recourse to public funds
      if (!answers.claimant.isEEA && answers.claimant.noRecourseToPublicFunds === 'yes') {
        res.redirect('/' + type + '/outcomes/END003?' + claimantType);
        return;
      }
    }

    // Redirect END001, END002 or END009 outcomes
    if (outcomeId === 'END001' || outcomeId === 'END002' || outcomeId === 'END009') {

      // Claimant is a refugee
      if (answers.claimant.refugee === 'yes') {
        res.redirect('/' + type + '/outcomes/END008?' + claimantType);
        return;
      }
    }

    // Redirect END001, END008 or END009 outcomes
    if (outcomeId === 'END001' || outcomeId === 'END008' || outcomeId === 'END009') {

      // Claimant is EEA, in work
      if (answers.claimant.isEEA && answers.claimant.employeeStatus && answers.claimant.employeeStatus.employed === 'true') {
        res.redirect('/' + type + '/outcomes/END002?' + claimantType);
        return;
      }
    }

    // Redirect END001, END002 or END008 outcomes
    if (outcomeId === 'END001' || outcomeId === 'END002' || outcomeId === 'END008') {

      // Claimant is Non-EEA, no recourse to public funds
      if (!answers.claimant.isEEA && answers.claimant.noRecourseToPublicFunds === 'no') {
        res.redirect('/' + type + '/outcomes/END009?' + claimantType);
        return;
      }
    }

    // Redirect END002, END008 or END009 outcomes
    if (outcomeId === 'END002' || outcomeId === 'END008' || outcomeId === 'END009') {

      // Claimant is a UK national
      if (answers.claimant.ukNational === 'yes') {
        res.redirect('/' + type + '/outcomes/END001?' + claimantType);
        return;
      }
    }
  }

  next();
});

// Branching for citizens/agents
router.all('/:type/questions/uk-national', function (req, res, next) {
  var type = req.params.type;
  var ukNational = req.body.ukNational;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  if (ukNational) {
    answers[claimantType].ukNational = ukNational;

    // UK national
    if (ukNational == 'yes') {
      answers[claimantType].isEEA = true;
      res.redirect('/' + type + '/outcomes/END001?' + claimantType);
    }

    // Non-UK national
    else if (ukNational == 'no') {
      res.redirect('/' + type + '/questions/nationality?' + claimantType);
    }

    else if (res.locals.isPartnerFlow && ukNational === 'unknown') {
      res.redirect('/' + type + '/outcomes/END003?' + claimantType);
    }
  }

  next();
});

router.all('/:type/questions/nationality', function (req, res, next) {
  var type = req.params.type;
  var nationality = req.body.nationality;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  if (nationality) {
    answers[claimantType].nationality = nationality;

    // List countries, pull out names
    var listEEA = res.locals.countriesByEEA;
    var listNonEEA = res.locals.countriesByNonEEA;

    // EEA nationality
    if (listEEA.indexOf(nationality) !== -1) {
      answers[claimantType].isEEA = true;

      // Croatia straight to outcome
      if (nationality === 'Croatia') {
        res.redirect('/' + type + '/outcomes/END003?' + claimantType);
      }

      // Continue
      res.redirect('/' + type + '/questions/employee-status?' + claimantType);
    }

    // Non-EEA nationality
    else if (listNonEEA.indexOf(nationality) !== -1) {
      answers[claimantType].isEEA = false;
      res.redirect('/' + type + '/questions/refugee?' + claimantType);
    }
  }

  next();
});

router.all('/:type/questions/employee-status', function (req, res, next) {
  var type = req.params.type;
  var employeeStatus = req.body.employeeStatus;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  if (employeeStatus) {
    answers[claimantType].employeeStatus = employeeStatus;

    // Employed
    if (employeeStatus.employed === 'true') {
      res.redirect('/' + type + '/outcomes/END002?' + claimantType);
    }

    // Self-employed or Not working
    else if (employeeStatus.selfEmployed === 'true' || employeeStatus.dontWork === 'true') {
      res.redirect('/' + type + '/outcomes/END003?' + claimantType);
    }
  }

  next();
});

router.all('/:type/questions/refugee', function (req, res, next) {
  var type = req.params.type;
  var refugee = req.body.refugee;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  if (refugee) {
    answers[claimantType].refugee = refugee;

    // Refugee
    if (refugee === 'yes') {
      res.redirect('/' + type + '/outcomes/END008?' + claimantType);
    }

    // Non-refugee
    else if (refugee === 'no') {
      res.redirect('/' + type + '/questions/no-recourse-to-public-funds?' + claimantType);
    }

    else if (res.locals.isPartnerFlow && refugee === 'unknown') {
      res.redirect('/' + type + '/outcomes/END003?' + claimantType);
    }
  }

  next();
});

router.all('/:type/questions/partner', function (req, res, next) {
  var type = req.params.type;
  var partner = req.body.partner;
  var outcomeId = req.session.outcomeId;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  if (partner) {
    answers[claimantType].partner = partner;

    if (partner === 'yes') {
      res.redirect('/' + type + '/questions/uk-national?partner');
    }

    else if (partner === 'no' && outcomeId) {
      res.redirect('/' + type + '/outcomes/' + outcomeId);
    }
  }

  next();
});

router.all('/:type/questions/no-recourse-to-public-funds', function (req, res, next) {
  var type = req.params.type;
  var noRecourseToPublicFunds = req.body.noRecourseToPublicFunds;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  if (noRecourseToPublicFunds) {
    answers[claimantType].noRecourseToPublicFunds = noRecourseToPublicFunds;

    // Stamped visa
    if (noRecourseToPublicFunds === 'yes') {
      res.redirect('/' + type + '/outcomes/END003?' + claimantType);
    }

    // No stamped visa
    else if (noRecourseToPublicFunds === 'no') {
      res.redirect('/' + type + '/outcomes/END009?' + claimantType);
    }

    else if (res.locals.isPartnerFlow && noRecourseToPublicFunds === 'unknown') {
      res.redirect('/' + type + '/outcomes/END003?' + claimantType);
    }
  }

  next();
});

module.exports = router;
