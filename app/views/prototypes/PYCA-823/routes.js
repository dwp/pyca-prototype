const express = require('express')
const router = express.Router()

// Start screen
router.all('/', (req, res) => {
  res.send('TODO')
})

module.exports = router
