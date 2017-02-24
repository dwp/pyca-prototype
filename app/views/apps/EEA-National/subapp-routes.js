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
    router.all(`${appRoot}/index`, (req, res, next) => {
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
        bookFurtherEvidenceInterviewMarriageCert: {
            id: 'END099',
            status: "Temporary: EEA National, recently stopped work for 'other' reason. Married to working EEA national. Need to bring passport/ID and possibly a marriage certificate"
        }
    }

    config.isPartnerFlowEnabled = true

    // ####################################################################
    // Set up locals/session for all routes
    // ####################################################################
    router.all(`${appRoot}/**/*`, function(req, res, next) {

        var answers = req.session[config.slug].answers || {
            claimant: {},
            partner: {}
        };
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
    router.all(`${appRoot}/outcomes/:outcomeId`, function(req, res, next) {

        var isPartnerFlow = res.locals.currentApp.isPartnerFlow;
        var outcomeId = req.params.outcomeId;
        var answers = req.session[config.slug].answers;
        var claimantType = res.locals.currentApp.claimantType;

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
                    ((answers.claimant.isEEA && answers.claimant.dontWorkReason === 'other') ||
                        (!answers.claimant.isEEA && answers.claimant.familyMember === 'yes')) ||
                    (!answers.claimant.isEEA && answers.claimant.noRecourseToPublicFunds === 'no' &&
                        answers.claimant.familyMember === 'no' && answers.claimant.outOfUk === 'yes')) {
console.log('this is firing');
                    // Mark as derived rights flow
                    answers.claimant.isDerivedRightsFlow = true;

                    // Redirect to partner flow
                    res.redirect(`/${appRootRel}/questions/partner?claimant`);
                    return;

                }

            }

            // Has partner, override outcome based on claimant
            else if (answers.claimant.partner === 'yes' && answers.claimant.outcomeId) {

              console.log('this is firing!');

                // Save outcome
                answers.partner.outcomeId = outcomeId;

                // Does claimant outcome differ? Partner must be eligible
                if (answers.claimant.outcomeId !== outcomeId && outcomeId !== outcomes.ineligible.id) {

                  console.log('Partner is eligible');

                    // Ineligible claimant (derived rights)
                    if (answers.claimant.outcomeId === outcomes.ineligible.id) {

                      console.log('Ineligible claimant (derived rights)');

                        // Skip if already on derived rights outcome
                        if (outcomeId !== outcomes.derivedRightsNonEEA.id && outcomeId !== outcomes.derivedRightsEEA.id) {

                            console.log(`Skip if already on derived rights outcome`);
                            console.log(`The outcomeId is: ${outcomeId}`);

                            // Ineligible claimant + derived rights partner
                            if (outcomeId === outcomes.employedEEA.id ||
                                outcomeId === outcomes.sickEEA.id ||
                                outcomeId === outcomes.redundantEEA.id) {

                                  console.log(`Ineligible claimant + derived rights partner`);

                                // Force outcome to derived rights
                                answers.partner.outcomeId = answers.claimant.isEEA ?
                                    outcomes.derivedRightsEEA.id : outcomes.derivedRightsNonEEA.id;

                                // Redirect to derived rights
                                res.redirect(`${appRoot}/outcomes/${answers.partner.outcomeId}?${claimantType}`);
                                return;
                            }

                            else if (outcomeId === outcomes.bookFurtherEvidenceInterviewMarriageCert.id){
                              // Catch ineligible EEA claimant with EEA partner who needs to bring in passport/ID card and
                              // (optional) a marriage certificate
                              // Temporary fix until we look at the routing overall
                              //res.redirect(`${appRoot}/outcomes/${outcomes.bookFurtherEvidenceInterviewMarriageCert.id}?${claimantType}`);
                              res.render(`${appRootRel}/outcomes/${outcomes.bookFurtherEvidenceInterviewMarriageCert.id}`);
                              return;
                             }

                            // Otherwise still ineligible
                            else {
                                console.log(`Otherwise still ineligible`);
                                //res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
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
    router.all(`${appRoot}/questions/uk-national`, function(req, res) {
        var ukNational = req.body.ukNational;
        var answers = req.session[config.slug].answers;
        var claimantType = res.locals.currentApp.claimantType;

        if (ukNational) {

            answers[claimantType].ukNational = ukNational;

            // UK national
            if (ukNational == 'yes') {
                answers[claimantType].isEEA = true;
                res.redirect(`${appRoot}/outcomes/${outcomes.british.id}?${claimantType}`);
            }

            // Non-UK national
            else if (ukNational == 'no') {
                res.redirect(`${appRoot}/questions/nationality?${claimantType}`);
            } else if (res.locals.currentApp.isPartnerFlow && ukNational === 'unknown') {
                res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
            }

        } else {
            res.render(`${appRootRel}/questions/uk-national`);
        }

    });

    // ####################################################################
    // Branching for citizens with a passport on the day
    // ####################################################################
    router.all(`${appRoot}/questions/british-passport-today`, function(req, res) {
        var hasBritishPassportToday = req.body.britishPassportToday;
        var answers = req.session[config.slug].answers;
        var claimantType = res.locals.currentApp.claimantType;

        if (hasBritishPassportToday) {
            answers[claimantType].hasBritishPassportToday = hasBritishPassportToday;

            // UK national
            if (hasBritishPassportToday == 'yes') {
                answers[claimantType].isEEA = true;
                res.redirect(`${appRoot}/outcomes/${outcomes.british.id}?${claimantType}`);
            }

            // Non-UK national
            else if (hasBritishPassportToday == 'no') {
                res.redirect(`${appRoot}/outcomes/${outcomes.bookFurtherEvidenceInterview.id}?${claimantType}`);
            }

        } else {
            res.render(`${appRootRel}/questions/british-passport-today`);
        }

    });

    // ####################################################################
    // job
    // ####################################################################
    router.all(`${appRoot}/questions/job`, function(req, res) {
        var job = req.body.job;
        var answers = req.session[config.slug].answers;
        var claimantType = res.locals.currentApp.claimantType;

        if (job) {
            answers[claimantType].job = job;

            if (job == "yes") {
                res.redirect(`${appRoot}/questions/employee-status?${claimantType}`);
            } else {
              if (claimantType == "partner"){
                res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
              }
                res.redirect(`${appRoot}/questions/stopped-working-in-last-month?${claimantType}`);
            }
        } else {
            res.render(`${appRootRel}/questions/job`);
        }
    });

    // ####################################################################
    // Stopped working in the last month
    // ####################################################################
    router.all(`${appRoot}/questions/stopped-working-in-last-month`, function(req, res) {
        var stoppedWorkingInTheLastMonth = req.body.stoppedWorkingInTheLastMonth;
        var answers = req.session[config.slug].answers;
        var claimantType = res.locals.currentApp.claimantType;

        if (stoppedWorkingInTheLastMonth) {
            answers[claimantType].stoppedWorkingInTheLastMonth = stoppedWorkingInTheLastMonth;

            if (stoppedWorkingInTheLastMonth == "yes") {
                res.redirect(`${appRoot}/questions/employee-status-dont-work?${claimantType}`);
            } else {
                res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
            }
        } else {
            res.render(`${appRootRel}/questions/stopped-working-in-last-month`);
        }
    });

    // ####################################################################
    // Can provide a marriage certificate today
    // ####################################################################
    router.all(`${appRoot}/questions/marriage-certificate`, function(req, res) {
        var marriageCertificate = req.body.marriageCertificate;
        var answers = req.session[config.slug].answers;
        var claimantType = res.locals.currentApp.claimantType;

        if (marriageCertificate) {
            answers[claimantType].marriageCertificate = marriageCertificate;

            // Populate that a Marriage certificate will be required at a future appointment
            if (typeof answers.feiDocuments == 'undefined'){
              answers.feiDocuments = [];
            }
            answers.feiDocuments.push("marriage certificate");

            if (marriageCertificate == "yes") {
                res.redirect(`${appRoot}/questions/passport-with-them?${claimantType}`);
            } else {
                res.redirect(`${appRoot}/questions/marriage-certificate-at-future-appt?${claimantType}`);
            }
        } else {
            res.render(`${appRootRel}/questions/marriage-certificate`);
        }
    });

		// ####################################################################
		// Passport or ID Card with them today
		// ####################################################################
		router.all(`${appRoot}/questions/passport-with-them`, function(req, res) {
				var passportWithThemToday = req.body.passportWithThemToday;
				var answers = req.session[config.slug].answers;
				var claimantType = res.locals.currentApp.claimantType;

				if (passportWithThemToday) {
						answers[claimantType].passportWithThemToday = passportWithThemToday;
						if (passportWithThemToday == "yes") {
								if (res.locals.currentApp.isPartnerFlow){
									res.redirect(`${appRoot}/outcomes/${outcomes.derivedRightsEEA.id}?${claimantType}`);
								} else {
                  res.redirect(`${appRoot}/questions/payslips?${claimantType}`);
                }
						} else {
              // Answered 'no' to if they have a passport/ID card with them today
              if (res.locals.currentApp.isPartnerFlow) {
                res.redirect(`${appRoot}/questions/id-at-future-appt?${claimantType}`);
              } else {
								res.redirect(`${appRoot}/questions/payslips?${claimantType}`);
              }
            }
				} else {
						res.render(`${appRootRel}/questions/passport-with-them`);
				}
		});

    // ####################################################################
    // Can they bring ID with them to a future appointment?
    // ####################################################################
    router.all(`${appRoot}/questions/id-at-future-appt`, function(req, res) {
        var idAtFutureAppt = req.body.idAtFutureAppt;
        var answers = req.session[config.slug].answers;
        var claimantType = res.locals.currentApp.claimantType;

        if (idAtFutureAppt) {
            answers[claimantType].idAtFutureAppt = idAtFutureAppt;
            if (idAtFutureAppt == "yes") {
              console.log(`res.locals.currentApp.feiDocuments contains: ${res.locals.currentApp.feiDocuments}`);
              console.log(`feiDocuments variable contains: ${res.locals.currentApp.feiDocuments}`);
                res.redirect(`${appRoot}/outcomes/${outcomes.bookFurtherEvidenceInterviewMarriageCert.id}?${claimantType}`);
            } else {
                res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
            }
        } else {
            res.render(`${appRootRel}/questions/id-at-future-appt`);
        }
    });

    // ####################################################################
    // Can they bring a Marriage Certificate with them to a future appointment?
    // ####################################################################
    router.all(`${appRoot}/questions/marriage-certificate-at-future-appt`, function(req, res) {
        var marriageCertAtFutureAppt = req.body.marriageCertAtFutureAppt;
        var answers = req.session[config.slug].answers;
        var claimantType = res.locals.currentApp.claimantType;

        if (marriageCertAtFutureAppt) {
            answers[claimantType].marriageCertAtFutureAppt = marriageCertAtFutureAppt;
            if (marriageCertAtFutureAppt == "yes") {
                res.redirect(`${appRoot}/questions/passport-with-them?${claimantType}`);
            } else {
                res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
            }
        } else {
            res.render(`${appRootRel}/questions/marriage-certificate-at-future-appt`);
        }
    });

    // ####################################################################
    // Do they have 3 months of payslips with them today?
    // ####################################################################
    router.all(`${appRoot}/questions/payslips`, function(req, res) {
        var payslipsToday = req.body.payslipsToday;
        var answers = req.session[config.slug].answers;
        var claimantType = res.locals.currentApp.claimantType;

        if (payslipsToday) {
            answers[claimantType].payslipsToday = payslipsToday;

            if (payslipsToday == "yes") {
                if (answers[claimantType].dontWorkReason == "redundant"){
                  console.log(`I'm sendng you to: ${appRoot}/questions/redundancy`);
                  res.redirect(`${appRoot}/questions/redundancy`);
                } else if (answers[claimantType].dontWorkReason == "sick"){
                  res.redirect(`${appRoot}/questions/fitnote`);
                } else {
                  // they are employed
                  console.log(`I'm sendng you to: ${appRoot}/outcomes/${outcomes.employedEEA.id}?${claimantType} `);
                  res.redirect(`${appRoot}/outcomes/${outcomes.employedEEA.id}?${claimantType}`);
                }
            } else if (payslipsToday == "under3Months") {
              res.redirect(`${appRoot}/questions/employment-contract-today`);
            } else {
                // Does not have payslips with them today
                res.redirect(`${appRoot}/questions/id-at-future-appt`);
            }
        } else {
            res.render(`${appRootRel}/questions/payslips`);
        }
    });

    // ####################################################################
    // Do they have a redundancy letter with them today?
    // ####################################################################
    router.all(`${appRoot}/questions/redundancy`, function(req, res) {
        var redundancyLetterWithThemToday = req.body.redundancyLetterWithThemToday;
        var answers = req.session[config.slug].answers;
        var claimantType = res.locals.currentApp.claimantType;

        if (redundancyLetterWithThemToday) {
            answers[claimantType].redundancyLetterWithThemToday = redundancyLetterWithThemToday;

            if (redundancyLetterWithThemToday == "yes") {
                // END010
                console.log("sending you to END010, redundantEEA");
                res.redirect(`${appRoot}/outcomes/${outcomes.redundantEEA.id}?${claimantType}`);
            } else {
              // Populate that a redundancy letter will be required.
              if (typeof answers.feiDocuments == 'undefined'){
                answers.feiDocuments = [];
              }
              answers.feiDocuments.push("redundancy letter");

              res.redirect(`${appRoot}/questions/id-at-future-appt?${claimantType}`);
            }
        } else {
            res.render(`${appRootRel}/questions/redundancy`);
        }
    });

    // ####################################################################
    // Do they have a contract of employment with them today?
    // ####################################################################
    router.all(`${appRoot}/questions/employment-contract-today`, function(req, res) {
        var employmentContractToday = req.body.employmentContractToday;
        var answers = req.session[config.slug].answers;
        var claimantType = res.locals.currentApp.claimantType;

        if (employmentContractToday) {
            answers[claimantType].employmentContractToday = employmentContractToday;
            if (employmentContractToday == "yes") {
              res.redirect(`${appRoot}/outcomes/${outcomes.employedEEA.id}?${claimantType}`);
          } else {
              res.redirect(`${appRoot}/questions/employment-contract-at-future-appt`);
            }
        } else {
            res.render(`${appRootRel}/questions/employment-contract-today`);
        }
    });

    // ####################################################################
    // Can they bring ID with them to a future appointment?
    // ####################################################################
    router.all(`${appRoot}/questions/employment-contract-at-future-appt`, function(req, res) {
        var employmentContractAtFutureAppt = req.body.employmentContractAtFutureAppt;
        var answers = req.session[config.slug].answers;
        var claimantType = res.locals.currentApp.claimantType;

        if (employmentContractAtFutureAppt) {
            answers[claimantType].employmentContractAtFutureAppt = employmentContractAtFutureAppt;
            if (employmentContractAtFutureAppt == "yes") {
                res.redirect(`${appRoot}/outcomes/${outcomes.bookFurtherEvidenceInterview.id}?${claimantType}`);
            } else {
                res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
            }
        } else {
            res.render(`${appRootRel}/questions/employment-contract-at-future-appt`);
        }
    });

    // ####################################################################
    // Do they have fitnotes with them today?
    // ####################################################################
    router.all(`${appRoot}/questions/fitnotes-today`, function(req, res) {
        var fitnotesToday = req.body.fitnotesToday;
        var answers = req.session[config.slug].answers;
        var claimantType = res.locals.currentApp.claimantType;

        if (fitnotesToday) {
            answers[claimantType].fitnotesToday = fitnotesToday;
            if (fitnotesToday == "yes") {
                res.redirect(`${appRoot}/outcomes/${outcomes.sickEEA.id}?${claimantType}`);
                // TODO
            } else {
                res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
            }
        } else {
            res.render(`${appRootRel}/questions/fitnotes-today`);
        }
    });
    // // ####################################################################
    // // refuge
    // // ####################################################################
    // router.all(`${appRoot}/questions/refugee`, function (req, res) {
    //   var refugee = req.body.refugee;
    //   var answers = req.session[config.slug].answers;
    //   var claimantType = res.locals.currentApp.claimantType;
    //
    //   if (refugee) {
    //     answers[claimantType].refugee = refugee;
    //
    //     // Refugee
    //     if (refugee === 'yes') {
    //       res.redirect(`${appRoot}/outcomes/${outcomes.refugee.id}?${claimantType}`);
    //     }
    //
    //     // Non-refugee
    //     else if (refugee === 'no') {
    //       // res.redirect(`${appRoot}/questions/permanent-residence?${claimantType}`);
    //       res.redirect(`${appRoot}/questions/nationality?${claimantType}`);
    //     }
    //
    //     else if (res.locals.currentApp.isPartnerFlow && refugee === 'unknown') {
    //       res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
    //     }
    //   }
    //
    //   else {
    //     res.render(`${appRootRel}/questions/refugee`);
    //   }
    // });

    router.all(`${appRoot}/questions/permanent-residence`, function(req, res) {
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
        } else {
            res.render(`${appRootRel}/questions/permanent-residence`);
        }
    });

    router.all(`${appRoot}/questions/nationality`, function(req, res) {
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
                }

                // Continue
                res.redirect(`${appRoot}/questions/job?${claimantType}`);
            }

            // Non-EEA nationality
            else if (listNonEEA.indexOf(nationality) !== -1) {
                answers[claimantType].isEEA = false;
                res.redirect(`${appRoot}/questions/no-recourse-to-public-funds?${claimantType}`);
            }
        } else {
            res.render(`${appRootRel}/questions/nationality`);
        }
    });

    router.all(`${appRoot}/questions/employee-status`, function(req, res) {
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
                if (res.locals.currentApp.isPartnerFlow && claimantType == 'partner') {
										res.redirect(`${appRoot}/questions/marriage-certificate?${claimantType}`);
                } else {
                    // old behaviour before EEA changes
                    // res.redirect(`${appRoot}/outcomes/${outcomes.employedEEA.id}?${claimantType}`);
                    res.redirect(`${appRoot}/questions/passport-with-them`);
                }
            }
        } else {
            res.render(`${appRootRel}/questions/employee-status`);
        }
    });

    router.all(`${appRoot}/questions/employee-status-self-employed`, function(req, res) {
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
        } else {
            res.render(`${appRootRel}/questions/employee-status-self-employed`);
        }
    });

    router.all(`${appRoot}/questions/employee-status-dont-work`, function(req, res) {
        var dontWorkReason = req.body.dontWorkReason;
        var answers = req.session[config.slug].answers;
        var claimantType = res.locals.currentApp.claimantType;

        if (dontWorkReason) {
            answers[claimantType].dontWorkReason = dontWorkReason;

            // Redundant
            if (dontWorkReason === 'redundant') {
                res.redirect(`${appRoot}/questions/passport-with-them?${claimantType}`);
            }

            // Sick
            if (dontWorkReason === 'sick') {
                res.redirect(`${appRoot}/questions/passport-with-them?${claimantType}`);
            }

            // Other or Partner reason unknown
            else if (dontWorkReason === 'other' || res.locals.currentApp.isPartnerFlow && dontWorkReason === 'unknown') {
                res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
            }
        } else {
            res.render(`${appRootRel}/questions/employee-status-dont-work`);
        }
    });

    router.all(`${appRoot}/questions/fitnote`, function(req, res) {
        var hasFitNote = req.body.hasFitNote;
        var answers = req.session[config.slug].answers;
        var claimantType = res.locals.currentApp.claimantType;

        if (hasFitNote) {
            if (hasFitNote == 'yes') {

                // res.redirect(`${appRoot}/outcomes/${outcomes.sickEEA.id}?${claimantType}`);
                res.redirect(`${appRoot}/questions/fitnotes-today?${claimantType}`);

            } else if (hasFitNote == 'no') {

                if (!!answers.claimant.outcomeId) {

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

    router.all(`${appRoot}/questions/partner`, function(req, res) {
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
        } else {
            res.render(`${appRootRel}/questions/partner`);
        }
    });

    router.all(`${appRoot}/questions/no-recourse-to-public-funds`, function(req, res) {
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
            } else if (res.locals.currentApp.isPartnerFlow && noRecourseToPublicFunds === 'unknown') {
                res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
            }
        } else {
            res.render(`${appRootRel}/questions/no-recourse-to-public-funds`);
        }
    });

    router.all(`${appRoot}/questions/family-member`, function(req, res) {
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
            } else if (res.locals.currentApp.isPartnerFlow && familyMember === 'unknown') {
                res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
            }
        } else {
            res.render(`${appRootRel}/questions/family-member`);
        }
    });

    router.all(`${appRoot}/questions/out-of-uk`, function(req, res) {
        var outOfUk = req.body.outOfUk;
        var answers = req.session[config.slug].answers;
        var claimantType = res.locals.currentApp.claimantType;

        if (outOfUk) {
            answers[claimantType].outOfUk = outOfUk;

            // Out of UK more than 4 weeks
            if (outOfUk === 'yes') {
                res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
            }

            // Out of UK less than 4 weeks
            else if (outOfUk === 'no') {
                res.redirect(`${appRoot}/outcomes/${outcomes.leaveToRemain.id}?${claimantType}`);
            } else if (res.locals.currentApp.isPartnerFlow && outOfUk === 'unknown') {
                res.redirect(`${appRoot}/outcomes/${outcomes.ineligible.id}?${claimantType}`);
            }
        } else {
            res.render(`${appRootRel}/questions/out-of-uk`);
        }
    });

    return router

}
