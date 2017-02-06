var express = require('express')
var router = express.Router()

// Readable outcomes
var outcomes = {
  british: {
      id: 'END001',
      status: 'British citizen'
  },
  employedEEA: {
      id: 'END002',
      status: 'EEA worker'
  },
  ineligible: {
      id: 'END003',
      status: 'Ineligible'
  },
  noRecourseToPublicFunds: {
      id: 'END004',
      status: 'No recourse to public funds'
  },
  selfEmployedEEA: {
      id: 'END006',
      status: 'Self-employed EEA citizen'
  },
  permanentResident: {
      id: 'END007',
      status: 'Permanent resident'
  },
  refugee: {
      id: 'END008',
      status: 'Refugee'
  },
  leaveToRemain: {
      id: 'END009',
      status: 'Settlement, indefinite or limited leave to remain'
  },
  redundantEEA: {
      id: 'END010',
      status: 'Redundant EEA citizen'
  },
  sickEEA: {
      id: 'END011',
      status: 'Temporary sick EEA citizen'
  },
  derivedRightsEEA: {
      id: 'END012',
      status: 'Spouse of EEA citizen'
  },
  derivedRightsNonEEA: {
      id: 'END013',
      status: 'Spouse of EEA citizen'
  },
  bookFurtherEvidenceInterview: {
    id: 'END014',
    status: 'Returning British national with no passport on the day of initial interview'
  }
}

var config = {
  isPartnerFlowEnabled: true
}

// Route index page
router.get('/', function (req, res) {
  res.render('index')
})

// Route validation index
router.get('/validation', function (req, res) {
  res.redirect('/')
})

