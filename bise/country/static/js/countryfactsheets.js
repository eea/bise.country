$(document).ready(function(){
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

});
