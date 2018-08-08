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
    url: '/node_modules/govuk-country-and-territory-autocomplete/dist/location-autocomplete-graph.json'
  })
}

// Check and uncheck checkbox groups
// E.g. When a checkbox is checked, others are un-checked
var container = $(document.body)
var checkboxGroup = new window.GOVUK.CheckboxGroup()
container.on('click', 'input[type=checkbox][data-check]', checkboxGroup.handle)
container.on('click', 'input[type=checkbox][data-uncheck]', checkboxGroup.handle)

// Add auto uncheck attributes, waiting for https://github.com/alphagov/govuk-frontend/pull/942
$('#employment-status-1').attr('data-uncheck', '["employment-status-3"]')
$('#employment-status-2').attr('data-uncheck', '["employment-status-3"]')
$('#employment-status-3').attr('data-uncheck', '["employment-status-1", "employment-status-2"]')
