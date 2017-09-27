$(document).ready(function(){


  if( $.isFunction( $.fn.sticky ) ){
    console.log('sticky', $.isFunction( $.fn.sticky ));
  }

  // $("#sidebar-wrapper").sticky({topSpacing:0});

  //
  // Add claro class for css; used by dojo
  $("body").addClass("claro");

  // Dropdown + tab changing functionality

  $('.custom-dropdown select').change(function() {
    var url = $(this).val()
    document.location = url + '#t-' + currentTab;
  });

  $.each($('.fact-contents'), function (index, value) {
    $(value).find("iframe").prop("src", function(){
      return $(this).data("src");
    });
  });

  var countrytabs = $('#country-tabs').children()

  var getTabFromHash = function(hash) {
    if (hash !== '') {
      var sp = hash.split('-');
      if (sp) {
        currentTab = parseInt(sp[1]);
        return currentTab;
      }
    }
    return -1;
  };
  var currentTab = getTabFromHash(window.location.hash.substr(1));
  console.log("Current tab: ", currentTab);

  // debugger;
  if (countrytabs.length > 0) {
    if (currentTab === -1) {
      currentTab = 0;
    }
    countrytabs[currentTab].classList.add('active')
  }

  var hide_show = function() {
    klass = this.classList.value
    var element_id;

    if (klass === "active") {
      element_id = $(this).children('a')[0].hash;
      currentTab = getTabFromHash(element_id);

      siblings = $(this).siblings()
      $.each(siblings, function (index, value) {
        element_id = $(this).children('a')[0].hash;
        element = document.getElementById(element_id)
        $(element).hide()
      });
    }
    else {
      element_id = $(this).children('a')[0].hash;
      currentTab = getTabFromHash(element_id);
      element = document.getElementById(element_id)
      $(element).show()

      siblings = $(this).siblings()
      $.each(siblings, function (index, value) {
        element_id = $(this).children('a')[0].hash;
        element = document.getElementById(element_id)
        $(element).hide()
      });
    }
  };

  $.each(countrytabs, function(index, value) {
    value.addEventListener('click', hide_show);

    klass = value.classList.value
    if (klass != "active") {
      element_id = $(value).children('a')[0].hash;
      element = document.getElementById(element_id)
      $(element).hide()
    }
  });


  // contributions sidebar

  $('.anchor-link').hide();
  var $smwrap = $('<div id="mtr-wrapper" class="mtr-container"/>');
  var $srow = $('<div id="srow" class="row"/>');
  var $swrap = $('<div id="mtr-main-wrapper" class="tab-content col-md-9 pull-right"/>');

  $('.country-table').wrapAll($smwrap);
  $('.country-table').wrapAll($srow);
  $('.country-table').wrapAll($swrap);

  var $wrapper = $('#srow');

  var _gtarc = 0;    // global counter for name targets

  $(function(){
    var $sidebar = $('#sidebar-wrapper');
    var sections = [];

    $('tr').each(function(){
      var $tr = $(this);
      var section_title = $('h2', this).text();
      var cl = $tr.attr('class');

      if (cl && cl.indexOf('target') !== -1) {
        var section_descr = $('td:nth-child(2) p', this).text();
      }

      if (section_title) {
        sections.push([section_title, section_descr, []]);
      }

      $('td', this).each(function() {
        var $td = $(this);
        var klass = $td.attr('class');
        var text = $td.text().trim();

        if (text.indexOf('Action') === 0) {
          _gtarc += 1;
          $td.attr('id', 'gtarc-' + _gtarc);
          sections[sections.length - 1][2].push([text, [_gtarc]]);
        }

      })

    });

    var $ssidebar = $('<div id="sidebar-wrapper" class="i-sticky col-md-3 sidebar"/>');
    var $menu = $('<ul class="nav nav-list nav-menu-list-style"/>');

    $ssidebar.append($menu);
    $wrapper.append($ssidebar);

    for (var i = 0; i < sections.length; i++) {

      var sectionTitle= sections[i][0].toString().slice(3);
      var sectionTitle = sectionTitle.charAt(0).toUpperCase() + sectionTitle.slice(1).toLowerCase();
      var sectionDescr = sections[i][1];
      var targetID = sectionTitle.slice(-1);
      var $sa = $('<a/>').attr('href', '#eu-target-' + targetID);
      $sa.text(sectionTitle);
      var $sp = $('<p/>');
      $sp.text(sectionDescr);
      var $ss = $('<span class="tree-toggle nav-header"/>');
      $ss.append($sa);
      $ss.append($sp);
      var $sli = $('<li/>');
      $sli.append($ss);
      $menu.append($sli);
      var sectionActions = sections[i][2];
      var $sul = $('<ul class="nav nav-list trees bullets"/>');
      $sli.append($sul);

      for (var j = 0; j < sectionActions.length; j++) {
        var action = sectionActions[j][0];
        var subText = action.split(':');
        var subTitle = subText[0];
        var subDescription = subText[1];
        var actionID = sectionActions[j][1];
        var navActionTitle = $('<a class="action-title"/>').attr('href','#gtarc-' + actionID).text(subTitle);
        var navActionDescription = $('<p class="action-description" />').text(subDescription);
        var $sp = $('<span/>').append(navActionTitle, navActionDescription);
        var $ali = $('<li/>');
        $ali.append($sp);
        $sul.append($ali);
      }
    }

    $('.i-sticky').iSticky();   // activate sticky plugin/polyfill for sidebar

    $('.tree-toggle').click(function () {
      $(this).parent().children('ul.trees').toggle(200);
    });

    $(function() {
      $('.tree-toggle').parent().children('ul.trees').toggle(200);
    });

    $('.sidebar li ul li span').click(function(e) {
      $('.sidebar li ul li span').removeClass('selected');
      $(this).addClass('selected');
      return true;
    });

  })

});
