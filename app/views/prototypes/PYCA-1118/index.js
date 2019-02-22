const express = require('express')
const moment = require('moment')
const router = express.Router()

// Local dependencies
const countries = require('../../../data/location-autocomplete')

/**
 * Prototype index
 */
router.all('/', (req, res) => {
  req.session.data = {}
  res.render(`${__dirname}/views/index`, { isStart: true })
})

/**
 * Redirects to first question
 */
router.all('/claimant/questions', (req, res) => {
  return res.redirect('./questions/british-passport')
})

/**
 * Question: British passport?
 */
router.all('/:type/questions/british-passport', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]

  // UK national
  if (submitted.ukNational === 'yes') {
    return res.redirect('./british-passport-today')
  }

  // Non-UK national
  if (submitted.ukNational === 'no') {
    return res.redirect('./refugee')
  }

  res.render(`${__dirname}/views/questions/british-passport`)
})

/**
 * Question: Brought passport today?
 */
router.all('/:type/questions/british-passport-today', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]

  // Brought their passport
  if (submitted.passportToday === 'yes') {
    return res.redirect('./british-passport-nationality')
  }

  // Not brought their passport
  if (submitted.passportToday === 'no') {
    return res.redirect('../../outcome/END003')
  }

  res.render(`${__dirname}/views/questions/british-passport-today`)
})

/**
 * Question: Is passport nationality British?
 */
router.all('/:type/questions/british-passport-nationality', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]
  const saved = req.session.data[type]

  // British citizen
  if (submitted.britishCitizen === 'yes') {
    saved.nationality = 'country:GB'
    return res.redirect('./out-of-country')
  }

  // Not British citizen
  if (submitted.britishCitizen === 'no') {
    return res.redirect('../../outcome/END003')
  }

  res.render(`${__dirname}/views/questions/british-passport-nationality`)
})

/**
 * Question: Out of the UK for more than 4 weeks?
 */
router.all('/:type/questions/out-of-country', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]
  const saved = req.session.data[type]

  // Out of country?
  if (submitted.outOfCountryFourWeeks === 'yes') {
    return res.redirect(saved.britishCitizen === 'yes'
      ? './out-of-country-return-date' : './out-of-country-return-period')
  }

  // Not out of country
  if (submitted.outOfCountryFourWeeks === 'no') {
    return res.redirect(saved.britishCitizen === 'yes'
      ? '../../outcome/END015' : '../../outcome/END102')
  }

  res.render(`${__dirname}/views/questions/out-of-country`)
})

/**
 * Question: Out of the UK since the card was issued?
 */
router.all('/:type/questions/out-of-country-since-date', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]
  const saved = req.session.data[type]

  // Date components
  saved.brpIssueDate = formatDate(saved.brpIssueDate)
  const { day, month, year, date } = saved.brpIssueDate

  // Out of country since card was issued?
  if (submitted.outOfCountryYesNo === 'yes' && day && month && year) {
    const twoYearsAgo = moment.utc().startOf('day').subtract(2, 'years')

    // Is the date valid but less than 2 years ago
    if (date.isValid() && date.isSameOrBefore(twoYearsAgo)) {
      return res.redirect('./out-of-country-settlement')
    }

    return res.redirect('./out-of-country-since-date')
  }

  // Not out of country since card was issued?
  if (submitted.outOfCountryYesNo === 'no') {
    return res.redirect('../../outcome/END102')
  }

  res.render(`${__dirname}/views/questions/out-of-country-since-date`)
})

/**
 * Question: What is the longest period out of the UK?
 */
