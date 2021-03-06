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
var nationalityPartner = document.getElementById('nationalityPartner');
var nationalityFamilyMember = document.getElementById('nationalityFamilyMember');

if (nationality) {
  openregisterLocationPicker({
    defaultValue: '',
    selectElement: nationality,
    url: nationality.dataset.source
  })
}

if (nationalityPartner) {
  openregisterLocationPicker({
    defaultValue: '',
    selectElement: nationalityPartner,
    url: nationalityPartner.dataset.source
  })
}

if (nationalityFamilyMember) {
  openregisterLocationPicker({
    defaultValue: '',
    selectElement: nationalityFamilyMember,
    url: nationalityFamilyMember.dataset.source
  })
}

// Document container for event bubbling
var container = $(document.body)

// Check and uncheck checkbox groups
// E.g. When a checkbox is checked, others are un-checked
var checkboxGroup = new window.GOVUK.CheckboxGroup()
container.on('click', 'input[type=checkbox][data-check]', checkboxGroup.handle)
container.on('click', 'input[type=checkbox][data-uncheck]', checkboxGroup.handle)

// Use history for back link
container.on('click', '.govuk-back-link', function (event) {
  if (window.history && window.history.length > 2) {
    window.history.back()
    event.preventDefault()
  }
})
