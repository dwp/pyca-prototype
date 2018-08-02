/**
 * Pass base path to views
 */
const middleware = (req, res, next) => {
  const directories = req.originalUrl.split('/')
  res.locals.basePath = `/${directories[1]}`

  next()
}

module.exports = middleware
