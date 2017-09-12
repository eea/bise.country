$(document).ready(function(){
  //
  // Add claro class for css; used by dojo
  $("body").addClass("claro");

  // Dropdown + tab changing functionality
  var currentTab = -1;

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

  var hash = window.location.hash.substr(1);
  if (hash !== '') {
    var sp = hash.split('-');
    if (sp) {
      currentTab = parseInt(sp[1]);
    }
  }

  // debugger;
  if (countrytabs.length > 0) {
    if (currentTab === -1) {
      currentTab = 0;
    }
    countrytabs[currentTab].classList.add('active')
  }

  var hide_show = function() {
    klass = this.classList.value

    if (klass === "active") {
      siblings = $(this).siblings()
      $.each(siblings, function (index, value) {
        element_id = $(this).children('a')[0].hash;
        currentTab = element_id;
        element = document.getElementById(element_id)
        $(element).hide()
      });
    }
    else {
      element_id = $(this).children('a')[0].hash;
      element = document.getElementById(element_id)
      $(element).show()

      siblings = $(this).siblings()
      $.each(siblings, function (index, value) {
        element_id = $(this).children('a')[0].hash;
        currentTab = element_id;
        element = document.getElementById(element_id)
        $(element).hide()
      });
    }
  }

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
