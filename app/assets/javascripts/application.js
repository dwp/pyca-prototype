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
  var selectToAutocomplete = new (function() {
    'use strict';

    var self = this;

    // Check for matches
    self.match = function(keywords, text, textAlias, resultsTop, results) {
      var result = text;

      // Unless already added
      if (results.indexOf(result) === -1 && resultsTop.indexOf(result) === -1) {
        text = textAlias || text;

        var keywordsLower = keywords.toLowerCase();
        var textLower = text.toLowerCase();

        // Position of keywords in text
        var index = textLower.indexOf(keywordsLower);

        // Add direct matches
        if (index !== -1) {

          // "Begins with"
          if (index === 0) {
            resultsTop.push(result);
          }

          // "Contains"
          else {
            results.push(result);
          }
        }
      }
    };

    // Search country list
    self.search = function(keywords, callback) {
      var results = [];
      var resultsTop = [];

      // Loop countries (adds direct and alias matches)
      $.each(countries, function(i) {
        var text = countries[i].text;
        var textAlias;

        // Direct match
        self.match(keywords, text, textAlias, resultsTop, results);

        // Any aliases?
        if (countries[i].aliases) {
          $.each(countries[i].aliases, function(j) {
            textAlias = countries[i].aliases[j];

            // Alias match
            self.match(keywords, text, textAlias, resultsTop, results);
          });
        }
      });

      // Sort A-Z
      results.sort();
      resultsTop.sort();

      callback($.merge(resultsTop, results));
    };

    // Value selected
    self.select = function(event) {
      var input = $(this);
      var keywords = input.val();
      var key, value;

      // For keypress
      if (event && event.type == 'keypress') {
        key = event.which || event.keyCode;

        // Only allow 'enter' key
        if (key && key !== 13) {
          return;
        }
      }

      // Keywords provided
      if (keywords) {

        // Find corresponding value
        $.each(countries, function(i) {
          var info = countries[i];

          // Exact matches only
          if (info.text === keywords) {
            value = info.value;
          }
        });
      }

      input.data('select').val(value);
      input.typeahead('close');
    };

    // Initialise an autocomplete field
    self.init = function(select) {

      // Check it exists
      if (select && select.length) {

        var selectId = select.attr('id');
        var inputId = selectId + 'Input';

        // Extract select menu options
        select.find('option').each(function() {

          var option = $(this);
          var value = option.val();

          if (value) {
            countries.push({
              value: value,
              aliases: option.data('aliases'),
              text: option.text()
            });
          }
        });

        // Create input field
        var input = $('<input type="text" />');
        input.on('typeahead:select keypress blur', self.select);
        input.data('select', select);

        // Copy select menu attributes onto input
        $.each(select.get(0).attributes, function(i, attr) {
          input.attr(attr.name, attr.value);
        });

        // Insert input after select
        select.after(input).hide();

        // Set up input
        input.removeAttr('name');
        input.attr({
          id: inputId,
          for: inputId,
          value: select.val() && select.children('option:selected').text(),
          autocorrect: 'off',
          autocomplete: 'off'
        });

        // Start typeahead
        input.typeahead(options, data);

        // Fix any unmatched validation jump-links
        $('[href="#' + selectId + '"]').attr('href', '#' + inputId);
      }
    };

    // Country list
    var countries = [];

    // Typeahead options
    var options = {
      async: false,
      minLength: 1
    };

    // Data source
    var data = {
      limit: 2000,
      name: 'nationality',
      source: self.search
    };
  })()

  selectToAutocomplete.init($('select.autocompleter'));

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
