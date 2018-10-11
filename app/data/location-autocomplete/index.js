/**
 * Country helper
 */

// Map of all countries
const list = require('./source/location-autocomplete-canonical-list.json')

// Array of all countries
const items = []

// Country values by treaty
const CESC = require('./source/list-cesc.json')
const CTA = require('./source/list-cta.json')
const EEA = require('./source/list-eea.json')
const ECSMA = require('./source/list-ecsma.json')

// Convert map to array of objects
for (const [text, value] of list) {
  items.push({ text, value })
}

// Add default item
items.unshift({
  text: 'Please select',
  value: ''
})

// List with optional selected value
module.exports.list = value => {
  for (const item of items) {
    item.selected = (value === item.value)
  }
  return items
}

// Check if country/territory is CESC
module.exports.isCESC = value => {
  return CESC.includes(value)
}

// Check if country/territory is CTA
module.exports.isCTA = value => {
  return CTA.includes(value)
}

// Check if country/territory is EEA
module.exports.isEEA = value => {
  return EEA.includes(value)
}

// Check if country/territory is ECSMA
module.exports.isECSMA = value => {
  return ECSMA.includes(value)
}
