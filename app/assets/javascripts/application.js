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

// Check and uncheck checkbox groups
// E.g. When a checkbox is checked, others are un-checked
var container = $(document.body)
var checkboxGroup = new window.GOVUK.CheckboxGroup()
container.on('click', 'input[type=checkbox][data-check]', checkboxGroup.handle)
container.on('click', 'input[type=checkbox][data-uncheck]', checkboxGroup.handle)