router.all('/:type/questions/out-of-country-settlement', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]
  const saved = req.session.data[type]

  // Date components
  saved.brpIssueDate = formatDate(saved.brpIssueDate)
  const { date } = saved.brpIssueDate

  // Out of country more than 2 years?
  if (submitted.outOfCountry === 'over-two-years') {
    return res.redirect('../../outcome/END003')
  }

  // Out of country more than 4 weeks?
  if (submitted.outOfCountry === 'up-to-two-years') {
    const today = moment.utc().startOf('day')
    const oneMonthAgo = moment(today).subtract(1, 'month')

    // Permit issued on or less than one month ago? Skip return date check
    if (date.isValid() && date.isAfter(oneMonthAgo)) {
      saved.outOfUkReturnPeriod = 'up-to-one-month'
      return res.redirect('../../outcome/END006')
    }

    return res.redirect('./out-of-country')
  }

  // Out of country less than 4 weeks
  if (submitted.outOfCountry === 'up-to-four-weeks') {
    return res.redirect('../../outcome/END100')
  }

  res.render(`${__dirname}/views/questions/out-of-country-settlement`)
})

/**
 * Question: What date did they return?
 */
router.all('/:type/questions/out-of-country-return-date', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]
  const saved = req.session.data[type]

  // Date components
  saved.outOfUkReturn = formatDate(saved.outOfUkReturn)
  const { day, month, year, date } = saved.outOfUkReturn

  // All three date fields provided
  if (submitted.outOfUkReturn && day && month && year) {
    const today = moment.utc().startOf('day')

    // Is the date valid and in the past?
    if (date.isValid() && date.isBefore(today)) {
      // More than six months ago
      if (date.isBefore(moment(today).subtract(6, 'months'))) {
        return res.redirect('../../outcome/END101')
      }

      // More than one month ago
      if (date.isBefore(moment(today).subtract(1, 'month'))) {
        return res.redirect('./employment-status-yes-no')
      }

      // Less than or one month ago
      return res.redirect('../../outcome/END001')
    }
  }

  res.render(`${__dirname}/views/questions/out-of-country-return-date`)
})

/**
 * Question: How long have they been back?
 */
router.all('/:type/questions/out-of-country-return-period', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]

  // Less than 1 month
  if (submitted.outOfUkReturnPeriod === 'up-to-one-month') {
    return res.redirect('../../outcome/END006')
  }

  // Between 1 and 6 months
  if (submitted.outOfUkReturnPeriod === 'up-to-six-months') {
    return res.redirect('./employment-status-yes-no')
  }

  // Over six months
  if (submitted.outOfUkReturnPeriod === 'over-six-months') {
    return res.redirect('../../outcome/END100')
  }

  res.render(`${__dirname}/views/questions/out-of-country-return-period`)
})

/**
 * Question: Is this person a refugee?
 */
router.all('/:type/questions/refugee', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]

  // Refugee?
  if (submitted.refugee === 'yes') {
    return res.redirect('./residence-permit')
  }

  // Not a refugee
  if (submitted.refugee === 'no') {
    return res.redirect('./nationality')
  }

  res.render(`${__dirname}/views/questions/refugee`)
})

/**
 * Question: Nationality?
 */
router.all('/:type/questions/nationality', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]
  const saved = req.session.data[type]

  // Saved data by type
  const claimant = req.session.data.claimant
  const partner = req.session.data.partner

  // Claimant submitted answers
  if (type === 'claimant' && submitted.nationality) {
    saved.britishCitizen = 'no'

    if (claimant.nationality === 'country:GB') {
      return res.redirect('./british-passport-today')
    }

    if (claimant.nationality === 'country:IE') {
      return res.redirect('../../outcome/END001')
    }

    if (claimant.nationality === 'country:CH') {
      return res.redirect('./residence-sticker-pink')
    }

    if (claimant.nationality === 'country:BG') {
      return res.redirect('./residence-sticker-yellow')
    }

    if (claimant.nationality === 'country:HR' || claimant.nationality === 'country:RO') {
      return res.redirect('./residence-sticker-purple-or-yellow')
    }

    if (claimant.isCESC || claimant.isECSMA) {
      return res.redirect('../../outcome/END003')
    }

    if (claimant.isEEA) {
      return res.redirect('./residence-sticker-blue')
    }

    if (!claimant.isEEA) {
      return res.redirect('./residence-permit')
    }
  }

  // Partner submitted answers
  if (type === 'partner' && submitted.nationality) {
    // Claimant and partner from Isle of Man
    if (claimant.nationality === 'territory:IM' && partner.nationality === 'territory:IM') {
      return res.redirect('../../outcome/END012')
    }

    // Claimant is ill
    if (claimant.dontWorkReason === 'illness') {
      if (partner.nationality === 'country:GB') {
        return res.redirect('../../outcome/END012')
      }
    }

    // Claimant is unemployed
    if (claimant.dontWorkReason === 'other') {
      if (['country:IE', 'territory:IM'].includes(claimant.nationality)) {
        return res.redirect('../../outcome/END003')
      }
    }

    // Partner from UK, Ireland or Isle of Man
    if (['country:GB', 'country:IE', 'territory:IM'].includes(partner.nationality)) {
      return res.redirect('../../outcome/END003')
    }

    if (partner.isEEA) {
      return res.redirect('./employment-status')
    }

    return res.redirect('../../outcome/END003')
  }

  res.render(`${__dirname}/views/questions/nationality`, {
    items: countries.list(saved.nationality)
  })
})

