/**
 * Placeholder objects for
 * claimant/partner data
 */
const middleware = (req, res, next) => {
  const data = req.session.data
  const body = req.body

  // Default claimant data
  data.claimant = data.claimant || {}
  data.partner = data.partner || {}

  // Default body data
  body.claimant = body.claimant || {}
  body.partner = body.partner || {}

  next()
}

module.exports = middleware
