// Code for the countries section
// This is also loaded in a country page
jQuery(document).ready(function($) {

  // var $fc = $('<div class="facts-container"/>');
  // var overviewTab = $('.country-overview-section');
  //
  // overviewTab.append($fc);

  // Add claro class for css; used by dojo
  $("body").addClass("claro");
  var hash = window.location.hash;
  var country_tabs = $("#country-tabs");
  var country_tabs_links = country_tabs.find('li a');
  var isCountriesPage = country_tabs_links.attr('href') === '##overview';
  var noHash = window.location.href.indexOf("##") == -1;
  if (isCountriesPage && noHash) {window.location.href += '##overview';}
  var nav_list = [];
  nav_list = nav_list.concat($(".section-content .nav-list li a"));

  // select country dropdown functionality on countries section page
  $('.country-dropdown select').change(function() {
    var url = $(this).val();
    var link = url.substring(url.lastIndexOf("/") + 1);
    var tabsLoc = {
      '##overview': 't-0',
      '##eu-nature-directives': 't-1',
      '##eu-biodiversity-strategy': 't-2',
      '##maes': 't-3',
      '##green-infrastructure': 't-4'
    }
    for (var key in tabsLoc) {
      if (tabsLoc.hasOwnProperty(key)) {
        var wLoc = window.location.href;
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

  var currentTab = getTabFromHash(hash.substr(2));

  $('.custom-dropdown select').change(function() {
    var url = $(this).val();
    if (currentTab > -1) {
      url += "##t-" + currentTab;
    }
    document.location = url;
  });

  country_tabs.find("li").click(function() {
    var element_id = $(this).children('a')[0].hash;
    currentTab = getTabFromHash(element_id);
    var parent = $(".tab-pane.active");

    // $.each($("iframe", parent), function() {
    //   $(this).attr({
    //       src: $(this).attr("src")
    //   });
    // });
  });


  // workaround for lazy loading iframes
  $.each($('.fact-contents'), function(index, value) {
    $(value).find("iframe").prop("src", function() {
      return $(this).data("src");
    });
  });

  // Add the edit button
  $.each($(".section-content .nav-list li a"), function(index, value) {
    var edit_href = $(value).prop("href").split("#")[0] + 'edit';
    var edit_ctrl = $("<div/>", {
      class: 'edit-button'
    });
    var edit_i = $("<i/>", {
        "class": "fa fa-pencil-square-o"
    });
    var edit_a = $("<a/>", {
      target: "_blank",
      "class": "btn btn-edit",
      text: "Edit section",
      href: edit_href,
    });
    edit_a.prepend(edit_i);
    edit_ctrl.append(edit_a);
    $($(".fact-contents")[index]).append(edit_ctrl);
  });

  $('.fact-contents iframe').each(function() {
    var frame_src = $(this).attr('src');
    $(this).attr('data-src', frame_src);
    $(this).removeAttr('src');
  });

  $('.fact-contents iframe').addClass('lazyload');

  // center tabs menu items on click on small screen sizes
  country_tabs_links.click(function() {
    var $parent = $(this).parent();
    centerTabItem($parent, country_tabs);
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
    hash && $('.nav-tabs a[href="' + hash + '"]').tab('show');

    $('.nav-tabs a').click(function(e) {
       $(this).tab('show');
       window.location.hash = this.hash;

      // highlight current sidebar item on scroll
      $(window).off('scroll');
      $(window).scroll(setupScrollHandler);

       e.preventDefault();
    });

    $(window).scroll(setupScrollHandler)

  });

  $('.tabs-listing').click(function(e) {
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
      noform: 'reload'
     }
  );

  $('.tab-content iframe').width('100%');

  // comment iframes for lazyload
  // function comment(element) {
  //   element.wrap(function() {
  //     return '<!--' + this.outerHTML + '"-->';
  //   });
  // }
  // comment($('.tab-content .fact-contents iframe'));
  //
  // $('.fact-contents').addClass('lazyload');

  $('#nature-directives .fact h3, .country-overview-content-box h3').removeClass('collapsible').addClass('fact-title');

  // activate lazyload for iframes
  // $('.lazyload').lazyload();

  setGISection();
  setBiodivStrategySection();

  setNavigationSections();

  // click on country tab when hash is changed such as using the forward backward
  // browser buttons
  var links = country_tabs.find('a');
  function locationHashChanged() {
    var hash = window.location.hash;
    var link;
    if (country_tabs.length) {
      link = links.filter(function(idx, el){
        return el.href.indexOf(hash) !== -1;
      });
      link.click();
    }
  }
  window.onhashchange = locationHashChanged;

  var isIe = function detectIE() {
      var ua = window.navigator.userAgent;
      var msie = ua.indexOf('MSIE ');
      if (msie > 0) {
          // IE 10 or older => return true
          return true;
      }

      var trident = ua.indexOf('Trident/');
      if (trident > 0) {
          // IE 11 => return true
          return true;
      }

      var edge = ua.indexOf('Edge/');
      if (edge > 0) {
          // Edge (IE 12+) => return true
          return true;
      }

      // other browser
      return false;
  };
  if (!endsWith(window.location.pathname, '/')) {
      if (isIe()) {
          var pathname = window.location.pathname;
          window.location.pathname = pathname + '/';
      }
  }
});

jQuery(document).click(function(){
  // fix the country profile dropdown: when anything is clicked, hide dropdown
  $('.dd-country-title .options').hide().removeClass('show');
  $('.dd-country-title i').removeClass('fa fa-angle-up').addClass('fa fa-angle-down');

  // remove empty divs within quick-links-list
  $.each($('.quick-links-list').children(), function (index, el) {
      if ($(el).children().length == 0){
          $(el).remove();
      }
  })
});

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
