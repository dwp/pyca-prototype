if(window.$) {

  var version = {};

  version.toggleImage = {

    init: function init() {

      var $component = $('.image-toggler');

      if(!! $component.length) {

        $component.each(function(index, $elm) {

          var $thisToggler = $(this);
          var $toggleItems = $thisToggler.find('.js-image-toggler__item');
          var $toggleLinks = $thisToggler.find('.image-toggler__nav-item');

          $toggleLinks.each(function(index, elm){

            var $thisNavItem = $(elm);
            var $thisLink = $thisNavItem.find('a');

            $thisLink.on('click', function(e){

              $toggleLinks.removeClass('active');
              $toggleItems.removeClass('active');

              $target = $($thisLink.attr('href'));

              $thisNavItem.addClass('active');
              $target.addClass('active');

              e.preventDefault();

            })

          })


        });

      }

    }

  }

  $(function(){

    version.toggleImage.init();

  });

}
