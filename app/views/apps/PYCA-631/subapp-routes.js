module.exports = (router, config) => {

  // ###########################################################################
  // helper constants
  // ###########################################################################

  // each sub-application (version) gets some specific data about it:
  const appData = config.data

  // this is a URL route to the apps 'root' redirect use this
  const appRoot = config.route.root

  // to use 'render' use this
  const appRootRel = config.route.rootRel

  // this will create a route that targets all pages:
  const allPages = `${appRoot}/**/*`

  // you can write a route for specific pages/directories using the
  // appRoot variable.
  // For example if your subapplication / version is in a directory
  // called 'live' then the output would be
  // /apps/live/views/index
  router.all(`${appRoot}/index`, function(req,res,next) {
    next()
  })

  // Readable outcomes
  const outcomes = {
    british: {
        id: 'END001',
        status: 'British / Irish national'
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
        status: 'Temporarily sick EEA citizen'
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
    },
    bookFurtherEvidenceInterviewBRP: {
      id: 'END015',
      status: 'NonEEA with no BRP on the day of the initial interview'
    },
    bookFurtherEvidenceInterviewMarriage: {
      id: 'END016',
      status: 'Married NonEEA with no marriage certificate on the day of the initial interview'
    },
    selfEmployedWithoutEvidence : {
      id: 'END017',
      status: 'Self Employed person - without their evidence with them'
    },
    selfEmployedWithEvidence : {
      id: 'END018',
      status: 'Self Employed person - save their information'
    },
    eeaSickWithEvidence : {
      id: 'END020',
      status: 'EEA Sick, previously employed'
    },
    eeaSickWithoutEvidence : {
      id: 'END024',
      status: 'EEA Sick, previously employed - Further Evidence Required'
    },
    eeaPrevSelfEmployedWithEvidence : {
      id: 'END025',
      status: 'EEA Sick, previously SELF employed'
    },
    eeaPrevSelfEmployedWithoutEvidence : {
      id: 'END021',
      status: 'EEA Sick, previously SELF employed - Further Evidence Required'
    },
    eeaLooking4WorkWithEvidence : {
      id: 'END019',
      status: 'EEA not working or previously employed, arrived looking for work'
    },
    eeaLooking4WorkWithoutEvidence : {
      id: 'END023',
      status: 'EEA not working or previously employed, arrived looking for work - requires further evidence'
    },
    pregnantFastTrack : {
      id: 'END026',
      status: 'EEA not working due to pregnancy'
    },
    pregnantFastTrackFurtherEvidenceRequired : {
      id: 'END022',
      status: 'EEA not working due to pregnancy - Further Evidence Required'
    }
  }

  config.isPartnerFlowEnabled = true

  // ####################################################################
  // Set up locals/session for all routes
  // ####################################################################
  router.all(`${appRoot}/**/*`, function(req, res, next) {

    var answers = req.session[config.slug].answers || { claimant: {}, partner: {} };
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

    res.locals.currentApp.isPartnerFlow = isPartnerFlow;
    res.locals.currentApp.claimantType = claimantType;
    req.session[config.slug].answers = answers;

    next();
  });

  // ####################################################################
  // Intercept outcome pages, check for partner
  // ####################################################################
  router.all(`${appRoot}/outcomes/:outcomeId`, function (req, res, next) {

    var isPartnerFlow = res.locals.currentApp.isPartnerFlow;
    var outcomeId = req.params.outcomeId;
    var claimantType = res.locals.currentApp.claimantType;
    var answers = req.session[config.slug].answers;

    for (outcome in outcomes) {
      if (outcomes[outcome].id === outcomeId) {
        res.locals.currentApp.claimantStatus = outcomes[outcome].status;
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
          (answers.claimant.isEEA && answers.claimant.dontWorkReason === 'other') ||
          (!answers.claimant.isEEA && answers.claimant.noRecourseToPublicFunds === 'no'
             && answers.claimant.familyMember === 'no') ||
          (answers.claimant.backtowork == 'no') ||
          (answers.claimant.reasonPrevSelfEmploymentEnded == 'other') ||
          (answers.claimant.prevSelfEmployedFitnote == 'no') ||
          (answers.claimant.preventpermanently == 'no') ||
          (answers.claimant.medCerts == 'no')
         ) {

          // Mark as derived rights flow
          answers.claimant.isDerivedRightsFlow = true;

          // Redirect to partner flow
          res.redirect(`${appRoot}/questions/partner?claimant`);
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
                  res.redirect(`${appRoot}/outcomes/${answers.partner.outcomeId}?${claimantType}`);
                  return;
                }

                // Otherwise still ineligible
                else {
                  res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
                  return;
                }
              }
            }

          // Both reached eligible outcome
          else {
            res.redirect(`${appRoot}/outcomes/${answers.claimant.outcomeId}?${claimantType}`);
            return;
          }
        }
      }
    }

    // Render requested outcome
    res.render(`${appRootRel}/outcomes/${outcomeId}`);

  });

  // ####################################################################
  // Branching for UK citizens
  // ####################################################################
  router.all(`${appRoot}/questions/uk-national`, function (req, res) {
    var ukNational = req.body.ukNational;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (ukNational) {
      answers[claimantType].ukNational = ukNational;

      // UK national
      if (ukNational == 'yes') {
        answers[claimantType].isEEA = true;
        res.redirect(`${appRoot}/questions/british-passport-today?${claimantType}`);
      }

      // Non-UK national
      else if (ukNational == 'no') {
        res.redirect(`${appRoot}/questions/refugee?${claimantType}`);
      }

      else if (res.locals.currentApp.isPartnerFlow && ukNational === 'unknown') {
        res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      }
    }

    else {
      res.render(`${appRootRel}/questions/uk-national`);
    }

  });

  // ####################################################################
  // Branching for citizens with a passport on the day
  // ####################################################################
  router.all(`${appRoot}/questions/british-passport-today`, function (req, res) {
    var hasBritishPassportToday = req.body.britishPassportToday;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (hasBritishPassportToday) {
      answers[claimantType].hasBritishPassportToday = hasBritishPassportToday;

      // Has British passport with them
      if (hasBritishPassportToday == 'yes') {
        answers[claimantType].isEEA = true;
        res.redirect(`${appRoot}/questions/british-citizen?${claimantType}`);
      }

      // Don't have their British passport with them
      else if (hasBritishPassportToday == 'no') {
        res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      }

    }

    else {
      res.render(`${appRootRel}/questions/british-passport-today`);
    }

  });

  // ####################################################################
  // Branching for citizens with a british passport and british citizen
  // ####################################################################
  router.all(`${appRoot}/questions/british-citizen`, function (req, res) {
    var isBritishCitizen = req.body.britishCitizen;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (isBritishCitizen) {
      answers[claimantType].isBritishCitizen = isBritishCitizen;

      // UK national
      if (isBritishCitizen == 'yes') {
        answers[claimantType].isEEA = true;
        res.redirect(`${appRoot}/outcomes/${outcomes.british.id}?${claimantType}`);
      }

      // Non-UK national
      else if (isBritishCitizen == 'no') {
        res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      }

    }

    else {
      res.render(`${appRootRel}/questions/british-citizen`);
    }

  });


  // ####################################################################
  // refuge
  // ####################################################################
  router.all(`${appRoot}/questions/refugee`, function (req, res) {
    var refugee = req.body.refugee;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (refugee) {
      answers[claimantType].refugee = refugee;

      // Refugee
      if (refugee === 'yes') {
        res.redirect(`${appRoot}/outcomes/${outcomes.refugee.id}?${claimantType}`);
      }

      // Non-refugee
      else if (refugee === 'no') {
        res.redirect(`${appRoot}/questions/nationality?${claimantType}`);
      }

      else if (res.locals.currentApp.isPartnerFlow && refugee === 'unknown') {
        res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      }
    }

    else {
      res.render(`${appRootRel}/questions/refugee`);
    }
  });

  // ####################################################################
  // Checking claimants nationality
  // ####################################################################

  router.all(`${appRoot}/questions/nationality`, function (req, res) {
    var nationality = req.body.nationality;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

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
          res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
        } else if(nationality === 'Ireland') {
          res.redirect(`${appRoot}/outcomes/${outcomes.british.id}?${claimantType}`);
        }

        // Continue
        res.redirect(`${appRoot}/questions/employee-status?${claimantType}`);
      }

      // Non-EEA nationality
      else if (listNonEEA.indexOf(nationality) !== -1) {
        answers[claimantType].isEEA = false;
        res.redirect(`${appRoot}/questions/biometric-residence-permit?${claimantType}`);
      }
    }

    else {
      res.render(`${appRootRel}/questions/nationality`);
    }
  });

  // ####################################################################
  // Checking if EEA employment status
  // ####################################################################

  router.all(`${appRoot}/questions/employee-status`, function (req, res) {
    var employeeStatus = req.body.employeeStatus;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    // Ineligible claimant (derived rights), UK straight to outcome
    if (answers.claimant.isDerivedRightsFlow && answers.partner.nationality === 'United Kingdom') {
      res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      return;
    }

    if (employeeStatus) {

      answers[claimantType].employeeStatus = employeeStatus;

      // Self-employed
      if (employeeStatus.selfEmployed === 'true') {
        res.redirect(`${appRoot}/questions/self-employed-duration?${claimantType}`);
      }

      // Employed
      else if (employeeStatus.employed === 'true') {
        res.redirect(`${appRoot}/outcomes/${outcomes.employedEEA.id}?${claimantType}`);
      }

      // Not working
      else if (employeeStatus.dontWork === 'true') {
        res.redirect(`${appRoot}/questions/were-they-previously-working?${claimantType}`);
      }

    } else {
      res.render(`${appRootRel}/questions/employee-status`);
    }
  });

  // ####################################################################
  // Checking why an EEA claimant doesn't work
  // ####################################################################

  //  Made inactive as part of PYCA-631
  // router.all(`${appRoot}/questions/employee-status-dont-work`, function (req, res) {
  //   var dontWorkReason = req.body.dontWorkReason;
  //   var answers = req.session[config.slug].answers;
  //   var claimantType = res.locals.currentApp.claimantType;
  //
  //   if (dontWorkReason) {
  //     answers[claimantType].dontWorkReason = dontWorkReason;
  //
  //     // Redundant
  //     if (dontWorkReason === 'redundant') {
  //       res.redirect(`${appRoot}/outcomes/${outcomes.redundantEEA.id}?${claimantType}`);
  //     }
  //
  //     // Sick
  //     if (dontWorkReason === 'sick') {
  //       res.redirect(`${appRoot}/questions/fitnote?${claimantType}`);
  //     }
  //
  //     // Other or Partner reason unknown
  //     else if (dontWorkReason === 'other' || res.locals.currentApp.isPartnerFlow && dontWorkReason === 'unknown') {
  //       res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
  //     }
  //   }
  //
  //   else {
  //     res.render(`${appRootRel}/questions/employee-status-dont-work`);
  //   }
  // });

  // ####################################################################
  // Checking if a sick EEA claimant has a fit note
  // ####################################################################

  router.all(`${appRoot}/questions/fitnote`, function(req, res) {
    var hasFitNote = req.body.hasFitNote;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if(hasFitNote) {

      if(hasFitNote == 'yes') {
        res.redirect(`${appRoot}/outcomes/${outcomes.sickEEA.id}?${claimantType}`);
      }

      else if (hasFitNote == 'no') {

        if(!!answers.claimant.outcomeId) {
          res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
        }

        else {
          answers.claimant.isDerivedRightsFlow = true;
          answers.claimant.outcomeId = outcomes.ineligible.id;
          res.redirect(`${appRoot}/questions/partner?${claimantType}`);
        }
      }

      else if (hasFitNote == 'unknown') {
        res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      }
    }

    else {
      res.render(`${appRootRel}/questions/fitnote`);
    }
  });

  // ####################################################################
  // EEA out of work Partner questions
  // ####################################################################

  router.all(`${appRoot}/questions/partner`, function (req, res) {
    var partner = req.body.partner;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    // Mark as derived rights flow (updates question text)
    res.locals.currentApp.isDerivedRightsFlow = answers.claimant.isDerivedRightsFlow;

    if (partner && answers.claimant.outcomeId) {
      answers[claimantType].partner = partner;

      // No partner or partner flow disabled
      if (partner === 'no' || !config.isPartnerFlowEnabled) {
        res.redirect(`${appRoot}/outcomes/${answers.claimant.outcomeId}?claimant`);
      }

      // Has a partner
      else if (partner === 'yes') {
        // Ineligible claimant (derived rights), skip to nationality
        if (answers.claimant.isDerivedRightsFlow) {
          res.redirect(`${appRoot}/questions/nationality?partner`);
        }

        // Assume still qualifying
        else {
          res.redirect(`${appRoot}/questions/uk-national?partner`);
        }
      }
    }

    else {
      res.render(`${appRootRel}/questions/partner`);
    }
  });

  // ####################################################################
  // Checking if non EEA claimant has a BRP (doesn't change routing)
  // ####################################################################
  router.all(`${appRoot}/questions/biometric-residence-permit`, function (req, res) {
    var brp = req.body.brp;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (brp) {

      answers[claimantType].brp = brp;

      // They have a biometric residency permit
      if (brp == 'yes') {
        res.redirect(`${appRoot}/questions/no-recourse-to-public-funds?${claimantType}`);
      }

      // Non-UK national
      else if (brp == 'no') {
        res.redirect(`${appRoot}/questions/no-recourse-to-public-funds?${claimantType}`);
      }

    }

    else {
      res.render(`${appRootRel}/questions/biometric-residence-permit`);
    }

  });

  // ####################################################################
  // Does the claimant have no recourse to public funds
  // ####################################################################

  router.all(`${appRoot}/questions/no-recourse-to-public-funds`, function (req, res) {
    var noRecourseToPublicFunds = req.body.noRecourseToPublicFunds;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    // Ineligible claimant (derived rights), partner must be EEA
    if (answers.claimant.isDerivedRightsFlow && !answers.partner.isEEA) {
      res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      return;
    }

    if (noRecourseToPublicFunds) {
      answers[claimantType].noRecourseToPublicFunds = noRecourseToPublicFunds;

      // Stamped visa
      if (noRecourseToPublicFunds === 'yes') {
        res.redirect(`${appRoot}/outcomes/${outcomes.noRecourseToPublicFunds.id}?${claimantType}`);
      }

      // No stamped visa
      else if (noRecourseToPublicFunds === 'no') {
        res.redirect(`${appRoot}/questions/family-member?${claimantType}`);
      }

      else if (res.locals.currentApp.isPartnerFlow && noRecourseToPublicFunds === 'unknown') {
        res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      }
    }

    else {
      res.render(`${appRootRel}/questions/no-recourse-to-public-funds`);
    }
  });

  // ####################################################################
  // Checking if claimant has a family member visa
  // ####################################################################

  router.all(`${appRoot}/questions/family-member`, function (req, res) {
    var familyMember = req.body.familyMember;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (familyMember) {
      answers[claimantType].familyMember = familyMember;

      // Visa says 'family member'
      if (familyMember === 'yes') {
        if(!!answers.claimant.outcomeID){
        res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
        }

        else {answers.claimant.isDerivedRightsFlow = true;
          answers.claimant.outcomeId = outcomes.ineligible.id;
          res.redirect(`${appRoot}/questions/partner?${claimantType}`);
        }
      }

      // Visa doesn't say 'family member'
      else if (familyMember === 'no') {
        res.redirect(`${appRoot}/outcomes/${outcomes.leaveToRemain.id}?${claimantType}`);
      }

      else if (res.locals.currentApp.isPartnerFlow && familyMember === 'unknown') {
        res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      }
    }

    else {
      res.render(`${appRootRel}/questions/family-member`);
    }
  });

  // ####################################################################
  // PYCA-631 Changes
  // ####################################################################

  router.all(`${appRoot}/questions/self-employed-duration`, function (req, res) {
    var selfEmployedDuration = req.body.selfEmployedDuration;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (selfEmployedDuration) {
      answers[claimantType].selfEmployedDuration = selfEmployedDuration;
      res.redirect(`${appRoot}/questions/self-employed-hours-worked?${claimantType}`);
    }
    else {
      res.render(`${appRootRel}/questions/self-employed-duration`);
    }
  });

  router.all(`${appRoot}/questions/self-employed-hours-worked`, function (req, res) {
    var selfEmployedHours = req.body.selfEmployedHours;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (selfEmployedHours) {
      answers[claimantType].selfEmployedHours = selfEmployedHours;
      res.redirect(`${appRoot}/questions/monthly-average-earnings?${claimantType}`);
    }
    else {
      res.render(`${appRootRel}/questions/self-employed-hours-worked`);
    }
  });

  router.all(`${appRoot}/questions/monthly-average-earnings`, function (req, res) {
    var monthlyAverageEarnings = req.body.monthlyAverageEarnings;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (monthlyAverageEarnings) {
      answers[claimantType].monthlyAverageEarnings = monthlyAverageEarnings;
      res.redirect(`${appRoot}/questions/salary?${claimantType}`);
    }
    else {
      res.render(`${appRootRel}/questions/monthly-average-earnings`);
    }
  });

  router.all(`${appRoot}/questions/salary`, function (req, res) {
    var payThemselfASalary = req.body.payThemselfASalary;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (payThemselfASalary) {
      answers[claimantType].payThemselfASalary = payThemselfASalary;

      if (payThemselfASalary === 'yes')
      {
        res.redirect(`${appRoot}/outcomes/${outcomes.employedEEA.id}?${claimantType}`);
      } else {
        res.redirect(`${appRoot}/questions/hmrc-registered?${claimantType}`);
      }
    }
    else {
      res.render(`${appRootRel}/questions/salary`);
    }
  });

  router.all(`${appRoot}/questions/hmrc-registered`, function (req, res) {
    var hmrcRegistered = req.body.hmrcRegistered;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (hmrcRegistered) {
      answers[claimantType].hmrcRegistered = hmrcRegistered;
      res.redirect(`${appRoot}/questions/tax-return?${claimantType}`);
    }
    else {
      res.render(`${appRootRel}/questions/hmrc-registered`);
    }
  });

  router.all(`${appRoot}/questions/tax-return`, function (req, res) {
    var taxReturn = req.body.taxReturn;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (taxReturn) {
      answers[claimantType].taxReturn = taxReturn;
      res.redirect(`${appRoot}/questions/accident-sick-pay?${claimantType}`);
    }
    else {
      res.render(`${appRootRel}/questions/tax-return`);
    }
  });

  router.all(`${appRoot}/questions/accident-sick-pay`, function (req, res) {
    var sickPay = req.body.sickPay;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (sickPay) {
      answers[claimantType].sickPay = sickPay;

      if (sickPay === 'yes')
      {
        res.redirect(`${appRoot}/outcomes/${outcomes.employedEEA.id}?${claimantType}`);
      } else {
        res.redirect(`${appRoot}/questions/any-employees?${claimantType}`);
      }
    }
    else {
      res.render(`${appRootRel}/questions/accident-sick-pay`);
    }
  });

  router.all(`${appRoot}/questions/any-employees`, function (req, res) {
    var anyEmployees = req.body.anyEmployees;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (anyEmployees) {
      answers[claimantType].anyEmployees = anyEmployees;
      res.redirect(`${appRoot}/questions/decide-who-provide-service-to?${claimantType}`);
    }
    else {
      res.render(`${appRootRel}/questions/any-employees`);
    }
  });

  router.all(`${appRoot}/questions/decide-who-provide-service-to`, function (req, res) {
    var decideWhoToProvideServiceTo = req.body.decideWhoToProvideServiceTo;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (decideWhoToProvideServiceTo) {
      answers[claimantType].decideWhoToProvideServiceTo = decideWhoToProvideServiceTo;

      if (decideWhoToProvideServiceTo === 'yes')
      {
        res.redirect(`${appRoot}/questions/business-profit?${claimantType}`);
      } else {

        res.redirect(`${appRoot}/outcomes/${outcomes.employedEEA.id}?${claimantType}`);
      }
    }
    else {
      res.render(`${appRootRel}/questions/decide-who-provide-service-to`);
    }
  });

  router.all(`${appRoot}/questions/business-profit`, function (req, res) {
    var businessEverMadeProfit = req.body.businessEverMadeProfit;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (businessEverMadeProfit) {
      answers[claimantType].businessEverMadeProfit = businessEverMadeProfit;
      res.redirect(`${appRoot}/questions/type-of-business?${claimantType}`);
    }
    else {
      res.render(`${appRootRel}/questions/business-profit`);
    }
  });

  router.all(`${appRoot}/questions/type-of-business`, function (req, res) {
    var typeOfBusiness = req.body.typeOfBusiness;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (typeOfBusiness) {
      answers[claimantType].typeOfBusiness = typeOfBusiness;
      res.redirect(`${appRoot}/questions/previous-self-employment?${claimantType}`);
    }
    else {
      res.render(`${appRootRel}/questions/type-of-business`);
    }
  });

  router.all(`${appRoot}/questions/previous-self-employment`, function (req, res) {
    var previouslySelfEmployed = req.body.previouslySelfEmployed;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (previouslySelfEmployed) {
      answers[claimantType].previouslySelfEmployed = previouslySelfEmployed;
      res.redirect(`${appRoot}/questions/length-of-time-in-uk?${claimantType}`);
    }
    else {
      res.render(`${appRootRel}/questions/previous-self-employment`);
    }
  });

  router.all(`${appRoot}/questions/length-of-time-in-uk`, function (req, res) {
    var lengthOfTimeInUK = req.body.lengthOfTimeInUK;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (lengthOfTimeInUK){
      if (answers[claimantType].previouslySelfEmployed == 'no') {
        res.redirect(`${appRoot}/questions/evidence-today?${claimantType}`);
      } else {
        res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      }
    }
    else {
      res.render(`${appRootRel}/questions/length-of-time-in-uk`);
    }
  });

  router.all(`${appRoot}/questions/evidence-today`, function (req, res) {
    var evidenceToday = req.body.evidenceToday;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (evidenceToday){
      answers[claimantType].evidenceToday = evidenceToday;
      if (answers[claimantType].previouslySelfEmployed == 'no') {
          if (evidenceToday == 'yes'){
            res.redirect(`${appRoot}/outcomes/${outcomes.selfEmployedWithEvidence.id}?${claimantType}`);
          }
          else {
            res.redirect(`${appRoot}/outcomes/${outcomes.selfEmployedWithoutEvidence.id}?${claimantType}`);
          }
      }
      else {
        res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      }
    }
    else {
      res.render(`${appRootRel}/questions/evidence-today`);
    }
  });

  // ####################################################################
  router.all(`${appRoot}/questions/were-they-previously-working`, function (req, res) {
    var previousWork = req.body.previousWork;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (previousWork) {
      answers[claimantType].previousWork = previousWork;
// console.log(Object.getOwnPropertyNames(previousWork));
      if (previousWork.selfEmployed === 'true' && previousWork.employed === 'true') {
        answers[claimantType].previousWork.employed = "Yes, Employed & Self Employed"
        res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      }
       else if (previousWork.selfEmployed === 'true') {
         answers[claimantType].previousWork.selfEmployed = "Yes, Self Employed"
        res.redirect(`${appRoot}/questions/previously-self-employed/when-did-self-employment-start?${claimantType}`);
      }
      else if (previousWork.employed === 'true') {
        answers[claimantType].previousWork.employed = "Yes, Employed"
        res.redirect(`${appRoot}/questions/employee-status-dont-work?${claimantType}`);
      }
      else if (previousWork.didntWork === 'true') {
        answers[claimantType].previousWork.didntWork = "No, didn't work"
        res.redirect(`${appRoot}/questions/job-seeker-student/uk-look-for-work?${claimantType}`);
      }

    } else {
      res.render(`${appRootRel}/questions/were-they-previously-working`);
    }
  });

  // ##########################################################################

  router.all(`${appRoot}/questions/employee-status-dont-work`, function (req, res) {
    var dontWorkReason = req.body.dontWorkReason;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (dontWorkReason) {
      answers[claimantType].dontWorkReason = dontWorkReason;

// console.log(dontWorkReason);
// console.log(Object.getOwnPropertyNames(dontWorkReason));

      switch (dontWorkReason) {
        case 'redundant':
          res.redirect(`${appRoot}/outcomes/${outcomes.redundantEEA.id}?${claimantType}`);
          break;
        case 'sick':
          res.redirect(`${appRoot}/questions/illness/injury-at-work?${claimantType}`);
          break;
        case 'vocational training':
          res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
          break;
        case 'childbirth':
          res.redirect(`${appRoot}/questions/pregnancy/letter-employer?${claimantType}`);
          break;
        case 'other':
          res.redirect(`${appRoot}/questions/job-seeker-student/uk-look-for-work?${claimantType}`);
          break;
      }
    }
    else {
      res.render(`${appRootRel}/questions/employee-status-dont-work`);
    }
  });

  router.all(`${appRoot}/questions/illness/injury-at-work`, function (req, res) {
    var injuryatwork = req.body.injuryatwork;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (injuryatwork){
      answers[claimantType].injuryatwork = injuryatwork;

      if (injuryatwork == 'yes') {
        res.redirect(`${appRoot}/questions/illness/industrial-injuries-disablement-benefit?${claimantType}`);
      } else {
        res.redirect(`${appRoot}/questions/illness/will-this-prevent-permanently?${claimantType}`);
      }
    }
    else {
      res.render(`${appRootRel}/questions/illness/injury-at-work`);
    }
  });

  router.all(`${appRoot}/questions/illness/will-this-prevent-permanently`, function (req, res) {
    var preventpermanently = req.body.preventpermanently;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (preventpermanently){
      answers[claimantType].preventpermanently = preventpermanently;
      if (preventpermanently == 'yes') {
        res.redirect(`${appRoot}/questions/illness/industrial-injuries-disablement-benefit?${claimantType}`);
      } else {
        res.redirect(`${appRoot}/questions/illness/fitnote?${claimantType}`);
      }
    }
    else {
      res.render(`${appRootRel}/questions/illness/will-this-prevent-permanently`);
    }
  });

  router.all(`${appRoot}/questions/illness/fitnote`, function (req, res) {
    var illFitnote = req.body.illFitnote;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (illFitnote){
      answers[claimantType].illFitnote = illFitnote;
      if (illFitnote == 'yes') {
        res.redirect(`${appRoot}/questions/evidence-illness?${claimantType}`);
      } else {
        res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      }
    }
    else {
      res.render(`${appRootRel}/questions/illness/fitnote`);
    }
  });

  router.all(`${appRoot}/questions/illness/industrial-injuries-disablement-benefit`, function (req, res) {
    var ijbbenefit = req.body.ijbbenefit;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (ijbbenefit){
      answers[claimantType].ijbbenefit = ijbbenefit;
      res.redirect(`${appRoot}/questions/when-did-employment-end?${claimantType}`);
    }
    else {
      res.render(`${appRootRel}/questions/illness/industrial-injuries-disablement-benefit`);
    }
  });

  router.all(`${appRoot}/questions/when-did-employment-end`, function (req, res) {
    var employmentEnd = req.body.employmentEnd;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (employmentEnd){
      answers[claimantType].employmentEnd = employmentEnd;

      if(employmentEnd == '1 week ago'){
        res.redirect(`${appRoot}/questions/illness/medical-certificates?${claimantType}`);
      }
      else {
        res.redirect(`${appRoot}/questions/looking-for-work?${claimantType}`);
      }
    }
    else {
      res.render(`${appRootRel}/questions/when-did-employment-end`);
    }
  });

  router.all(`${appRoot}/questions/looking-for-work`, function (req, res) {
    var lookingforwork = req.body.lookingforwork;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (lookingforwork){
      answers[claimantType].lookingforwork = lookingforwork;
      if(lookingforwork == 'yes'){
        res.redirect(`${appRoot}/questions/illness/claim-uc-sooner?${claimantType}`);
      }
      else {
        if (answers[claimantType].ukstudent == 'yes'){
          res.redirect(`${appRoot}/questions/job-seeker-student/study-hours?${claimantType}`);
        } else {
          res.redirect(`${appRoot}/questions/illness/medical-certificates?${claimantType}`);
        }
      }
    }
    else {
      res.render(`${appRootRel}/questions/looking-for-work`);
    }
  });

  router.all(`${appRoot}/questions/illness/claim-uc-sooner`, function (req, res) {
    var whyDidntClaimUcSooner = req.body.whyDidntClaimUcSooner;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (whyDidntClaimUcSooner){
      answers[claimantType].whyDidntClaimUcSooner = whyDidntClaimUcSooner;
      if(answers[claimantType].ukstudent == 'yes'){
        res.redirect(`${appRoot}/questions/job-seeker-student/study-hours?${claimantType}`);
      } else {
        res.redirect(`${appRoot}/questions/illness/medical-certificates?${claimantType}`);
      }
    }
    else {
      res.render(`${appRootRel}/questions/illness/claim-uc-sooner`);
    }
  });

  router.all(`${appRoot}/questions/illness/medical-certificates`, function (req, res) {
    var medCerts = req.body.medCerts;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (medCerts){
      answers[claimantType].medCerts = medCerts;

      if (medCerts == 'Yes'){
        res.redirect(`${appRoot}/questions/illness/when-did-they-arrive?${claimantType}`);
      } else {
        res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      }
    }
    else {
      res.render(`${appRootRel}/questions/illness/medical-certificates`);
    }
  });

  router.all(`${appRoot}/questions/illness/when-did-they-arrive`, function (req, res) {
    var lengthOfTimeInUK = req.body.lengthOfTimeInUK;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (lengthOfTimeInUK){
      answers[claimantType].lengthOfTimeInUK = lengthOfTimeInUK;
      res.redirect(`${appRoot}/questions/evidence-illness?${claimantType}`);
    }
    else {
      res.render(`${appRootRel}/questions/illness/when-did-they-arrive`);
    }
  });

  router.all(`${appRoot}/questions/evidence-illness`, function (req, res) {
    var evidenceToday = req.body.evidenceToday;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (evidenceToday){
      answers[claimantType].evidenceToday = evidenceToday;
      if (evidenceToday == 'yes'){
        res.redirect(`${appRoot}/outcomes/${outcomes.eeaSickWithEvidence.id}?${claimantType}`);
      } else {
        res.redirect(`${appRoot}/outcomes/${outcomes.eeaSickWithoutEvidence.id}?${claimantType}`);
      }
    }
    else {
      res.render(`${appRootRel}/questions/evidence-illness`);
    }
  });

  // ################ PYCA-631 Prev Self Employed Changes ##############################
  router.all(`${appRoot}/questions/previously-self-employed/when-did-self-employment-start`, function (req, res) {
    var prevSelfEmploymentStart = req.body.prevSelfEmploymentStart;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (prevSelfEmploymentStart){
      answers[claimantType].prevSelfEmploymentStart = prevSelfEmploymentStart;
      res.redirect(`${appRoot}/questions/previously-self-employed/when-did-self-employment-end?${claimantType}`);
    }
    else {
      res.render(`${appRootRel}/questions/previously-self-employed/when-did-self-employment-start`);
    }
  });

  router.all(`${appRoot}/questions/previously-self-employed/when-did-self-employment-end`, function (req, res) {
    var prevSelfEmploymentEnd = req.body.prevSelfEmploymentEnd;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (prevSelfEmploymentEnd){
      answers[claimantType].prevSelfEmploymentEnd = prevSelfEmploymentEnd;
      res.redirect(`${appRoot}/questions/previously-self-employed/self-employed-hours-worked?${claimantType}`);
    }
    else {
      res.render(`${appRootRel}/questions/previously-self-employed/when-did-self-employment-end`);
    }
  });

  router.all(`${appRoot}/questions/previously-self-employed/self-employed-hours-worked`, function (req, res) {
    var prevSelfEmployedHours = req.body.prevSelfEmployedHours;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (prevSelfEmployedHours){
      answers[claimantType].prevSelfEmployedHours = prevSelfEmployedHours;
      res.redirect(`${appRoot}/questions/previously-self-employed/monthly-average-earnings?${claimantType}`);
    }
    else {
      res.render(`${appRootRel}/questions/previously-self-employed/self-employed-hours-worked`);
    }
  });

  router.all(`${appRoot}/questions/previously-self-employed/monthly-average-earnings`, function (req, res) {
    var prevMonthlyAverageEarnings = req.body.prevMonthlyAverageEarnings;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (prevMonthlyAverageEarnings){
      answers[claimantType].prevMonthlyAverageEarnings = prevMonthlyAverageEarnings;
      res.redirect(`${appRoot}/questions/previously-self-employed/why-did-self-employment-end?${claimantType}`);
    }
    else {
      res.render(`${appRootRel}/questions/previously-self-employed/monthly-average-earnings`);
    }
  });

  router.all(`${appRoot}/questions/previously-self-employed/why-did-self-employment-end`, function (req, res) {
    var reasonPrevSelfEmploymentEnded = req.body.reasonPrevSelfEmploymentEnded;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (reasonPrevSelfEmploymentEnded){
      answers[claimantType].reasonPrevSelfEmploymentEnded = reasonPrevSelfEmploymentEnded;
      if(reasonPrevSelfEmploymentEnded == 'illness'){
        res.redirect(`${appRoot}/questions/previously-self-employed/fitnote?${claimantType}`);
      }
      else {
        res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      }
    }
    else {
      res.render(`${appRootRel}/questions/previously-self-employed/why-did-self-employment-end`);
    }
  });

  router.all(`${appRoot}/questions/previously-self-employed/fitnote`, function (req, res) {
    var prevSelfEmployedFitnote = req.body.prevSelfEmployedFitnote;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (prevSelfEmployedFitnote){
      answers[claimantType].prevSelfEmployedFitnote = prevSelfEmployedFitnote;
      if(prevSelfEmployedFitnote == 'yes'){
        res.redirect(`${appRoot}/questions/previously-self-employed/when-did-they-arrive?${claimantType}`);
      }
      else {
        res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      }
    }
    else {
      res.render(`${appRootRel}/questions/previously-self-employed/fitnote`);
    }
  });

  router.all(`${appRoot}/questions/previously-self-employed/when-did-they-arrive`, function (req, res) {
    var prevSelfEmployedArrivalInUkYear = req.body.prevSelfEmployedArrivalInUkYear;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (prevSelfEmployedArrivalInUkYear) {
      answers[claimantType].prevSelfEmployedArrivalInUkYear = prevSelfEmployedArrivalInUkYear;
      res.redirect(`${appRoot}/questions/previously-self-employed/evidence-prev-selfemp?${claimantType}`);
    }
    else {
      res.render(`${appRootRel}/questions/previously-self-employed/when-did-they-arrive`);
    }
  });

  router.all(`${appRoot}/questions/previously-self-employed/evidence-prev-selfemp`, function (req, res) {
    var evidenceToday = req.body.evidenceToday;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (evidenceToday) {
      answers[claimantType].evidenceToday = evidenceToday;

      if (evidenceToday == 'yes'){
        res.redirect(`${appRoot}/outcomes/${outcomes.eeaPrevSelfEmployedWithEvidence.id}?${claimantType}`);
      } else {
        res.redirect(`${appRoot}/outcomes/${outcomes.eeaPrevSelfEmployedWithoutEvidence.id}?${claimantType}`);
      }
    }
    else {
      res.render(`${appRootRel}/questions/previously-self-employed/evidence-prev-selfemp`);
    }
  });

  // ####################### Job Seeker ########################################
  router.all(`${appRoot}/questions/job-seeker-student/uk-look-for-work`, function (req, res) {
    var studentLookForWork = req.body.studentLookForWork; 
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (studentLookForWork) {
      answers[claimantType].studentLookForWork = studentLookForWork;
      if (studentLookForWork == 'yes'){
        res.redirect(`${appRoot}/questions/job-seeker-student/time-looking-for-work?${claimantType}`);
      } else {
        res.redirect(`${appRoot}/questions/job-seeker-student/uk-student?${claimantType}`);
      }
    } else {
      res.render(`${appRootRel}/questions/job-seeker-student/uk-look-for-work`);
    }
  });

  router.all(`${appRoot}/questions/job-seeker-student/time-looking-for-work`, function (req, res) {
    var lookingforwork = req.body.lookingforwork;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (lookingforwork) {
      answers[claimantType].lookingforwork = lookingforwork;
      res.redirect(`${appRoot}/questions/job-seeker-student/evidence-jobseeker-student?${claimantType}`);
    } else {
      res.render(`${appRootRel}/questions/job-seeker-student/time-looking-for-work`);
    }
  });

  router.all(`${appRoot}/questions/job-seeker-student/evidence-jobseeker-student`, function (req, res) {
    var evidenceToday = req.body.evidenceToday;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (evidenceToday) {
      answers[claimantType].evidenceToday = evidenceToday;
      if (evidenceToday == 'yes'){
        res.redirect(`${appRoot}/outcomes/${outcomes.eeaLooking4WorkWithEvidence.id}?${claimantType}`);
      } else {
        res.redirect(`${appRoot}/outcomes/${outcomes.eeaLooking4WorkWithoutEvidence.id}?${claimantType}`);
      }
    } else {
      res.render(`${appRootRel}/questions/job-seeker-student/evidence-jobseeker-student`);
    }
  });

  // ####################### Student ########################################
  router.all(`${appRoot}/questions/job-seeker-student/uk-student`, function (req, res) {
    var ukstudent = req.body.ukstudent;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (ukstudent) {
      answers[claimantType].ukstudent = ukstudent;
        res.redirect(`${appRoot}/questions/job-seeker-student/csi-policy?${claimantType}`)
    } else {
      res.render(`${appRootRel}/questions/job-seeker-student/uk-student`);
    }
  });

  router.all(`${appRoot}/questions/job-seeker-student/csi-policy`, function (req, res) {
    var studentcsi = req.body.studentcsi;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (studentcsi) {
      answers[claimantType].studentcsi = studentcsi;
      // Use this 1 question handler for when the claimant is and is not a student

      if(answers[claimantType].ukstudent == 'yes'){
        if (studentcsi == 'yes'){
          // Student with a CSI policy
          res.redirect(`${appRoot}/questions/job-seeker-student/csi-policy-start?${claimantType}`);
        } else {
          // Student withOUT a CSI policy
          res.redirect(`${appRoot}/questions/job-seeker-student/course-start?${claimantType}`);
        }
      }
      else {
        if (studentcsi == 'yes'){
          // Not a student but has a CSI policy
          res.redirect(`${appRoot}/questions/job-seeker-student/csi-policy-start?${claimantType}`);
        } else {
          // Not a student and no CSI policy
          res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
        }
      }
    } else {
      res.render(`${appRootRel}/questions/job-seeker-student/csi-policy`);
    }
  });

  router.all(`${appRoot}/questions/job-seeker-student/csi-policy-start`, function (req, res) {
    var studentcsistart = req.body.studentcsistart;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (studentcsistart) {
      answers[claimantType].studentcsistart = studentcsistart;

      if(answers[claimantType].ukstudent == 'yes'){
        res.redirect(`${appRoot}/questions/job-seeker-student/course-start?${claimantType}`);
      } else {
        res.redirect(`${appRoot}/questions/job-seeker-student/evidence-jobseeker-student?${claimantType}`);
      }
        // Use routing for those looking for work.
    } else {
      res.render(`${appRootRel}/questions/job-seeker-student/csi-policy-start`);
    }
  });

  router.all(`${appRoot}/questions/job-seeker-student/course-start`, function (req, res) {
    var courseStarted = req.body.courseStarted;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (courseStarted) {
      answers[claimantType].courseStarted = courseStarted;
      res.redirect(`${appRoot}/questions/job-seeker-student/has-the-course-ended?${claimantType}`);
    } else {
      res.render(`${appRootRel}/questions/job-seeker-student/course-start`);
    }
  });

  router.all(`${appRoot}/questions/job-seeker-student/has-the-course-ended`, function (req, res) {
    var courseended = req.body.courseended;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (courseended) {
      answers[claimantType].courseended = courseended;

      if(courseended == 'yes'){
        res.redirect(`${appRoot}/questions/job-seeker-student/course-end?${claimantType}`);
      } else {
        res.redirect(`${appRoot}/questions/job-seeker-student/study-hours?${claimantType}`);
      }

    } else {
      res.render(`${appRootRel}/questions/job-seeker-student/has-the-course-ended`);
    }
  });

  router.all(`${appRoot}/questions/job-seeker-student/study-hours`, function (req, res) {
    var studyhours = req.body.studyhours;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (studyhours) {
      answers[claimantType].studyhours = studyhours;
      res.redirect(`${appRoot}/questions/job-seeker-student/study-finance?${claimantType}`);
    } else {
      res.render(`${appRootRel}/questions/job-seeker-student/study-hours`);
    }
  });

  router.all(`${appRoot}/questions/job-seeker-student/study-finance`, function (req, res) {
    var studyfinance = req.body.studyfinance;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (studyfinance) {
      answers[claimantType].studyhours = studyfinance;
      res.redirect(`${appRoot}/questions/job-seeker-student/when-did-they-arrive?${claimantType}`);
    } else {
      res.render(`${appRootRel}/questions/job-seeker-student/study-finance`);
    }
  });

  router.all(`${appRoot}/questions/job-seeker-student/when-did-they-arrive`, function (req, res) {
    var notWorkingArrivalInUkYear = req.body.notWorkingArrivalInUkYear;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (notWorkingArrivalInUkYear) {
      answers[claimantType].notWorkingArrivalInUkYear = notWorkingArrivalInUkYear;
      res.redirect(`${appRoot}/questions/job-seeker-student/evidence-jobseeker-student?${claimantType}`);
    } else {
      res.render(`${appRootRel}/questions/job-seeker-student/when-did-they-arrive`);
    }
  });

  router.all(`${appRoot}/questions/job-seeker-student/course-end`, function (req, res) {
    var courseEnded = req.body.courseEnded;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (courseEnded) {
      answers[claimantType].courseEnded = courseEnded;

      if(courseEnded == '1 week ago'){
        res.redirect(`${appRoot}/questions/job-seeker-student/study-hours?${claimantType}`);
      } else {
        res.redirect(`${appRoot}/questions/looking-for-work?${claimantType}`);
      }

    } else {
      res.render(`${appRootRel}/questions/job-seeker-student/course-end`);
    }
  });

  // ####################### pregnancy / childbirth#############################
  router.all(`${appRoot}/questions/pregnancy/letter-employer`, function (req, res) {
    var employerletter = req.body.employerletter;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (employerletter) {
      answers[claimantType].employerletter = employerletter;

      if(employerletter == 'yes'){
        res.redirect(`${appRoot}/questions/pregnancy/currently-looking-for-work?${claimantType}`);
      } else {
        res.redirect(`${appRoot}/questions/pregnancy/when-did-employment-end?${claimantType}`);
      }

    } else {
      res.render(`${appRootRel}/questions/pregnancy/letter-employer`);
    }
  });

  router.all(`${appRoot}/questions/pregnancy/when-did-employment-end`, function (req, res) {
    var pregnancyemploymentend = req.body.pregnancyemploymentend;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (pregnancyemploymentend) {
      answers[claimantType].pregnancyemploymentend = pregnancyemploymentend;

      switch (pregnancyemploymentend) {
        case '<1week':
        case '1week':
          res.redirect(`${appRoot}/questions/pregnancy/currently-looking-for-work?${claimantType}`);
          break;
        case '>1week':
        case '<1month':
        case '>1month':
          res.redirect(`${appRoot}/questions/pregnancy/looking-for-work?${claimantType}`);
          break;
      }
    }
    else {
      res.render(`${appRootRel}/questions/pregnancy/when-did-employment-end`);
    }
  });

  router.all(`${appRoot}/questions/pregnancy/currently-looking-for-work`, function (req, res) {
    var currentlylookingforwork = req.body.currentlylookingforwork;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (currentlylookingforwork) {
      answers[claimantType].currentlylookingforwork = currentlylookingforwork;
      res.redirect(`${appRoot}/questions/pregnancy/currently-pregnant?${claimantType}`);
    } else {
      res.render(`${appRootRel}/questions/pregnancy/currently-looking-for-work`);
    }
  });

  router.all(`${appRoot}/questions/pregnancy/looking-for-work`, function (req, res) {
    var lookingforwork = req.body.lookingforwork;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (lookingforwork) {
      answers[claimantType].lookingforwork = lookingforwork;
      if(lookingforwork == 'yes'){
        res.redirect(`${appRoot}/questions/pregnancy/claim-uc-sooner?${claimantType}`);
      }
      else {
        res.redirect(`${appRoot}/questions/pregnancy/currently-pregnant?${claimantType}`);
      }
    } else {
      res.render(`${appRootRel}/questions/pregnancy/looking-for-work`);
    }
  });

  router.all(`${appRoot}/questions/pregnancy/claim-uc-sooner`, function (req, res) {
    var whyDidntClaimUcSooner = req.body.whyDidntClaimUcSooner;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (whyDidntClaimUcSooner) {
      answers[claimantType].whyDidntClaimUcSooner = whyDidntClaimUcSooner;
      res.redirect(`${appRoot}/questions/pregnancy/currently-pregnant?${claimantType}`);
    } else {
      res.render(`${appRootRel}/questions/pregnancy/claim-uc-sooner`);
    }
  });

  router.all(`${appRoot}/questions/pregnancy/currently-pregnant`, function (req, res) {
    var pregnant = req.body.pregnant;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (pregnant) {
      answers[claimantType].pregnant = pregnant;
      res.redirect(`${appRoot}/questions/pregnancy/back-to-work?${claimantType}`);
    } else {
      res.render(`${appRootRel}/questions/pregnancy/currently-pregnant`);
    }
  });

  router.all(`${appRoot}/questions/pregnancy/back-to-work`, function (req, res) {
    var backtowork = req.body.backtowork;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (backtowork) {
      answers[claimantType].backtowork = backtowork;
      if (backtowork == 'yes'){
        res.redirect(`${appRoot}/questions/pregnancy/when-back-to-work?${claimantType}`);
      } else {
        res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
      }
    } else {
      res.render(`${appRootRel}/questions/pregnancy/back-to-work`);
    }
  });

  router.all(`${appRoot}/questions/pregnancy/when-back-to-work`, function (req, res) {
    var whenbacktowork = req.body.whenbacktowork;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (whenbacktowork) {
      answers[claimantType].whenbacktowork = whenbacktowork;
      res.redirect(`${appRoot}/questions/pregnancy/when-did-they-arrive?${claimantType}`);
    } else {
      res.render(`${appRootRel}/questions/pregnancy/when-back-to-work`);
    }
  });

  router.all(`${appRoot}/questions/pregnancy/when-did-they-arrive`, function (req, res) {
    var pregnantArrivalInUkYear = req.body.pregnantArrivalInUkYear;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (pregnantArrivalInUkYear) {
      answers[claimantType].pregnantArrivalInUkYear = pregnantArrivalInUkYear;
      res.redirect(`${appRoot}/questions/pregnancy/evidence-preg?${claimantType}`);
    } else {
      res.render(`${appRootRel}/questions/pregnancy/when-did-they-arrive`);
    }
  });

  router.all(`${appRoot}/questions/pregnancy/evidence-preg`, function (req, res) {
    var evidenceToday = req.body.evidenceToday;
    var answers = req.session[config.slug].answers;
    var claimantType = res.locals.currentApp.claimantType;

    if (evidenceToday) {
      answers[claimantType].evidenceToday = evidenceToday;
      if (evidenceToday == 'yes'){
      res.redirect(`${appRoot}/outcomes/${outcomes.pregnantFastTrack.id}?${claimantType}`);
      } else {
      res.redirect(`${appRoot}/outcomes/${outcomes.pregnantFastTrackFurtherEvidenceRequired.id}?${claimantType}`);

      }
    } else {
      res.render(`${appRootRel}/questions/pregnancy/evidence-preg`);
    }
  });
  // ####################### END PYCA-631 Changes ##############################

  return router

}
