const express = require('express')
const fs = require('fs')
const router = express.Router()

// Add your routes here - above the module.exports line

// Data sources
router.all('/data/:data/source/:source', (req, res) => {
  const { data, source } = req.params
  res.json(require(`./data/${data}/source/${source}`))
})

// Middleware
router.use(require('./middleware/defaults'))
router.use(require('./middleware/locals'))
router.use(require('./middleware/nationality'))

// Data sources
router.all('/data/:data/source/:source', (req, res) => {
  const { data, source } = req.params
  res.json(require(`./data/${data}/source/${source}`))
})

// Remove trailing slashes
router.all('\\S+/$', (req, res) => {
  res.redirect(301, req.path.slice(0, -1) + req.url.slice(req.path.length))
})

// Find prototypes here
const search = `${__dirname}/views/prototypes/`
const prototypes = fs.readdirSync(search).filter(file => {
  return fs.statSync(`${search}/${file}`).isDirectory()
})

// Multiple prototypes
for (const directory of prototypes) {
  const prototype = require(`${search}${directory}`)

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
