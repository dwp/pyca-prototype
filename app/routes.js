const express = require('express')
const router = express.Router()

// Add your routes here - above the module.exports line

// Data sources
router.all('/data/:data/source/:source', (req, res) => {
  const { data, source } = req.params
  res.json(require(`./data/${data}/source/${source}`))
})

module.exports = router