/**
 * Question: Have they brought a pink card with a residence sticker in it?
 */
router.all('/:type/questions/residence-sticker-pink', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]

  if (submitted.residenceStickerPink === 'yes') {
    return res.redirect('./residence-sticker-issued')
  }

  if (submitted.residenceStickerPink === 'no') {
    return res.redirect('./in-country-five-years')
  }

  res.render(`${__dirname}/views/questions/residence-sticker-pink`)
})

/**
 * Question: Have they brought a yellow card with a residence sticker in it?
 */
router.all('/:type/questions/residence-sticker-yellow', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]

  if (submitted.residenceStickerYellow === 'yes') {
    return res.redirect('./residence-sticker-issued')
  }

  if (submitted.residenceStickerYellow === 'no') {
    return res.redirect('./in-country-five-years')
  }

  res.render(`${__dirname}/views/questions/residence-sticker-yellow`)
})

/**
 * Question: Have they brought a purple or yellow card with a residence sticker in it?
 */
router.all('/:type/questions/residence-sticker-purple-or-yellow', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]

  if (submitted.residenceStickerPurpleYellow === 'yes') {
    return res.redirect('./residence-sticker-issued')
  }

  if (submitted.residenceStickerPurpleYellow === 'no') {
    return res.redirect('./in-country-five-years')
  }

  res.render(`${__dirname}/views/questions/residence-sticker-purple-or-yellow`)
})

/**
 * Question: Have they brought a blue card with a residence sticker in it?
 */
router.all('/:type/questions/residence-sticker-blue', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]

  if (submitted.residenceStickerBlue === 'yes') {
    return res.redirect('./residence-sticker-issued')
  }

  if (submitted.residenceStickerBlue === 'no') {
    return res.redirect('./in-country-five-years')
  }

  res.render(`${__dirname}/views/questions/residence-sticker-blue`)
})

/**
 * Question: Where was the document issued?
 */
router.all('/:type/questions/residence-sticker-issued', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]

  if (submitted.residenceStickerIssued) {
    if (submitted.residenceStickerIssued === 'elsewhere') {
      return res.redirect('./in-country-five-years')
    }

    return res.redirect('./residence-sticker-type')
  }

  res.render(`${__dirname}/views/questions/residence-sticker-issued`)
})

/**
 * Question: Which of these words are shown under ‘type of document’?
 */
router.all('/:type/questions/residence-sticker-type', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]

  if (submitted.residenceStickerType) {
    if (submitted.residenceStickerType === 'permanent') {
      return res.redirect('./residence-sticker-ooc')
    }

    return res.redirect('./in-country-five-years')
  }

  res.render(`${__dirname}/views/questions/residence-sticker-type`)
})

/**
 * Question: Since the card was issued, what’s the longest period they’ve spend out of the UK?
 */
