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

    // Employed or Self-employed
    if (employeeStatus.employed === 'true' || employeeStatus.selfEmployed === 'true') {
      res.redirect('/' + type + '/questions/partner');
    }

    // Not working
    else if (employeeStatus.dontWork === 'true') {
      res.redirect('/' + type + '/questions/reason-out-of-work');
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

router.all('/:type/questions/partner', function (req, res, next) {
  var type = req.params.type;
  var partner = req.body.partner;
  var partnerNationality = req.body.partnerNationality;
  var partnerJobUk = req.body.partnerJobUk;

  // List countries, pull out names
  var listEEA = res.locals.countriesByEEA;
  var listNonEEA = res.locals.countriesByNonEEA;

  // From session (previously answered)
  var reasonOutOfWork = req.session.reasonOutOfWork;
  var employeeStatus = req.session.employeeStatus;
  var noRecourseToPublicFunds = req.session.noRecourseToPublicFunds;

  if (partner) {
    req.session.partner = partner;
    req.session.partnerJobUk = partnerJobUk;
    req.session.partnerNationality = partnerNationality;
    req.session.isPartnerEEA = listEEA.indexOf(partnerNationality) !== -1;
    req.session.isPartnerNonEEA = listNonEEA.indexOf(partnerNationality) !== -1;

    // In work
    if ((!employeeStatus || !reasonOutOfWork) && !noRecourseToPublicFunds) {

      // Partner
      if (partner === 'yes') {
        res.redirect('/' + type + '/outcomes/END011');
      }

      // No partner
      else if (partner === 'no') {
        res.redirect('/' + type + '/outcomes/END002');
      }
    }

    // Out of work
    else if (employeeStatus && reasonOutOfWork) {

      // Redundant or Injured
      if (employeeStatus.dontWork === 'true' && (reasonOutOfWork === 'neverWorked' || reasonOutOfWork === 'fired')) {

        console.log('isEEA?', req.session.isEEA);
        console.log('Partner?', partner);
        console.log('partnerNationality', partnerNationality);
        console.log('isPartnerEEA?', req.session.isPartnerEEA);
        console.log('partnerJobUk?', partnerJobUk);

        // Partner and non-empty partner info
        if (partner === 'yes' && partnerNationality && partnerJobUk) {

          // EEA national, EEA partner and partner works in UK
          if (req.session.isEEA && req.session.isPartnerEEA && partnerJobUk === 'yes') {
            res.redirect('/' + type + '/outcomes/END003');
          }

          // Otherwise same as no partner
          else {
            res.redirect('/' + type + '/questions/lived-in-british-isles');
          }
        }

        // No partner
        else if (partner === 'no') {
          res.redirect('/' + type + '/questions/lived-in-british-isles');
        }
      }
    }

    // Stamped visa
    else if (noRecourseToPublicFunds === 'yes') {

      // Partner and EEA nationality
      if (partner === 'yes' && req.session.isPartnerEEA) {
        res.redirect('/' + type + '/outcomes/END003');
      }

      // No partner or non-EEA nationality
      else if (partner === 'no' || req.session.isPartnerNonEEA) {
        res.redirect('/' + type + '/questions/family-member-financial-support');
      }
    }
  }

  next();
});

router.all('/:type/questions/reason-out-of-work', function (req, res, next) {
  var type = req.params.type;
  var reasonOutOfWork = req.body.reasonOutOfWork;

  // From session (previously answered)
  var partner = req.session.partner;

  if (reasonOutOfWork) {
    req.session.reasonOutOfWork = reasonOutOfWork;

    // Redundant or Injured
    if (reasonOutOfWork === 'redundant' || reasonOutOfWork === 'injury') {
      res.redirect('/' + type + '/outcomes/END010');
    }

    // Not working, ask about partner
    if (reasonOutOfWork === 'neverWorked' || reasonOutOfWork === 'fired') {
      res.redirect('/' + type + '/questions/partner');
    }
  }

  next();
});

router.all('/:type/questions/lived-in-british-isles', function (req, res, next) {
  var type = req.params.type;
  var livedInBritishIsles = req.body.livedInBritishIsles;

  if (livedInBritishIsles) {
    req.session.livedInBritishIsles = livedInBritishIsles;

    // Lived in UK last two years
    if (livedInBritishIsles === 'lastTwoYears') {
      res.redirect('/' + type + '/outcomes/END004');
    }

    // Otherwise requires family support
    else {
      res.redirect('/' + type + '/questions/family-member-financial-support');
    }
  }

  next();
});

router.all('/:type/questions/family-member-financial-support', function (req, res, next) {
  var type = req.params.type;
  var familyMemberFinancialSupport = req.body.familyMemberFinancialSupport;
  var familyMemberNationality = req.body.supportingFamilyMemberNationality;

  // From session (previously answered)
  var noRecourseToPublicFunds = req.session.noRecourseToPublicFunds;

  if (familyMemberFinancialSupport) {
    req.session.familyMemberFinancialSupport = familyMemberFinancialSupport;

    // List countries, pull out names
    var listEEA = res.locals.countriesByEEA;
    var listNonEEA = res.locals.countriesByNonEEA;

    // Has family in the UK
    if (familyMemberFinancialSupport === 'yes') {

      if (familyMemberNationality) {

        // EEA nationality
        if (listEEA.indexOf(familyMemberNationality) !== -1) {
          res.redirect('/' + type + '/outcomes/END005');
        }

        // Non-EEA nationality
        else if (listNonEEA.indexOf(familyMemberNationality) !== -1) {
          res.redirect('/' + type + '/outcomes/END007');
        }
      }
    }

    // No family in the UK
    else {

      // Stamped visa
      if (noRecourseToPublicFunds && noRecourseToPublicFunds === 'yes') {
        res.redirect('/' + type + '/outcomes/END007');
      }

      // No stamped visa
      else {
        res.redirect('/' + type + '/questions/lived-in-uk-five-years');
      }
    }
  }

  next();
});

router.all('/:type/questions/lived-in-uk-five-years', function (req, res, next) {
  var type = req.params.type;
  var fiveYearsResidency = req.body.fiveYearsResidency;

  if (fiveYearsResidency) {
    req.session.fiveYearsResidency = fiveYearsResidency;

    // Lived in UK for five years
    if (fiveYearsResidency === 'yes') {
      res.redirect('/' + type + '/outcomes/END006');
    }

    // Otherwise requires children in education
    else {
      res.redirect('/' + type + '/questions/children-in-full-time-education');
    }
  }

  next();
});

router.all('/:type/questions/children-in-full-time-education', function (req, res, next) {
  var type = req.params.type;
  var childrenInFullTimeEduction = req.body.childrenInFullTimeEduction;

  if (childrenInFullTimeEduction) {
    req.session.childrenInFullTimeEduction = childrenInFullTimeEduction;

    // Children in full time education
    if (childrenInFullTimeEduction === 'yes') {
      res.redirect('/' + type + '/outcomes/END005');
    }

    // Sorry, won't qualify
    else {
      res.redirect('/' + type + '/outcomes/END007');
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
      res.redirect('/' + type + '/questions/partner');
    }

    // No stamped visa
    else if (noRecourseToPublicFunds === 'no') {
      res.redirect('/' + type + '/outcomes/END009');
    }
  }

  next();
});

module.exports = router;
