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
	  },
	  bookFurtherEvidenceInterviewBRP: {
	    id: 'END015',
	    status: 'NonEEA with no BRP on the day of the initial interview'
	  },
	  bookFurtherEvidenceInterviewMarriage: {
	    id: 'END016',
	    status: 'Married NonEEA with no marriage certificate on the day of the initial interview'
	  },
		noHRTRequired: {
			id: 'END017',
			status: 'Fill in section 1 of the ALP'
		},
		makeaDecision: {
			id: 'END018',
			status: 'Fill in section 2 of the ALP'
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
	           && answers.claimant.familyMember === 'no' && answers.claimant.outOfUk === 'yes')) {

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
	// Branching for citizens
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
				res.redirect(`${appRoot}/questions/out-of-uk?${claimantType}`);
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
	      res.redirect(`${appRoot}/questions/brp-refugee?${claimantType}`);
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

	router.all(`${appRoot}/questions/brp-refugee`, function (req, res) {
		var brprefugee = req.body.brprefugee;
		var answers = req.session[config.slug].answers;
		var claimantType = res.locals.currentApp.claimantType;

		if (brprefugee) {
			answers[claimantType].brprefugee = brprefugee;

			// Has Refugee BRP
			if (brprefugee === 'yes') {
				res.redirect(`${appRoot}/questions/brp-refugee-status?${claimantType}`);
			}

			// Does not have refugee BRP
			else if (brprefugee === 'no') {
				res.redirect(`${appRoot}/outcomes/${outcomes.refugee.id}?${claimantType}`);
			}

			else if (res.locals.currentApp.isPartnerFlow && brprefugee === 'unknown') {
				res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
			}
		}

		else {
			res.render(`${appRootRel}/questions/brp-refugee`);
		}
	});

	router.all(`${appRoot}/questions/brp-refugee-status`, function (req, res) {
		var brprefugeestatus = req.body.brprefugeestatus;
		var answers = req.session[config.slug].answers;
		var claimantType = res.locals.currentApp.claimantType;

		if (brprefugeestatus) {
			answers[claimantType].brprefugeestatus = brprefugeestatus;

			// Has Refugee status on their BRP
			if (brprefugeestatus === 'yes') {
				res.redirect(`${appRoot}/questions/brp-refugee-date?${claimantType}`);
			}

			// Does not have refugee status on their BRP
			else if (brprefugeestatus === 'no') {
				res.redirect(`${appRoot}/questions/no-recourse-to-public-funds?${claimantType}`);
			}

			else if (res.locals.currentApp.isPartnerFlow && brprefugee === 'unknown') {
				res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}${claimantType}`);
			}
		}

		else {
			res.render(`${appRootRel}/questions/brp-refugee-status`);
		}
	});

	router.all(`${appRoot}/questions/brp-refugee-date`, function (req, res) {
		var brprefugeedate = req.body.brprefugeedate;
		var answers = req.session[config.slug].answers;
		var claimantType = res.locals.currentApp.claimantType;

		if (brprefugeedate) {
			answers[claimantType].brprefugeedate = brprefugeedate;

			// BRP is in date
			if (brprefugeedate === 'no') {
				res.redirect(`${appRoot}/outcomes/${outcomes.makeaDecision.id}?${claimantType}`);
			}

			// BRP is not in date
			else if (brprefugeedate === 'yes') {
				res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
			}

			else if (res.locals.currentApp.isPartnerFlow && brprefugeedate === 'unknown') {
				res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
			}
		}

		else {
			res.render(`${appRootRel}/questions/brp-refugee-date`);
		}
	});

	// ####################################################################
	// Branching for NonEEA citizens
	// ####################################################################
	router.all(`${appRoot}/questions/biometric-residence-permit`, function (req, res) {
	  var brp = req.body.brp;
	  var answers = req.session[config.slug].answers;
	  var claimantType = res.locals.currentApp.claimantType;

	  if (brp) {

			answers[claimantType].brp = brp;

	    // They have a british residency permit
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
	// Branching for NonEEA with a BRP
	// ####################################################################
	router.all(`${appRoot}/questions/brp-family-member`, function (req, res) {
	  var familyMember = req.body.familyMember;
	  var answers = req.session[config.slug].answers;
	  var claimantType = res.locals.currentApp.claimantType;

	  if (familyMember) {

			answers[claimantType].familyMember = familyMember;

	    // yes - family member or 'EU RIGHT TO RESIDE' are on the permit
	    if (familyMember == 'yes') {
	      res.redirect(`${appRoot}/questions/brp-family-member-relationship?${claimantType}`);
	    }

	    // No - family member or 'EU RIGHT TO RESIDE' are NOT the permit
	    else if (familyMember == 'no') {
	      res.redirect(`${appRoot}/outcomes/${outcomes.leaveToRemain.id}?${claimantType}`);
	    }

	  }

	  else {
	    res.render(`${appRootRel}/questions/brp-family-member`);
	  }

	});

	// ####################################################################
	// Branching for NonEEA with a BRP Family member
	// ####################################################################
	router.all(`${appRoot}/questions/brp-family-member-relationship`, function (req, res) {
	  var familyRelationship = req.body.familyRelationship;
	  var answers = req.session[config.slug].answers;
	  var claimantType = res.locals.currentApp.claimantType;

	  if (familyRelationship) {

			answers[claimantType].familyRelationship = familyRelationship;

	    // yes - they are a spouse or civil partner
	    if (familyRelationship == 'spouse') {
	      res.redirect(`${appRoot}/questions/marriage-certificate-today?${claimantType}`);
	    }

	    // Other - they are NOT a spouse or civil partner but something else
	    else if (familyRelationship == 'other') {
	      res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
	    }

	  }

	  else {
	    res.render(`${appRootRel}/questions/brp-family-member-relationship`);
	  }

	});

	// ####################################################################
	// Branching for NonEEA with a BRP EEA spouse
	// ####################################################################
	router.all(`${appRoot}/questions/marriage-certificate-today`, function (req, res) {
	  var marriageCertificate = req.body.marriageCertificate;
	  var answers = req.session[config.slug].answers;
	  var claimantType = res.locals.currentApp.claimantType;

	  if (marriageCertificate) {

			answers[claimantType].marriageCertificate = marriageCertificate;

	    // yes - they have a marriage certificate and its with them
	    if (marriageCertificate == 'yes') {
	      res.redirect(`${appRoot}/outcomes/${outcomes.derivedRightsNonEEA.id}?${claimantType}`);
	    }

			else if (marriageCertificate == 'no') {
				res.redirect(`${appRoot}/questions/marriage-certificate-bring?${claimantType}`);
			}

	  }

	  else {
	    res.render(`${appRootRel}/questions/marriage-certificate-today`);
	  }

	});

	// ####################################################################
	// Branching for NonEEA married to EEA spouse without a marriage certificate today
	// ####################################################################
	router.all(`${appRoot}/questions/marriage-certificate-bring`, function (req, res) {
		var marriageCertificateBring = req.body.marriageCertificateBring;
		var answers = req.session[config.slug].answers;
		var claimantType = res.locals.currentApp.claimantType;

		if (marriageCertificateBring) {

			answers[claimantType].marriageCertificateBring = marriageCertificateBring;

			// yes - they have a marriage certificate and its with them
			if (marriageCertificateBring == 'yes') {
				res.redirect(`${appRoot}/outcomes/${outcomes.bookFurtherEvidenceInterviewMarriage.id}?${claimantType}`);
			}

			else if (marriageCertificateBring == 'no') {
				res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
			}

		}

		else {
			res.render(`${appRootRel}/questions/marriage-certificate-bring`);
		}

	});






	router.all(`${appRoot}/questions/permanent-residence`, function (req, res) {
	  var permanentResidence = req.body.permanentResidence;
	  var answers = req.session[config.slug].answers;
	  var claimantType = res.locals.currentApp.claimantType;

	  if (permanentResidence) {
	    answers[claimantType].permanentResidence = permanentResidence;

	    // Permanent residence card
	    if (permanentResidence === 'yes') {
	      res.redirect(`${appRoot}/outcomes/${outcomes.permanentResident.id}?${claimantType}`);
	    }

	    // No permanent residence card
	    else if (permanentResidence === 'no') {
	      res.redirect(`${appRoot}/questions/nationality?${claimantType}`);
	    }
	  }

	  else {
	    res.render(`${appRootRel}/questions/permanent-residence`);
	  }
	});

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
          res.redirect(`${appRoot}/questions/out-of-uk?${claimantType}`);
				} else if(nationality === 'United Kingdom') {
					res.redirect(`${appRoot}/questions/british-passport-today?${claimantType}`);
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
	      res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
	    }

	    // Employed
	    else if (employeeStatus.employed === 'true') {
	      res.redirect(`${appRoot}/outcomes/${outcomes.employedEEA.id}?${claimantType}`);
	    }

	    // Not working
	    else if (employeeStatus.dontWork === 'true') {
	      res.redirect(`${appRoot}/questions/employee-status-dont-work?${claimantType}`);
	    }
	  }

	  else {
	    res.render(`${appRootRel}/questions/employee-status`);
	  }
	});

	router.all(`${appRoot}/questions/employee-status-self-employed`, function (req, res) {
	  var selfEmployedProof = req.body.selfEmployedProof;
	  var answers = req.session[config.slug].answers;
	  var claimantType = res.locals.currentApp.claimantType;

	  // Ineligible claimant (derived rights), self-employed straight to outcome
	  if (answers.claimant.isDerivedRightsFlow && answers.partner.employeeStatus.selfEmployed === 'true') {
	    res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
	    return;
	  }

	  if (selfEmployedProof) {
	    answers[claimantType].selfEmployedProof = selfEmployedProof;

	    // Self-employed proof can be provided
	    if (selfEmployedProof === 'yes') {
	      res.redirect(`${appRoot}/outcomes/${outcomes.selfEmployedEEA.id}?${claimantType}`);
	    }

	    // Self-employed proof can't be provided
	    else if (selfEmployedProof === 'no' || res.locals.currentApp.isPartnerFlow && selfEmployedProof === 'unknown') {
	      res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
	    }
	  }

	  else {
	    res.render(`${appRootRel}/questions/employee-status-self-employed`);
	  }
	});

	router.all(`${appRoot}/questions/employee-status-dont-work`, function (req, res) {
	  var dontWorkReason = req.body.dontWorkReason;
	  var answers = req.session[config.slug].answers;
	  var claimantType = res.locals.currentApp.claimantType;

	  if (dontWorkReason) {
	    answers[claimantType].dontWorkReason = dontWorkReason;

	    // Redundant
	    if (dontWorkReason === 'redundant') {
	      res.redirect(`${appRoot}/outcomes/${outcomes.redundantEEA.id}?${claimantType}`);
	    }

	    // Sick
	    if (dontWorkReason === 'sick') {
	      res.redirect(`${appRoot}/questions/fitnote?${claimantType}`);
	    }

	    // Other or Partner reason unknown
	    else if (dontWorkReason === 'other' || res.locals.currentApp.isPartnerFlow && dontWorkReason === 'unknown') {
	      res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
	    }
	  }

	  else {
	    res.render(`${appRootRel}/questions/employee-status-dont-work`);
	  }
	});

	router.all(`${appRoot}/questions/fitnote`, function(req, res) {
	  var hasFitNote = req.body.hasFitNote;
	  var answers = req.session[config.slug].answers;
	  var claimantType = res.locals.currentApp.claimantType;

	  if(hasFitNote) {
	    if(hasFitNote == 'yes') {
	      res.redirect(`${appRoot}/outcomes/${outcomes.sickEEA.id}?${claimantType}`);
	    } else if (hasFitNote == 'no') {
	      if(!!answers.claimant.outcomeId) {
	        res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
	      } else {
	        answers.claimant.isDerivedRightsFlow = true;
	        answers.claimant.outcomeId = outcomes.ineligible.id;
	        res.redirect(`${appRoot}/questions/partner?${claimantType}`);
	      }
	    } else if (hasFitNote == 'unknown') {
	      res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
	    }
	  } else {
	    res.render(`${appRootRel}/questions/fitnote`);
	  }
	});

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

	router.all(`${appRoot}/questions/family-member`, function (req, res) {
	  var familyMember = req.body.familyMember;
	  var answers = req.session[config.slug].answers;
	  var claimantType = res.locals.currentApp.claimantType;

	  if (familyMember) {
	    answers[claimantType].familyMember = familyMember;

	    // Visa says 'family member'
	    if (familyMember === 'yes') {
	      res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
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

	router.all(`${appRoot}/questions/out-of-uk`, function (req, res) {
	  var outOfUk = req.body.outOfUk;
	  var answers = req.session[config.slug].answers;
	  var claimantType = res.locals.currentApp.claimantType;

	  if (outOfUk) {
	    answers[claimantType].outOfUk = outOfUk;

	    // Out of UK more than 4 weeks
	    if (outOfUk === 'yes') {
	      res.redirect(`${appRoot}/outcomes/${outcomes.british.id}?${claimantType}`);
	    }

	    // Out of UK less than 4 weeks
	    else if (outOfUk === 'no') {
	      res.redirect(`${appRoot}/outcomes/${outcomes.noHRTRequired.id}?${claimantType}`);
	    }

	    else if (res.locals.currentApp.isPartnerFlow && outOfUk === 'unknown') {
	      res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
	    }
	  }

	  else {
	    res.render(`${appRootRel}/questions/out-of-uk`);
	  }
	});

  return router

}
