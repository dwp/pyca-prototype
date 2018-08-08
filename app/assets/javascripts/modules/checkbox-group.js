(function (global) {
  'use strict'

  var $ = global.jQuery
  var GOVUK = global.GOVUK || {}

  function CheckboxGroup () {
    // Handle checkbox click
    function handle () {
      var input = $(this)
      var isChecked = input.is(':checked')
      var list

      // Inputs to un-tick or tick
      if (input.data('uncheck')) {
        list = input.data('uncheck')

        if (isChecked) { uncheckGroup(list) }
      }

      // Inputs to tick
      if (input.data('check')) {
        list = input.data('check')

        if (!isChecked) { checkGroup(list) }
      }
    }

    // Unticks an array of input IDs
    function uncheckGroup (list) {
      update(list, false)
    }

    // Ticks an array of input IDs
    function checkGroup (list) {
      update(list, true)
    }

    // Check or uncheck an array of input IDs (defaults to uncheck)
    function update (list, value) {
      $.each(list, function (index, id) {
        $('#' + id).prop('checked', !!value).triggerHandler('click')
      })
    }

    function init (container) {
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
