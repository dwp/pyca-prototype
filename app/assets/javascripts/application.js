/* global $ openregisterLocationPicker */

// Warn about using the kit in production
if (window.console && window.console.info) {
  window.console.info('GOV.UK Prototype Kit - do not use for production')
}

$(document).ready(function () {
  window.GOVUKFrontend.initAll()
})

// Country picker
var nationality = document.getElementById('nationality')

if (nationality) {
  openregisterLocationPicker({
    defaultValue: '',
    selectElement: nationality,
    url: nationality.dataset.source
  })
}
