/* global $ */
/* global GOVUK */

// Warn about using the kit in production
if (
  window.sessionStorage && window.sessionStorage.getItem('prototypeWarning') !== 'false' &&
  window.console && window.console.info
) {
  window.console.info('GOV.UK Prototype Kit - do not use for production')
  window.sessionStorage.setItem('prototypeWarning', true)
}

$(document).ready(function () {
  // Use GOV.UK selection-buttons.js to set selected
  // and focused states for block labels
  var $blockLabels = $(".block-label input[type='radio'], .block-label input[type='checkbox']")
  new GOVUK.SelectionButtons($blockLabels) // eslint-disable-line

  // Use GOV.UK shim-links-with-button-role.js to trigger a link styled to look like a button,
  // with role="button" when the space key is pressed.
  GOVUK.shimLinksWithButtonRole.init()

  // Show and hide toggled content
  // Where .block-label uses the data-target attribute
  // to toggle hidden content
  var showHideContent = new GOVUK.ShowHideContent()
  showHideContent.init()

  // Check and uncheck checkbox groups
  // E.g. When a checkbox is checked, others are un-checked
  var container = $(document.body)
  var checkboxGroup = new GOVUK.CheckboxGroup()
  container.on('click', 'input[type=checkbox][data-check]', checkboxGroup.handle)
  container.on('click', 'input[type=checkbox][data-uncheck]', checkboxGroup.handle)

  // Add country autocomplete
  var selectToAutocomplete = new GOVUK.SelectToAutocomplete()
  selectToAutocomplete.init($('select.autocompleter'))

  ;(function() {

    // Error summary
    var errorSummary = $('.error-summary')

    // Focus invalid field
    function focus(event) {
      event.preventDefault()
      $($(this).attr('href')).focus()
    }

    // Check for error summary
    if (errorSummary.length) {
      errorSummary.focus()
      errorSummary.find('a').click(focus)
    }

  })()
})