router.all('/:type/questions/residence-sticker-ooc', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]

  if (submitted.residenceStickerOOC === 'up-to-two-years') {
    return res.redirect('../../outcome/END014')
  }

  if (submitted.residenceStickerOOC === 'over-two-years') {
    return res.redirect('./employment-status')
  }

  res.render(`${__dirname}/views/questions/residence-sticker-ooc`)
})

/**
 * Question: Have they been living in the UK for the last 5 years?
 */
router.all('/:type/questions/in-country-five-years', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]

  if (submitted.inCountry) {
    return res.redirect('./employment-status')
  }

  res.render(`${__dirname}/views/questions/in-country-five-years`)
})

/**
 * Question: Have they brought a residence permit?
 */
router.all('/:type/questions/residence-permit', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]
  const saved = req.session.data[type]

  // Refugee with/without permit
  if (saved.refugee === 'yes') {
    if (submitted.brp === 'yes') {
      return res.redirect('./residence-permit-refugee')
    }

    if (submitted.brp === 'no') {
      return res.redirect('../../outcome/END008')
    }
  }

  // Anyone else with/without permit
  if (saved.refugee === 'no') {
    if (submitted.brp === 'yes') {
      return res.redirect('./residence-permit-expired')
    }

    if (submitted.brp === 'no') {
      return res.redirect('./no-public-funds')
    }
  }

  res.render(`${__dirname}/views/questions/residence-permit`)
})

/**
 * Question: Which of the following words are shown?
 */
router.all('/:type/questions/residence-permit-type', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]

  // Leave to remain/enter
  if (submitted.brpType === 'leave to remain' || submitted.brpType === 'leave to enter') {
    return res.redirect('./no-public-funds-residence-permit')
  }

  // Check for leave time for settlement
  if (submitted.brpType === 'settlement') {
    return res.redirect('./residence-permit-issue-date')
  }

  // Residence
  if (submitted.brpType === 'residence') {
    return res.redirect('./residence-permit-sub-type')
  }

  res.render(`${__dirname}/views/questions/residence-permit-type`)
})

/**
 * Question: What's the permit issue date?
 */
router.all('/:type/questions/residence-permit-issue-date', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]
  const saved = req.session.data[type]

  // Date components
  saved.brpIssueDate = formatDate(saved.brpIssueDate)
  const { day, month, year, date } = saved.brpIssueDate

  // All three date fields provided
  if (submitted.brpIssueDate && day && month && year) {
    const today = moment.utc().startOf('day')
    const fourWeeksAgo = moment(today).subtract(4, 'weeks')
    const twoYearsAgo = moment(today).subtract(2, 'years')

    // Is the date valid but less than 4 weeks ago?
    if (date.isValid() && date.isSameOrAfter(fourWeeksAgo)) {
      return res.redirect('../../outcome/END100')
    }

    // Is the date valid and two or more years ago
    if (date.isValid() && date.isSameOrBefore(twoYearsAgo)) {
      return res.redirect('./out-of-country-since-date')
    }

    // Is the date valid and in the past?
    if (date.isValid() && date.isBefore(today)) {
      return res.redirect('./out-of-country')
    }
  }

  res.render(`${__dirname}/views/questions/residence-permit-issue-date`)
})

/**
 * Question: Which other words are shown?
 */
router.all('/:type/questions/residence-permit-sub-type', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]

  if (submitted.brpSubType) {
    // Full HRT required for permanent residents
    if (submitted.brpSubType === 'residence-permanent') {
      return res.redirect('../../outcome/END003')
    }

    return res.redirect('./married-or-civil-partner')
  }

  res.render(`${__dirname}/views/questions/residence-permit-sub-type`)
})

/**
 * Question: Does the permit type state REFUGEE?
 */
router.all('/:type/questions/residence-permit-refugee', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]

  // Permit says refugee?
  if (submitted.permitTypeRefugee === 'yes') {
    return res.redirect('./residence-permit-expired')
  }

  // Permit doesn't say refugee
  if (submitted.permitTypeRefugee === 'no') {
    return res.redirect('./no-public-funds')
  }

  res.render(`${__dirname}/views/questions/residence-permit-refugee`)
})