// Reset session at citizen start
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

  for (outcome in outcomes) {
    if (outcomes[outcome].id === outcomeId) {
      res.locals.claimantStatus = outcomes[outcome].status;
      break;
    }
  }

  // Skip if partner flow disabled
  if (config.isPartnerFlowEnabled) {

    // Not asked about partner yet
    if (typeof answers.claimant.partner === 'undefined') {

      // Save outcome
      answers.claimant.outcomeId = outcomeId;

      // Ineligible claimant (but might qualify for derived rights)
      if (outcomeId === outcomes.ineligible.id &&
        ((answers.claimant.isEEA && answers.claimant.dontWorkReason === 'other') ||
          (!answers.claimant.isEEA && answers.claimant.familyMember === 'yes')) ||
          (!answers.claimant.isEEA && answers.claimant.noRecourseToPublicFunds === 'no'
           && answers.claimant.familyMember === 'no' && answers.claimant.outOfUk === 'yes')) {

        // Mark as derived rights flow
        answers.claimant.isDerivedRightsFlow = true;

        // Redirect to partner flow
        res.redirect(`/${type}/questions/partner?claimant`);
        return;
      }
    }

    // Has partner, override outcome based on claimant
    else if (answers.claimant.partner === 'yes' && answers.claimant.outcomeId) {

      // Save outcome
      answers.partner.outcomeId = outcomeId;

      // Does claimant outcome differ? Partner must be eligible
        if (answers.claimant.outcomeId !== outcomeId && outcomeId !== outcomes.ineligible.id) {

          // Ineligible claimant (derived rights)
          if (answers.claimant.outcomeId === outcomes.ineligible.id) {

            // Skip if already on derived rights outcome
            if (outcomeId !== outcomes.derivedRightsNonEEA.id && outcomeId !== outcomes.derivedRightsEEA.id) {

              // Ineligible claimant + derived rights partner
              if (outcomeId === outcomes.employedEEA.id ||
                outcomeId === outcomes.sickEEA.id ||
                outcomeId === outcomes.redundantEEA.id) {

                // Force outcome to derived rights
                answers.partner.outcomeId = answers.claimant.isEEA ?
                  outcomes.derivedRightsEEA.id : outcomes.derivedRightsNonEEA.id;

                // Redirect to derived rights
                res.redirect(`/${type}/outcomes/${answers.partner.outcomeId}?${claimantType}`);
                return;
              }

              // Otherwise still ineligible
              else {
                res.redirect(`/${type}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
                return;
              }
            }
          }

        // Both reached eligible outcome
        else {
          res.redirect(`/${type}/outcomes/${answers.claimant.outcomeId}?${claimantType}`);
          return;
        }
      }
    }
  }

  // Render requested outcome
  res.render(`${type}/outcomes/${outcomeId}`);
});

// Branching for citizens
router.all('/:type/questions/uk-national', function (req, res) {
  var type = req.params.type;
  var ukNational = req.body.ukNational;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  if (ukNational) {
    answers[claimantType].ukNational = ukNational;

    // UK national
    if (ukNational == 'yes') {
      answers[claimantType].isEEA = true;
      res.redirect(`/${type}/questions/british-passport-today?${claimantType}`);
    }

    // Non-UK national
    else if (ukNational == 'no') {
      res.redirect(`/${type}/questions/refugee?${claimantType}`);
    }

    else if (res.locals.isPartnerFlow && ukNational === 'unknown') {
      res.redirect(`/${type}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
    }
  }

  else {
    res.render(`${type}/questions/uk-national`);
  }

});

// Branching for citizens with a passport on the day
router.all('/:type/questions/british-passport-today', function (req, res) {
  var type = req.params.type;
  var hasBritishPassportToday = req.body.britishPassportToday;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  if (hasBritishPassportToday) {
    answers[claimantType].hasBritishPassportToday = hasBritishPassportToday;

    // UK national
    if (hasBritishPassportToday == 'yes') {
      answers[claimantType].isEEA = true;
      res.redirect(`/${type}/outcomes/${outcomes.british.id}?${claimantType}`);
    }

    // Non-UK national
    else if (hasBritishPassportToday == 'no') {
      res.redirect(`/${type}/outcomes/${outcomes.bookFurtherEvidenceInterview.id}?${claimantType}`);
    }

  }

  else {
    res.render(`${type}/questions/british-passport-today`);
  }

});

router.all('/:type/questions/refugee', function (req, res) {
  var type = req.params.type;
  var refugee = req.body.refugee;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  if (refugee) {
    answers[claimantType].refugee = refugee;

    // Refugee
    if (refugee === 'yes') {
      res.redirect(`/${type}/outcomes/${outcomes.refugee.id}?${claimantType}`);
    }

    // Non-refugee
    else if (refugee === 'no') {
      // res.redirect(`/${type}/questions/permanent-residence?${claimantType}`);
      res.redirect(`/${type}/questions/nationality?${claimantType}`);
    }

    else if (res.locals.isPartnerFlow && refugee === 'unknown') {
      res.redirect(`/${type}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
    }
  }

  else {
    res.render(`${type}/questions/refugee`);
  }
});

router.all('/:type/questions/permanent-residence', function (req, res) {
  var type = req.params.type;
  var permanentResidence = req.body.permanentResidence;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  if (permanentResidence) {
    answers[claimantType].permanentResidence = permanentResidence;

    // Permanent residence card
    if (permanentResidence === 'yes') {
      res.redirect(`/${type}/outcomes/${outcomes.permanentResident.id}?${claimantType}`);
    }

    // No permanent residence card
    else if (permanentResidence === 'no') {
      res.redirect(`/${type}/questions/nationality?${claimantType}`);
    }
  }

  else {
    res.render(`${type}/questions/permanent-residence`);
  }
});

router.all('/:type/questions/nationality', function (req, res) {
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
        res.redirect(`/${type}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      }

      // Continue
      res.redirect(`/${type}/questions/employee-status?${claimantType}`);
    }

    // Non-EEA nationality
    else if (listNonEEA.indexOf(nationality) !== -1) {
      answers[claimantType].isEEA = false;
      res.redirect(`/${type}/questions/no-recourse-to-public-funds?${claimantType}`);
    }
  }

  else {
    res.render(`${type}/questions/nationality`);
  }
});

router.all('/:type/questions/employee-status', function (req, res) {
  var type = req.params.type;
  var employeeStatus = req.body.employeeStatus;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  // Ineligible claimant (derived rights), UK straight to outcome
  if (answers.claimant.isDerivedRightsFlow && answers.partner.nationality === 'United Kingdom') {
    res.redirect(`/${type}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
    return;
  }

  if (employeeStatus) {
    answers[claimantType].employeeStatus = employeeStatus;

    // Self-employed
    if (employeeStatus.selfEmployed === 'true') {
      res.redirect(`/${type}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
    }

    // Employed
    else if (employeeStatus.employed === 'true') {
      res.redirect(`/${type}/outcomes/${outcomes.employedEEA.id}?${claimantType}`);
    }

    // Not working
    else if (employeeStatus.dontWork === 'true') {
      res.redirect(`/${type}/questions/employee-status-dont-work?${claimantType}`);
    }
  }

  else {
    res.render(`${type}/questions/employee-status`);
  }
});

router.all('/:type/questions/employee-status-self-employed', function (req, res) {
  var type = req.params.type;
  var selfEmployedProof = req.body.selfEmployedProof;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  // Ineligible claimant (derived rights), self-employed straight to outcome
  if (answers.claimant.isDerivedRightsFlow && answers.partner.employeeStatus.selfEmployed === 'true') {
    res.redirect(`/${type}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
    return;
  }

  if (selfEmployedProof) {
    answers[claimantType].selfEmployedProof = selfEmployedProof;

    // Self-employed proof can be provided
    if (selfEmployedProof === 'yes') {
      res.redirect(`/${type}/outcomes/${outcomes.selfEmployedEEA.id}?${claimantType}`);
    }

    // Self-employed proof can't be provided
    else if (selfEmployedProof === 'no' || res.locals.isPartnerFlow && selfEmployedProof === 'unknown') {
      res.redirect(`/${type}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
    }
  }

  else {
    res.render(`${type}/questions/employee-status-self-employed`);
  }
});

router.all('/:type/questions/employee-status-dont-work', function (req, res) {
  var type = req.params.type;
  var dontWorkReason = req.body.dontWorkReason;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  if (dontWorkReason) {
    answers[claimantType].dontWorkReason = dontWorkReason;

    // Redundant
    if (dontWorkReason === 'redundant') {
      res.redirect(`/${type}/outcomes/${outcomes.redundantEEA.id}?${claimantType}`);
    }

    // Sick
    if (dontWorkReason === 'sick') {
      res.redirect(`/${type}/questions/fitnote?${claimantType}`);
    }

    // Other or Partner reason unknown
    else if (dontWorkReason === 'other' || res.locals.isPartnerFlow && dontWorkReason === 'unknown') {
      res.redirect(`/${type}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
    }
  }

  else {
    res.render(`${type}/questions/employee-status-dont-work`);
  }
});

router.all('/:type/questions/fitnote', function(req, res) {
  var type = req.params.type;
  var hasFitNote = req.body.hasFitNote;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  if(hasFitNote) {
    if(hasFitNote == 'yes') {
      res.redirect(`/${type}/outcomes/${outcomes.sickEEA.id}?${claimantType}`);
    } else if (hasFitNote == 'no') {
      if(!!answers.claimant.outcomeId) {
        res.redirect(`/${type}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      } else {
        answers.claimant.isDerivedRightsFlow = true;
        answers.claimant.outcomeId = outcomes.ineligible.id;
        res.redirect(`/${type}/questions/partner?${claimantType}`);
      }
    } else if (hasFitNote == 'unknown') {
      res.redirect(`/${type}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
    }
  } else {
    res.render(`${type}/questions/fitnote`);
  }
});

router.all('/:type/questions/partner', function (req, res) {
  var type = req.params.type;
  var partner = req.body.partner;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  // Mark as derived rights flow (updates question text)
  res.locals.isDerivedRightsFlow = answers.claimant.isDerivedRightsFlow;

  if (partner && answers.claimant.outcomeId) {
    answers[claimantType].partner = partner;

    // No partner or partner flow disabled
    if (partner === 'no' || !config.isPartnerFlowEnabled) {
      res.redirect(`/${type}/outcomes/${answers.claimant.outcomeId}?claimant`);
    }

    // Has a partner
    else if (partner === 'yes') {
      // Ineligible claimant (derived rights), skip to nationality
      if (answers.claimant.isDerivedRightsFlow) {
        res.redirect(`/${type}/questions/nationality?partner`);
      }

      // Assume still qualifying
      else {
        res.redirect(`/${type}/questions/uk-national?partner`);
      }
    }
  }

  else {
    res.render(`${type}/questions/partner`);
  }
});

router.all('/:type/questions/no-recourse-to-public-funds', function (req, res) {
  var type = req.params.type;
  var noRecourseToPublicFunds = req.body.noRecourseToPublicFunds;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  // Ineligible claimant (derived rights), partner must be EEA
  if (answers.claimant.isDerivedRightsFlow && !answers.partner.isEEA) {
    res.redirect(`/${type}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
    return;
  }

  if (noRecourseToPublicFunds) {
    answers[claimantType].noRecourseToPublicFunds = noRecourseToPublicFunds;

    // Stamped visa
    if (noRecourseToPublicFunds === 'yes') {
      res.redirect(`/${type}/outcomes/${outcomes.noRecourseToPublicFunds.id}?${claimantType}`);
    }

    // No stamped visa
    else if (noRecourseToPublicFunds === 'no') {
      res.redirect(`/${type}/questions/family-member?${claimantType}`);
    }

    else if (res.locals.isPartnerFlow && noRecourseToPublicFunds === 'unknown') {
      res.redirect(`/${type}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
    }
  }

  else {
    res.render(`${type}/questions/no-recourse-to-public-funds`);
  }
});

router.all('/:type/questions/family-member', function (req, res) {
  var type = req.params.type;
  var familyMember = req.body.familyMember;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  if (familyMember) {
    answers[claimantType].familyMember = familyMember;

    // Visa says 'family member'
    if (familyMember === 'yes') {
      res.redirect(`/${type}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
    }

    // Visa doesn't say 'family member'
    else if (familyMember === 'no') {
      res.redirect(`/${type}/outcomes/${outcomes.leaveToRemain.id}?${claimantType}`);
    }

    else if (res.locals.isPartnerFlow && familyMember === 'unknown') {
      res.redirect(`/${type}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
    }
  }

  else {
    res.render(`${type}/questions/family-member`);
  }
});

router.all('/:type/questions/out-of-uk', function (req, res) {
  var type = req.params.type;
  var outOfUk = req.body.outOfUk;
  var answers = req.session.answers;
  var claimantType = res.locals.claimantType;

  if (outOfUk) {
    answers[claimantType].outOfUk = outOfUk;

    // Out of UK more than 4 weeks
    if (outOfUk === 'yes') {
      res.redirect(`/${type}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
    }

    // Out of UK less than 4 weeks
    else if (outOfUk === 'no') {
      res.redirect(`/${type}/outcomes/${outcomes.leaveToRemain.id}?${claimantType}`);
    }

    else if (res.locals.isPartnerFlow && outOfUk === 'unknown') {
      res.redirect(`/${type}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
    }
  }

  else {
    res.render(`${type}/questions/out-of-uk`);
  }
});

module.exports = router
