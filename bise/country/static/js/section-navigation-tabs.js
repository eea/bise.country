function setupScrollHandler() {
  // setup sidebar scroll implementation

  var parent = $(".tab-pane.active");
  var position = $(this).scrollTop(); // get the current vertical position of the scroll bar

  $('.sidebar-wrapper a', parent).each(function() {
    // when scrolled into view, set the nav link as selected
    var anchID = '#' + $(this).attr('href').split('#')[1];
    var target = $(anchID).offset().top + (-5);

    if (position >= target) {
      $('.sidebar-wrapper a', parent).removeClass('selected');
      $(this).addClass('selected');
    }
  });

  $('.sidebar-wrapper .nav-header', parent).each(function() {
    // toggle current sidebar item on scroll
    var anchID = $(this).attr('href').split('#')[1];
    var anchID = '#' + anchID;
    var target = $(anchID).offset().top + (-35);

    if (position >= target) {
      $('.sidebar-wrapper .tree-toggle', parent).parent().children('ul.trees').hide();
      $(this).parent().children('ul.trees').show();
    }
  });

}
function setupSidebar(target) {
  // Setup the sidebar wrapper
  var row = $('<div class="row"/>');
  var sidebar = $('<div class="sidebar-wrapper i-sticky col-md-3 sidebar"/>');
  var swrap = $('<div class="tab-content col-md-9 "/>');
  var menu = $('<ul class="nav-list nav-menu-list-style"/>');
  var mclose = $('<div class="mobile-only close-sidebar"><i class="fa fa-times" aria-hidden="true"></i></div>');
  sidebar.append(mclose);
  sidebar.append(menu);
  $(target).wrapAll(swrap);
  sidebar.insertBefore($(target).parent());
  var parent = $(target).parent().parent();
  parent.find('[class*="col-md"]').wrapAll(row);

  return parent.find('.row');
}

function setMobileSidebar(sidebar_wrapper, target, sections) {
  var $mwrap = $('<div class="i-sticky mobile-only mobile-sidebar"><div class="mobile-content">Contributions Menu <i class="fa fa-bars" aria-hidden="true"></i></div></div>');
  $mwrap.insertBefore(target);
  var menu = sidebar_wrapper.find('.nav-list.nav-menu-list-style');

  for (var i = 0; i < sections.length; i++) {
    var sectionTitle = sections[i].title;
    var sectionDescr = sections[i].description;
    var targetID =  sections[i].sectionId;
    var targetHash = sections[i].sectionHash;

    var loc = targetHash;
    var $sa = $('<p/>').text(sectionTitle).data('wloc', loc);
    var $ss = $('<a class="tree-toggle nav-header"/>').attr('href', document.location.pathname + '#' + loc);
    $ss.append($sa);
    if (sectionDescr) {
      var $sp = $('<p/>').text(sectionDescr);
      $ss.append($sp);
    }
    var $sli = $('<li/>');
    $sli.append($ss);
    menu.append($sli);

    var sectionActions = sections[i].subsections;
    if (typeof sectionActions !== 'undefined') {
      var $sul = $('<ul class="nav-list trees bullets"/>');
      $sli.append($sul);
      for (var j = 0; j < sectionActions.length; j++) {
        var subTitle = sectionActions[j].title;
        var subDescription = sectionActions[j].description;
        var actionID = sectionActions[j].sectionId;
        var actionHash = sectionActions[j].sectionHash;
        var navActionTitle = $('<p class="action-title"/>').text(subTitle);
        var navActionDescription = $('<p class="action-description" />').text(subDescription);
        var $sp = $('<a/>').attr('href', document.location.pathname + '#' + actionHash).append(navActionTitle, navActionDescription);
        var $ali = $('<li/>');
        $ali.append($sp);
        $sul.append($ali);
      }
    }
  }
}

function setOverviewSection() {
  var ovSections = [];
  $(".content-country-overview .country-overview-content-box").each(function(){
    var $cb = $(this);
    var sectionTitle = $cb.children('.fact-title').text().trim();
    if (sectionTitle) {
      var sectionIdPrefix = $cb.attr("id");
      $cb.attr('id', sectionIdPrefix);
      var section = {
        "title": sectionTitle,
        "description": "",
        "sectionHash": sectionIdPrefix,
        "sectionId": parseInt(sectionIdPrefix.split('-')[1]),
        "subsections": []
      }
      ovSections.push(section);
    }
  });
  var sidebar_wrapper = $(".content-country-overview > .row");
  setMobileSidebar(sidebar_wrapper, '.content-country-overview', ovSections);
};

function setNatureDirectivesSection() {
  var ndSection = [];
  var sidebar_wrapper = $(".content-eu-nature-directives .row");
  // add missing close button for the mobile sidebar
  var mclose = $('<div class="mobile-only close-sidebar"><i class="fa fa-times" aria-hidden="true"></i></div>');
  sidebar_wrapper.find('.sidebar-wrapper').prepend(mclose);
  setMobileSidebar(sidebar_wrapper, '.content-eu-nature-directives .content-container', ndSection);
};

