function setCountryOverviewSection() {
  $('.country-overview-content-box h3').removeClass('collapsible');
}

function setGISection() {
  // Restructured tabs content with sidebar
  // Green Infrastracture tab

  var $cc = $(
  '<div class="content-container">' +
    '<div class="row">' +
      '<div class="i-sticky sidebar-wrapper col-md-3 sidebar"/>' +
      '<div class="tab-content-wrapper col-md-9 "/>' +
    '</div>' +
  '</div>'
  );

  var giContent = $('.content-green-infrastructure #parent-fieldname-text');
  var giTitle = giContent.children('h2');

  giTitle.each(function() {
    $(this).nextUntil(giTitle).andSelf().wrapAll("<div class='gi-content-box'/>");
  });

  var giContentSelector = giContent.children('p:first-child').nextAll();

  giContent.append($cc);
  $('.tab-content-wrapper').append(giContentSelector);

  var $gmenu = $('<ul class="nav-list nav-menu-list-style"/>');
  $('.sidebar-wrapper').append($gmenu);

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

}

function setBiodivStrategySection() {
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
        var $tdp = $(this).children('p').addClass('cc-action-title');
        var getChar = text.charAt(7);
        var conChar = parseInt(getChar);
        if (!isNaN(conChar)) {
          _gtarc += 1;
          $td.attr('id', 'gtarc-' + _gtarc);
          sections[sections.length - 1][2].push([text, [_gtarc]]);
        }
      }
      if (text.indexOf('Target') === 0) {
        var $tdp = $(this).children('p').addClass('cc-target-title');
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
}

function setNavigationSections() {
  // this depends on setGISection and setBiodivStrategySection functions
  var isMobileDevice = navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i);

  $('body').click(function() {
    if ($('#sidebar-wrapper').hasClass('toggle-sidebar')) {
      $("#sidebar-wrapper").toggleClass('toggle-sidebar')
    }
  })

  $('.sidebar li ul li a').click(function() {
    if (isMobileDevice) {
      $('#sidebar-wrapper').hide();
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

  // highlight current sidebar item on scroll
  $(window).scroll(function() {

    var position = $(this).scrollTop(); // get the current vertical position of the scroll bar

    // sidebar implementation for the EU Biodiversity Strategy tab
    $('.mtr-container .sidebar a').each(function() {
      // when scrolled into view, set the nav link as selected
      var anchID = $(this).attr('href').split('#')[1];
      var anchID = '#' + anchID;
      var target = $(anchID).offset().top + (-35);

      if (position >= target) {
        $('.sidebar a').removeClass('selected');
        $(this).addClass('selected');
      }
    })
    $('.mtr-container .nav-header').each(function() {
      // toggle current sidebar item on scroll
      var anchID = $(this).attr('href').split('#')[1];
      var anchID = '#' + anchID;
      var target = $(anchID).offset().top + (-35);

      if (position >= target) {
        $('.mtr-container .tree-toggle').parent().children('ul.trees').hide();
        $(this).parent().children('ul.trees').show();
      }
    })

    // sidebar implementation for the GreenInsfrastructure tab
    $('.sidebar-wrapper a').each(function() {
      // when scrolled into view, set the nav link as selected
      var anchID = '#' + $(this).attr('href').split('#')[1];
      // console.log("anchid", anchID);
      // console.log("anchid el", $(anchID));
      var target = $(anchID).offset().top + (-5);

      if (position >= target) {
        $('.sidebar-wrapper a').removeClass('selected');
        $(this).addClass('selected');
      }
    })
    $('.sidebar-wrapper .nav-header').each(function() {
      // toggle current sidebar item on scroll
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
}
