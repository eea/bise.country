// Code for the countries section
// This is also loaded in a country page
$(document).ready(function() {

  // var $fc = $('<div class="facts-container"/>');
  // var overviewTab = $('.country-overview-section');
  //
  // overviewTab.append($fc);

  // Add claro class for css; used by dojo
  $("body").addClass("claro");

  var isCountriesPage = $('#country-tabs li a').attr('href') === '##profiles';
  var noHash = window.location.href.indexOf("##") == -1;
  if (isCountriesPage && noHash) window.location.href += '##profiles';

  // select country dropdown functionality on countries section page
  $('.country-dropdown select').change(function() {
    var url = $(this).val();
    var link = url.substring(url.lastIndexOf("/") + 1);
    var tabsLoc = {
      '##profiles': 't-0',
      '##factsheets': 't-1',
      '##contributions': 't-2',
      '##maes': 't-3',
      '##green-infrastructure': 't-4'
    }
    for (var key in tabsLoc) {
      if (tabsLoc.hasOwnProperty(key)) {
        var wLoc = window.location.href
        if (wLoc.indexOf(key) > -1) {
          url = link + '##' + tabsLoc[key];
          document.location = url;
        }
      }
    }
  });

  // Dropdown + tab changing functionality
  // This is the country selector in a country page view
  $.fn.resizeselect = function(settings) {
    return this.each(function() {
      $(this).change(function() {
        var $this = $(this);

        var text = $this.parents().find('.dd-country-title .selected').text();
        var $test = $("<span>").html(text).css({
          "font-size": $this.css("font-size"),
          "visibility": "hidden"
        });

        $test.appendTo($this.parent());
        var width = $test.width();
        $test.remove();

        $this.width(width);
      }).change();
    });
  };
  $(".resizeselect").resizeselect();

  $.fn.resizeselectList = function(settings) {
    return this.each(function() {
      $(this).change(function() {
        var $this = $(this);
        var $selected = $this.parents().find('.dd-country-title .selected');
        var text = $selected.text();

        var $test = $("<span/>").html(text).css({
          "font-size": $selected.css("font-size"),
          "font-weight": $selected.css("font-weight"),
          "visibility": "hidden"
        });

        $test.appendTo($this.parent());
        var width = $test.width();
        $test.remove();

        $this.width(width + 20);
      }).change();
    });
  };
  $(".resizeselect-list").resizeselectList();

  $('.dd-country-title .options li').on('click', function() {
    // $('.dd-country-title .selected').html($(this).text());
    $('.dd-country-title .selected-inp').val($(this).data('value')).trigger('change');
    $('.dd-country-title .options').removeClass('show');
  });

  $('.dd-title-wrapper').on('click', function(e) {
    $('.dd-country-title .options').fadeToggle().toggleClass('show');
    $('.dd-country-title i').toggleClass('fa fa-angle-up fa fa-angle-down');
    e.stopPropagation()
  });

  $('.dd-country-title .selected-inp').on('change', function(ev) {
    var url = ev.target.value;
    if (currentTab > -1) {
      url += "##t-" + currentTab;
    }
    document.location = url;
  });

  var getTabFromHash = function(hash) {
    hash = hash.replace('##', '');
    if (hash !== '') {
      var sp = hash.split('-');
      if (sp && sp[0] === 't') {
        currentTab = parseInt(sp[1]);
        return currentTab;
      }
    }
    return -1;
  };

  var currentTab = getTabFromHash(window.location.hash.substr(2));

  $('.custom-dropdown select').change(function() {
    var url = $(this).val()
    if (currentTab > -1) {
      url += "##t-" + currentTab;
    }
    document.location = url;
  });

  $("#country-tabs li").click(function() {
    var element_id = $(this).children('a')[0].hash;
    currentTab = getTabFromHash(element_id)
  });


  // workaround for lazy loading iframes
  $.each($('.fact-contents'), function(index, value) {
    $(value).find("iframe").prop("src", function() {
      return $(this).data("src");
    });
  });

  // center tabs menu items on click on small screen sizes
  $("#country-tabs li a").click(function() {
    var $parent = $(this).parent();
    centerTabItem($parent, 'ul#country-tabs');
  });

  function centerTabItem(target, outer) {
    var outer = $(outer);
    var target = $(target);
    var outerW = outer.width() - 50;
    var targetW = target.outerWidth(true);
    var targetIn = target.index();
    var q = 0;
    var centerElement = outer.find('li');

    for (var i = 0; i < targetIn; i++) {
      q += $(centerElement[i]).outerWidth(true);
    }

    outer.animate({
      scrollLeft: Math.max(0, q - (outerW - targetW) / 2)
    }, 500);
  }

  $('.quick-links-list li').first().remove();

  $(function() {
    if (window.location.href.indexOf("##") == -1) {
      $('.tab-content #t-0, .nav-tabs li:first-child').addClass('active');
    }
    var hash = window.location.hash;
    hash && $('.nav-tabs a[href="' + hash + '"]').tab('show');

    $('.nav-tabs a').click(function(e) {
       $(this).tab('show');
       window.location.hash = this.hash;
       e.preventDefault();
    });
  });

  $('.tabs-listing').click(function(e) {
    var hash = window.location.hash;
    $('a[href="' + $(this).attr('href') + '"]').tab('show');
    window.location.hash = this.hash;
    e.preventDefault();
});

  // edit page of biodiversity factsheets
  $(function() {
    $('#country-select').change(function() {
      $('form').submit();
      })
  });

  var mainTitle = $('.main-title').text();
  var mainTitle = mainTitle.charAt(0).toUpperCase() + mainTitle.slice(1);
  var mainTitle = 'Biodiversity factsheet for' +  ' ' + mainTitle;
  $('.main-title').text(mainTitle);

  $('.fact-section a[href$="/@@simple-edit"]').prepOverlay(
     {
      subtype: 'ajax',
      filter: common_content_filter,
      formselector: 'form.kssattr-formname-simple-edit',
      closeselector: 'input#form-buttons-cancel[name="form.buttons.cancel"]',
      noform: 'reload',
     }
  );

  setGISection();
  setBiodivStrategySection();
  setNavigationSections();

});

$(document).click(function(){
  // fix the country profile dropdown: when anything is clicked, hide dropdown
  $('.dd-country-title .options').hide().removeClass('show');
  $('.dd-country-title i').removeClass('fa fa-angle-up').addClass('fa fa-angle-down');
});