/**
 * Question: Has the card expired?
 */
router.all('/:type/questions/residence-permit-expired', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]
  const saved = req.session.data[type]

  // Card expired?
  if (submitted.permitExpired === 'yes') {
    return res.redirect('../../outcome/END003')
  }

  // Card hasn't expired
  if (submitted.permitExpired === 'no') {
    // Refugee with permit
    if (saved.refugee === 'yes') {
      return res.redirect('../../outcome/END018')
    }

    return res.redirect('./residence-permit-type')
  }

  res.render(`${__dirname}/views/questions/residence-permit-expired`)
})

/**
 * Question: Visa says no public funds?
 */
router.all('/:type/questions/no-public-funds(-residence-permit)?', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]
  const saved = req.session.data[type]

  // Visa says "no public funds"
  if (submitted.noPublicFunds === 'yes') {
    return res.redirect(saved.brp === 'no'
      ? '../../outcome/END005' : '../../outcome/END004')
  }

  // Visa doesn't say "no public funds"
  if (submitted.noPublicFunds === 'no') {
    if (saved.brpType === 'leave to remain' || saved.brpType === 'leave to enter') {
      return res.redirect('../../outcome/END006')
    }

    return res.redirect('./family-member')
  }

  let view = `${__dirname}/views/questions/no-public-funds`

  // Change to BRP copy variant
  if (req.originalUrl.includes('-residence-permit')) {
    view = `${__dirname}/views/questions/no-public-funds-residence-permit`
  }

  res.render(view)
})

/**
 * Question: Does this person have a job?
 */
router.all('/:type/questions/employment-status', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]

  // Saved data by type
  const claimant = req.session.data.claimant

  // Not working
  if ((submitted.employmentStatus || []).includes('dontWork')) {
    return res.redirect('./employment-status-not-working')
  }

  // Self employed
  if ((submitted.employmentStatus || []).includes('selfEmployed')) {
    return res.redirect('../../outcome/END003')
  }

  // Employed
  if ((submitted.employmentStatus || []).includes('employed')) {
    if (type === 'partner' && claimant.isEEA) {
      return res.redirect('../../outcome/END012')
    }

    if (type === 'partner' && !claimant.isEEA) {
      return res.redirect('../../outcome/END013')
    }

    return res.redirect('./employment-status-evidence')
  }

  res.render(`${__dirname}/views/questions/employment-status`)
})

/**
 * Question: Can they provide the following?
 */
router.all('/:type/questions/employment-status(-not-working)?-evidence', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]
  const saved = req.session.data[type]

  if (['most-recent', 'three-months'].includes(submitted.employmentStatusEvidence)) {
    if (saved.dontWorkReason === 'redundant') {
      return res.redirect('../../outcome/END010')
    }

    if (saved.dontWorkReason === 'illness') {
      return res.redirect('../../outcome/END011')
    }

    return res.redirect('../../outcome/END002')
  }

  if (submitted.employmentStatusEvidence === 'none') {
    return res.redirect('../../outcome/END003')
  }

  let view = `${__dirname}/views/questions/employment-status-evidence`

  // Change to not working copy variant
  if (req.originalUrl.includes('-not-working')) {
    view = `${__dirname}/views/questions/employment-status-not-working-evidence`
  }

  res.render(view)
})

/**
 * Question: Are they currently working?
 */
router.all('/:type/questions/employment-status-yes-no', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]
  const saved = req.session.data[type]

  let outcomeDecisionBritish = '../../outcome/END101'
  let outcomeDecisionOther = '../../outcome/END100'
  let outcomeBritish = '../../outcome/END001'
  let outcomeOther = '../../outcome/END006'

  // BRP provided
  if (saved.brp === 'no') {
    outcomeOther = '../../outcome/END007'
  }

  // Working
  if ((submitted.employmentStatus || []).includes('employed')) {
    return res.redirect(saved.britishCitizen === 'yes'
      ? outcomeDecisionBritish : outcomeDecisionOther)
  }

  // Not working
  if ((submitted.employmentStatus || []).includes('dontWork')) {
    return res.redirect(saved.britishCitizen === 'yes'
      ? outcomeBritish : outcomeOther)
  }

  res.render(`${__dirname}/views/questions/employment-status-yes-no`)
})

