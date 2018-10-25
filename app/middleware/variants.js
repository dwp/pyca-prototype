// Allowed variants
const variants = ['A', 'B', 'C', 'D']

// Check if allowed
const isValid = variant => {
  return variants.includes(variant)
}

/**
 * View variant switcher
 */
const middleware = (req, res, next) => {
  let variant = variants[0]
  let variantNew = variant

  // Allow override from cookie
  if (isValid(req.cookies.variant)) {
    variantNew = req.cookies.variant
  }

  // Allow override from query
  if (isValid(req.query.variant)) {
    variantNew = req.query.variant
  }

  // Update cookie if changed
  if (variantNew !== req.cookies.variant) {
    res.cookie('variant', variantNew)
  }

  res.locals.variant = variantNew

  next()
}

module.exports = middleware
