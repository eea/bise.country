$(document).ready(function(){
  //
  // Add claro class for css; used by dojo
  $("body").addClass("claro");

  // Dropdown functionality

  $('.custom-dropdown select').change(function() {
    var url = $(this).val()
    document.location = url
  });

  $.each($('.fact-contents'), function (index, value) {
    $(value).find("iframe").prop("src", function(){
      return $(this).data("src");
    });
  });


  var countrytabs = $('#country-tabs').children()
  countrytabs[0].classList.add('active')

  var hide_show = function() {
    klass = this.classList.value

    if (klass === "active") {
      siblings = $(this).siblings()
      $.each(siblings, function (index, value) {
        element_id = $(this).children('a')[0].hash;
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
