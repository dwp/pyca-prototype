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

(function (global) {
  'use strict';

  var $ = global.jQuery;
  var GOVUK = global.GOVUK || {};

  function CheckboxGroup() {

    // Handle checkbox click
    function handle() {

      var input = $(this),
        isChecked = input.is(':checked'),
        list

      // Inputs to un-tick
      if (input.data('uncheck')) {
        list = input.data('uncheck')

        if (isChecked)
          uncheckGroup(list)
      }

      // Inputs to tick
      else if (input.data('check')) {
        list = input.data('check')

        if (!isChecked)
          checkGroup(list)
      }
    }

    // Unticks an array of input IDs
    function uncheckGroup(list) {
      update(list, false)
    }

    // Ticks an array of input IDs
    function checkGroup(list) {
      update(list, true)
    }

    // Check or uncheck an array of input IDs (defaults to uncheck)
    function update(list, value) {
      $.each(list, function(index, id) {
        $('#' + id).prop('checked', !!value).triggerHandler('click')
      })
    }

    function init(container) {
      container = container || $(document.body)
      container.on('click', 'input[type=checkbox][data-check]', handle)
      container.on('click', 'input[type=checkbox][data-uncheck]', handle)
    }

    return {
      handle: handle,
      uncheckGroup: uncheckGroup,
      checkGroup: checkGroup,
      init: init
    }
  }

  GOVUK.CheckboxGroup = CheckboxGroup
  global.GOVUK = GOVUK
})(window)

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
  $('select.autocompleter').each(function() {
    var select = $(this)
    var selectId = select.attr('id')
    var inputId = selectId + 'Input'
    var label = $('label[for=' + selectId + ']')

    // Enable input
    select.selectToAutocomplete()

    // Link label to input
    var input = label.siblings('.ui-autocomplete-input').attr('id', inputId)
    label.attr('for', inputId)
  })
})
