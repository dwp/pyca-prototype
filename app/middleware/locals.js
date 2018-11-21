const url = require('url')

/**
 * Pass base path to views
 */
const middleware = (req, res, next) => {
  const directories = url.parse(req.originalUrl).pathname.split('/')
  res.locals.basePath = `/${directories[1]}`

  next()
}

module.exports = middleware
