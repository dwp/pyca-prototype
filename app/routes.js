const express = require('express')
const fs = require('fs')
const router = express.Router()

// Add your routes here - above the module.exports line
router.use(require('./middleware/defaults'))
router.use(require('./middleware/locals'))
router.use(require('./middleware/nationality'))

// Remove trailing slashes
router.all('\\S+/$', (req, res) => {
  res.redirect(301, req.path.slice(0, -1) + req.url.slice(req.path.length))
})

// Multiple prototypes
for (const directory of fs.readdirSync(`${__dirname}/views/prototypes`)) {
  const prototype = require(`./views/prototypes/${directory}/routes`)

  // Add claimant/partner to locals
  prototype.param('type', (req, res, next, type) => {
    res.locals.type = type
    next()
  })

  // Top level type redirect
  prototype.all('/:type', (req, res) => {
    res.redirect(`/${directory}`)
  })

  // Prototype static assets
  prototype.use(`/assets`, express.static(`${__dirname}/views/prototypes/${directory}/assets`))

  // Prototype router
  router.use(`/${directory}`, prototype)
}

module.exports = router