function setGISection() {
  // Restructured tabs content with sidebar
  // Green Infrastracture tab
  var parent = $('.content-green-infrastructure');

  var giContent = $('#parent-fieldname-text', parent);
  var giTitle = giContent.children('h2');

  giTitle.each(function() {
    $(this).nextUntil(giTitle).andSelf().wrapAll("<div class='gi-content-box'/>");
  });

  var giContentSelector = giContent.find('.gi-content-box');

  $('.tab-content-wrapper', parent).append(giContentSelector);

  var _hgi = 0;
  var _hsc = 0;

  var giSections = [];
  $('.gi-content-box').each(function() {
    var $cb = $(this);
    var sectionTitle = $cb.children('h2').text().trim();
    if (sectionTitle) {
      var sectionIdPrefix = 'hgi-' + _hgi;
      $cb.attr('id', sectionIdPrefix);
      var section = {
        "title": sectionTitle.toString().slice(3).trim(),
        "description": "",
        "sectionHash": sectionIdPrefix,
        "sectionId": _hgi,
        "subsections": []
      }
      giSections.push(section);
      _hgi += 1;
    }
    $('h3', this).each(function() {
      var sectionSubTitle = $(this).text().trim();
      var sectionSubIdPrefix = 'hsc-' + _hsc;
      $(this).attr('id', sectionSubIdPrefix);
      var subsection = {
        "title": sectionSubTitle,
        "description": "",
        "sectionHash": sectionSubIdPrefix,
        "sectionId": _hsc,
      }
      giSections[giSections.length - 1].subsections.push(subsection);
      _hsc += 1;
    });
  });
  var sidebar_wrapper = setupSidebar('.gi-content-box');
  setMobileSidebar(sidebar_wrapper, '.content-green-infrastructure', giSections);
}

function setBiodivStrategySection() {
  // EU Biodiversity Strategy (contributions) tab page sidebar
  $('.anchor-link').hide();
  var sidebar_wrapper = setupSidebar('.country-table');
  
  var $smwrap = $('<div id="mtr-wrapper" class="mtr-container"/>');
  sidebar_wrapper.wrapAll($smwrap);

  var _gtarc = 0; // global counter for name targets

  var sections = [];

  $('tr').each(function() {
    var $tr = $(this);
    var sectionTitle = $('h2', this).text();
    var cl = $tr.attr('class');

    if (cl && cl.indexOf('target') !== -1) {
      var sectionDescr = $('td:nth-child(2) p', this).text();
      $tr.addClass('targetTitle');
    }

    if (sectionTitle) {
      var targetID = sectionTitle.slice(-1);
      var sectionIdPrefix = 'eu-target-' + targetID;
      var section = {
        "title": sectionTitle,
        "description": sectionDescr,
        "sectionHash": sectionIdPrefix,
        "sectionId": targetID,
        "subsections": []
      }
      sections.push(section);
    }

    $('td', this).each(function() {
      var $td = $(this);
      var klass = $td.attr('class');
      var text = $td.text().trim();

      if (text.indexOf('Action') === 0) {
        var $tdp = $(this).children('p').addClass('cc-action-title');
        var getChar = text.charAt(7);
        var conChar = parseInt(getChar);
        if (!isNaN(conChar)) {
          var sectionSubIdPrefix = 'htc-' + _gtarc;
          $td.attr('id', sectionSubIdPrefix);
          var subText = text.split(':');
          var subTitle = subText[0];
          var subDescription = subText[1];
          var subsection = {
            "title": subTitle,
            "description": subDescription,
            "sectionHash": sectionSubIdPrefix,
            "sectionId": _gtarc,
          }
          sections[sections.length - 1].subsections.push(subsection);
          _gtarc += 1;
        }
      }
      if (text.indexOf('Target') === 0) {
        var $tdp = $(this).children('p').addClass('cc-target-title');
      }
    })

  });
  setMobileSidebar(sidebar_wrapper, '.country-table', sections);

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

  // show/hide sidebar on mobile
  $('.mobile-sidebar, .close-sidebar').click(function(e) {
    e.stopPropagation();
    $('.sidebar-wrapper').toggleClass("toggle-sidebar");
  });
}

function setNavigationSections() {
  // this depends on setGISection and setBiodivStrategySection functions
  var isMobileDevice = navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i);

  $('body').click(function() {
    if ($('.sidebar-wrapper').hasClass('toggle-sidebar')) {
      $(".sidebar-wrapper").toggleClass('toggle-sidebar')
    }
  });

  $('.sidebar li ul li a').click(function() {
    if (isMobileDevice) {
      $('.sidebar-wrapper').hide();
    }
  });

  $('.sidebar a').click(function() {
    var anchID = $(this).attr('href').split('#')[1];
    var anchID = '#' + anchID;

    if (isMobileDevice) {
      var target = $(anchID).offset().top + (-60);
    } else {
      var target = $(anchID).offset().top;
    }

    $('html, body').animate({
      scrollTop: target
    }, 500);

    return false;
  });

  $('.i-sticky').iSticky(); // activate sticky plugin/polyfill for sidebar

  // 96627 implement sticky position for browsers that do not support it such
  // as IE
  window.setTimeout(function() {
      // we need a small timeout in order to ensure that we get all of the tabs
      // content
      if (window.Stickyfill) {
          $('.i-sticky').each(function(idx, el) {
              return new window.Stickyfill.Sticky(el);
          });
      }
  }, 3000);
}