/**
 * Question: Why aren’t they working?
 */
router.all('/:type/questions/employment-status-not-working', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]

  // Saved data by type
  const claimant = req.session.data.claimant

  // Not working because redundant
  if (submitted.dontWorkReason === 'redundant') {
    if (type === 'partner' && claimant.isEEA) {
      return res.redirect('../../outcome/END012')
    }

    if (type === 'partner' && !claimant.isEEA) {
      return res.redirect('../../outcome/END013')
    }

    return res.redirect('./employment-status-not-working-evidence')
  }

  // Not working because ill
  if (submitted.dontWorkReason === 'illness') {
    return res.redirect('./employment-status-fit-note')
  }

  // Not working because of other reason
  if (submitted.dontWorkReason === 'other') {
    if (type === 'partner') {
      return res.redirect('../../outcome/END003')
    }

    return res.redirect('./married-or-civil-partner')
  }

  res.render(`${__dirname}/views/questions/employment-status-not-working`)
})

/**
 * Question: Have they had constant fit notes?
 */
router.all('/:type/questions/employment-status-fit-note', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]

  // Saved data by type
  const claimant = req.session.data.claimant

  if (submitted.fitNote === 'yes') {
    if (type === 'partner' && claimant.isEEA) {
      return res.redirect('../../outcome/END012')
    }

    if (type === 'partner' && !claimant.isEEA) {
      return res.redirect('../../outcome/END013')
    }

    return res.redirect('./employment-status-not-working-evidence')
  }

  if (submitted.fitNote === 'no' || submitted.fitNote === 'dontKnow') {
    if (type === 'partner') {
      return res.redirect('../../outcome/END003')
    }

    return res.redirect('./married-or-civil-partner')
  }

  res.render(`${__dirname}/views/questions/employment-status-fit-note`)
})

/**
 * Question: Visa says family member?
 */
router.all('/:type/questions/family-member', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]
  const saved = req.session.data[type]

  // Visa says "family member"
  if (submitted.familyMember === 'yes') {
    if (type === 'partner') {
      return res.redirect('../../outcome/END003')
    }

    return res.redirect('./married-or-civil-partner')
  }

  // Visa doesn't say "family member"
  if (submitted.familyMember === 'no') {
    return res.redirect(saved.brp === 'no'
      ? '../../outcome/END007' : '../../outcome/END006')
  }

  res.render(`${__dirname}/views/questions/family-member`)
})

/**
 * Question: Married or civil partner?
 */
router.all('/:type/questions/married-or-civil-partner', (req, res) => {
  const type = req.params.type
  const submitted = req.body[type]
  const saved = req.session.data[type]

  // Married or civil partner?
  if (submitted.partner === 'yes') {
    return res.redirect('../../partner/questions/nationality')
  }

  // No partner
  if (submitted.partner === 'no') {
    if (saved.brpType === 'leave to remain' || saved.brpType === 'leave to enter') {
      return res.redirect('../../outcome/END006')
    }

    return res.redirect('../../outcome/END003')
  }

  res.render(`${__dirname}/views/questions/married-or-civil-partner`)
})

/**
 * Outcome
 */
router.all('/outcome/:outcome', (req, res) => {
  res.render(`${__dirname}/views/outcomes/${req.params.outcome}`)
})

/**
 * Format date for display
 */
function formatDate ({ day, month, year } = {}) {
  day = day ? day.padStart(2, '0') : ''
  month = month ? month.padStart(2, '0') : ''
  year = year || ''

  // Apply formatting
  const date = moment.utc(`${year}-${month}-${day}`, 'YYYY-MM-DD', true)
  const formatted = date.isValid() ? date.format('D MMM YYYY') : ''

  return {
    day,
    month,
    year,
    date,
    formatted
  }
}

module.exports = router
