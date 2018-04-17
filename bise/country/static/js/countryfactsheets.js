// Code for the countries section
// This is also loaded in a country page
$(document).ready(function() {

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

  // Restructured tabs content with sidebar
  // Green Infrastracture tab

  var htitle = $('.content-green-infrastructure #parent-fieldname-text h2');

  htitle.each(function() {
    $(this).nextUntil(htitle).andSelf().wrapAll("<div class='gi-content-box'/>");
  });

  var $cc = $('<div class="content-container"/>');
  var $row = $('<div id="g-row" class="row"/>');
  var $cw = $('<div class="tab-content-wrapper col-md-9 "/>');
  var $sb = $('<div class="i-sticky sidebar-wrapper col-md-3 sidebar"/>');

  var contentSelector = $('.content-green-infrastructure #parent-fieldname-text').children('p:first-child').nextAll();

  contentSelector.wrapAll($cc);
  contentSelector.wrapAll($row);

  $('#g-row').prepend($sb);
  contentSelector.wrapAll($cw);

  var $gmenu = $('<ul class="nav-list nav-menu-list-style"/>');

  $sb.append($gmenu);

  var _htc = 0;
  var _hsc = 0;

  var giSections = [];
  $('.gi-content-box').each(function() {
    var $cb = $(this);
    var sectionTitle = $cb.children('h2').text().trim();

    if (sectionTitle) {
      _htc += 1;
      $cb.attr('id', 'htc-' + _htc);
      giSections.push([[sectionTitle, _htc], []]);
    }

    $('h3', this).each(function() {
      var sectionSubTitle = $(this).text().trim();
      _hsc += 1;
      $(this).attr('id', 'hsc-' + _hsc);
      giSections[giSections.length - 1][1].push([sectionSubTitle, _hsc]);
    });
  });

  for (var i = 0; i < giSections.length; i++) {
    var titleID = giSections[i][0][1];
    var $sul = $('<ul class="nav-list trees bullets"/>');
    var $li = $('<li/>');
    var $lia = $('<a class="tree-toggle nav-header"/>').attr('href', document.location.pathname + '#htc-' + titleID);
    var title = giSections[i][0][0].split('.').map(item => item.trim());
    var preNR = title[0];
    var title = title[1];
    var $sp = $('<span/>').text(preNR + '. ');
    var $lip = $('<p/>').text(title);

    $lia.append($sp);
    $lia.append($lip);
    $li.append($lia);
    $gmenu.append($li);
    $li.append($sul);

    var sectionSub = giSections[i][1];

    for (var j = 0; j < sectionSub.length; j++) {
      var subTitleID = sectionSub[j][1];
      var subSectionTitle = $('<p/>').text(sectionSub[j][0]);
      var $sublia = $('<a/>').attr('href', document.location.pathname + '#hsc-' + subTitleID);
      var $subli = $('<li/>');

      $sublia.append(subSectionTitle)
      $subli.append($sublia);
      $sul.append($subli);
    }
  }

  // EU Biodiversity Strategy (contributions) tab page sidebar
  $('.anchor-link').hide();
  var $smwrap = $('<div id="mtr-wrapper" class="mtr-container"/>');
  var $srow = $('<div id="srow" class="row"/>');
  var $swrap = $('<div id="mtr-main-wrapper" class="tab-content col-md-9 "/>');
  var $mwrap = $('<div class="i-sticky mobile-only mobile-sidebar"><div class="mobile-content">Contributions Menu <i class="fa fa-bars" aria-hidden="true"></i></div></div>');

  $('.country-table').wrapAll($smwrap);
  $('.country-table').wrapAll($srow);
  $('.country-table').wrapAll($swrap);

  var $wrapper = $('#srow');

  $mwrap.insertBefore(".country-table");

  var _gtarc = 0; // global counter for name targets

  var $sidebar = $('#sidebar-wrapper');
  var sections = [];

  $('tr').each(function() {
    var $tr = $(this);
    var section_title = $('h2', this).text();
    var cl = $tr.attr('class');

    if (cl && cl.indexOf('target') !== -1) {
      var section_descr = $('td:nth-child(2) p', this).text();
      $tr.addClass('targetTitle');
    }

    if (section_title) {
      sections.push([section_title, section_descr, []]);
    }

    $('td', this).each(function() {
      var $td = $(this);
      var klass = $td.attr('class');
      var text = $td.text().trim();

      if (text.indexOf('Action') === 0) {
        var $tdp = $(this).children('p');
        $tdp.replaceWith(function () {
            return $('<span/>', {
                class: 'cc-action-title',
                html: this.innerHTML
            });
        });
        $(this).children('.cc-action-title').css({
          'color': '#748284',
          'margin': '35px 0 10px 0',
          'display': 'inline-block',
          'font-size': '1.3em'
        });
        var getChar = text.charAt(7);
        var conChar = parseInt(getChar);
        if (!isNaN(conChar)) {
          _gtarc += 1;
          $td.attr('id', 'gtarc-' + _gtarc);
          sections[sections.length - 1][2].push([text, [_gtarc]]);
        }
      }
      if (text.indexOf('Target') === 0) {
        var $tdp = $(this).children('p');
        $tdp.replaceWith(function () {
            return $('<span/>', {
                class: 'cc-target-title',
                html: this.innerHTML
            });
        });
        $(this).children('.cc-target-title').css({
          'color': '#748284',
          'margin': '35px 0 10px 0',
          'display': 'inline-block',
          'font-size': '1.3em'
        });
      }
    })

  });

  var $ssidebar = $('<div id="sidebar-wrapper" class="i-sticky col-md-3 sidebar"/>');
  var $menu = $('<ul class="nav-list nav-menu-list-style"/>');
  var $mclose = $('<div class="mobile-only close-sidebar"><i class="fa fa-times" aria-hidden="true"></i></div>');

  $ssidebar.append($mclose);
  $ssidebar.append($menu);
  $wrapper.append($ssidebar);

  for (var i = 0; i < sections.length; i++) {
    var sectionTitle = sections[i][0].toString().slice(3).trim();
    var sectionTitle = sectionTitle.charAt(0).toUpperCase() + sectionTitle.slice(1).toLowerCase();
    var sectionDescr = sections[i][1];
    var targetID = sectionTitle.slice(-1);

    var loc = 'eu-target-' + targetID;
    var $sa = $('<p/>').text(sectionTitle).data('wloc', loc);

    var $sp = $('<p/>').text(sectionDescr);
    var $ss = $('<a class="tree-toggle nav-header"/>').attr('href', document.location.pathname + '#' + loc);
    $ss.append($sa);
    $ss.append($sp);
    var $sli = $('<li/>');
    $sli.append($ss);
    $menu.append($sli);
    var $sul = $('<ul class="nav-list trees bullets"/>');
    $sli.append($sul);

    var sectionActions = sections[i][2];

    for (var j = 0; j < sectionActions.length; j++) {
      var action = sectionActions[j][0];
      var subText = action.split(':');
      var subTitle = subText[0];
      var subDescription = subText[1];
      var actionID = sectionActions[j][1];
      var navActionTitle = $('<p class="action-title"/>').text(subTitle);
      var navActionDescription = $('<p class="action-description" />').text(subDescription);
      var $sp = $('<a/>').attr('href', document.location.pathname + '#gtarc-' + actionID).append(navActionTitle, navActionDescription);
      var $ali = $('<li/>');
      $ali.append($sp);
      $sul.append($ali);
    }
  }

  if ($('.mtr-container tr').hasClass('targetTitle')) {
    $tdp = $('.targetTitle td:first-child p');
    $tdp.css('display', 'none');
  }

  $('.mtr-container b').each(function() {
  if( $(this).text().trim() === '' )
      $(this).remove();
  });

  $('.mtr-container p').each(function() {
  if( $(this).text().trim() === '' )
      $(this).remove();
  });

  var aLink = $('.mtr-container .anchor-link');

  if (aLink.css('display') == 'none') {
    aLink.css('display', 'block');
  }

  if ($('.country-table table').width() > 500) {
    $('.country-table table').css("width", "100%");
  }

  $("#mtr-main-wrapper").insertAfter("#sidebar-wrapper");

  // show/hide sidebar on mobile
  $('.mobile-sidebar, .close-sidebar').click(function(e) {
    e.stopPropagation();
    $('#sidebar-wrapper').toggleClass("toggle-sidebar");
  });

  $('body').click(function() {
    if ($('#sidebar-wrapper').hasClass('toggle-sidebar')) {
      $("#sidebar-wrapper").toggleClass('toggle-sidebar')
    }
  })

  $('.sidebar li ul li a').click(function() {
    if (navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i)) {
      $('#sidebar-wrapper').hide();
    }
  });

  $('.sidebar a').click(function() {
    var anchID = $(this).attr('href').split('#')[1];
    var anchID = '#' + anchID;

    if (navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i)) {
      var target = $(anchID).offset().top + (-60);
    } else {
      var target = $(anchID).offset().top;
    }

    $('html, body').animate({
      scrollTop: target
    }, 500);

    return false;
  });

  // highlight current sidebar item on scroll
  $(window).scroll(function() {
    position = $(this).scrollTop(); // get the current vertical position of the scroll bar

    $('.mtr-container .sidebar a').each(function() {
      var anchID = $(this).attr('href').split('#')[1];
      var anchID = '#' + anchID;
      var target = $(anchID).offset().top + (-35);

      if (position >= target) {
        $('.sidebar a').removeClass('selected');
        $(this).addClass('selected');
      }
    })

    // toggle  current sidebar item on scroll
    $('.mtr-container .nav-header').each(function() {
      var anchID = $(this).attr('href').split('#')[1];
      var anchID = '#' + anchID;
      var target = $(anchID).offset().top + (-35);

      if (position >= target) {
        $('.mtr-container .tree-toggle').parent().children('ul.trees').hide();
        $(this).parent().children('ul.trees').show();
      }
    })

    $('.sidebar-wrapper a').each(function() {
      var anchID = $(this).attr('href').split('#')[1];
      var anchID = '#' + anchID;
      var target = $(anchID).offset().top + (-5);

      if (position >= target) {
        $('.sidebar-wrapper a').removeClass('selected');
        $(this).addClass('selected');
      }
    })

    // toggle current sidebar item on scroll
    $('.sidebar-wrapper .nav-header').each(function() {
      var anchID = $(this).attr('href').split('#')[1];
      var anchID = '#' + anchID;
      var target = $(anchID).offset().top + (-35);

      if (position >= target) {
        $('.sidebar-wrapper .tree-toggle').parent().children('ul.trees').hide();
        $(this).parent().children('ul.trees').show();
      }
    })
  })

  $('.i-sticky').iSticky(); // activate sticky plugin/polyfill for sidebar
});

$(document).click(function(){
  $('.dd-country-title .options').hide().removeClass('show');
  $('.dd-country-title i').removeClass('fa fa-angle-up').addClass('fa fa-angle-down');
});
