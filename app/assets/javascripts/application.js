(function (global) {
  'use strict';

  var $ = global.jQuery;
  var GOVUK = global.GOVUK || /* istanbul ignore next */ {};

  function ShowHideContent() {
    var self = this;

    // Radio and Checkbox selectors
    var selectors = {
      namespace: 'ShowHideContent',
      radio: '.block-label input[type="radio"]',
      checkbox: '.block-label input[type="checkbox"]'
    };

    // Escape name attribute for use in DOM selector
    function escapeElementName(str) {
      var result = str.replace('[', '\\[').replace(']', '\\]');
      return(result);
    }

    // Adds ARIA attributes to control + associated content
    function initToggledContent() {
      var $control = $(this);
      var $content = getToggledContent($control);

      // Set aria-controls and defaults
      if ($content.length) {
        $control.attr('aria-controls', $content.attr('id'));
        $control.attr('aria-expanded', 'false');
        $content.attr('aria-hidden', 'true');
      }
    }

    // Return toggled content for control
    function getToggledContent($control) {
      var id = $control.attr('aria-controls');

      // ARIA attributes aren't set before init
      /* istanbul ignore else */
      if (!id) {
        id = $control.parent('label').data('target');
      }

      // Find show/hide content by id
      return $('#' + id);
    }

    // Show toggled content for control
    function showToggledContent($control, $content) {

      // Show content
      if ($content.hasClass('js-hidden')) {
        $content.removeClass('js-hidden');
        $content.attr('aria-hidden', 'false');

        // If the controlling input, update aria-expanded
        /* istanbul ignore else */
        if ($control.attr('aria-controls')) {
          $control.attr('aria-expanded', 'true');
        }
      }
    }

    // Hide toggled content for control
    function hideToggledContent($control, $content) {
      $content = $content || getToggledContent($control);

      // Hide content
      if (!$content.hasClass('js-hidden')) {
        $content.addClass('js-hidden');
        $content.attr('aria-hidden', 'true');

        // If the controlling input, update aria-expanded
        if ($control.attr('aria-controls')) {
          $control.attr('aria-expanded', 'false');
        }
      }
    }

    // Handle radio show/hide
    function handleRadioContent($control, $content) {

      // All radios in this group
      var selector = selectors.radio + '[name=' + escapeElementName($control.attr('name')) + ']';
      var $radios = $control.closest('form').find(selector);

      // Hide radios in group
      $radios.each(function() {
        hideToggledContent($(this));
      });

      // Select radio button content
      showToggledContent($control, $content);
    }

    // Handle checkbox show/hide
    function handleCheckboxContent($control, $content) {

      // Show checkbox content
      if ($control.is(':checked')) {
        showToggledContent($control, $content);
      }

      // Hide checkbox content
      else {
        hideToggledContent($control, $content);
      }
    }

    // Set up event handlers etc
    function init($container, selector, handler) {
      $container = $container || $(document.body);

      // Handle control clicks
      function deferred() {
        var $control = $(this);
        handler($control, getToggledContent($control));
      }

      // Prepare ARIA attributes
      var $controls = $(selector);
      $controls.each(initToggledContent);

      // Handle events
      $container.on('click.' + selectors.namespace, selector, deferred);

      // Any already :checked on init?
      if ($controls.is(':checked')) {
        $controls.filter(':checked').each(deferred);
      }
    }

    // Set up radio show/hide content for container
    self.showHideRadioToggledContent = function($container) {
      init($container, selectors.radio, handleRadioContent);
    };

    // Set up checkbox show/hide content for container
    self.showHideCheckboxToggledContent = function($container) {
      init($container, selectors.checkbox, handleCheckboxContent);
    };

    // Remove event handlers
    self.destroy = function($container) {
      $container = $container || $(document.body);
      $container.off('.' + selectors.namespace);
    };
  }

  ShowHideContent.prototype.init = function($container) {
    this.showHideRadioToggledContent($container);
    this.showHideCheckboxToggledContent($container);
  };

  GOVUK.ShowHideContent = ShowHideContent;
  global.GOVUK = GOVUK;
})(window);

(function (global) {
  'use strict';

  var $ = global.jQuery;
  var GOVUK = global.GOVUK || {};

  function CheckboxGroup() {

    // Handle checkbox click
    function handle() {

      var input = $(this),
        isChecked = input.is(':checked'),
        list;

      // Inputs to un-tick
      if (input.data('uncheck')) {
        list = input.data('uncheck');

        if (isChecked)
          uncheckGroup(list);
      }

      // Inputs to tick
      else if (input.data('check')) {
        list = input.data('check');

        if (!isChecked)
          checkGroup(list);
      }
    }

    // Unticks an array of input IDs
    function uncheckGroup(list) {
      update(list, false);
    }

    // Ticks an array of input IDs
    function checkGroup(list) {
      update(list, true);
    }

    // Check or uncheck an array of input IDs (defaults to uncheck)
    function update(list, value) {
      $.each(list, function(index, id) {
        $('#' + id).prop('checked', !!value).triggerHandler('click');
      });
    }

    function init(container) {
      container = container || $(document.body);
      container.on('click', 'input[type=checkbox][data-check]', handle);
      container.on('click', 'input[type=checkbox][data-uncheck]', handle);
    }

    return {
      handle: handle,
      uncheckGroup: uncheckGroup,
      checkGroup: checkGroup,
      init: init
    };
  }

  GOVUK.CheckboxGroup = CheckboxGroup;
  global.GOVUK = GOVUK;
})(window);

$(document).ready(function() {

  // Use GOV.UK selection-buttons.js to set selected
  // and focused states for block labels
  var $blockLabels = $(".block-label input[type='radio'], .block-label input[type='checkbox']");
  new GOVUK.SelectionButtons($blockLabels);

  // Show and hide toggled content
  // Where .block-label uses the data-target attribute
  var toggleContent = new GOVUK.ShowHideContent();
  toggleContent.showHideRadioToggledContent();
  toggleContent.showHideCheckboxToggledContent();

  // Check and uncheck checkbox groups
  // E.g. When a checkbox is checked, others are un-checked
  var container = $(document.body);
  var checkboxGroup = new GOVUK.CheckboxGroup();
  container.on('click', 'input[type=checkbox][data-check]', checkboxGroup.handle);
  container.on('click', 'input[type=checkbox][data-uncheck]', checkboxGroup.handle);

  // Add country autocomplete
  $('select.autocompleter').selectToAutocomplete();
});
