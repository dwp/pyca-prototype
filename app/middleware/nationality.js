const countries = require('../data/location-autocomplete')

/**
 * Update nationality
 */
const middleware = (req, res, next) => {
  for (const type of ['claimant', 'partner']) {
    const submitted = req.body[type]
    const saved = req.session.data[type]

    // Update treaty flags
    if (submitted.nationality) {
      saved.isCESC = countries.isCESC(submitted.nationality)
      saved.isEEA = countries.isEEA(submitted.nationality)
      saved.isECSMA = countries.isECSMA(submitted.nationality)
    }
  }

  next()
}

module.exports = middleware
