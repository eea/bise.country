function fLoc(fname) {
  return window.location.origin + "/++resource++bise.country/js/countries/" + fname;
}

function setCountryNames(countries, names) {
  // TODO: rewrite, this is stupid
  countries.filter(function(d) {
    return names.some(function(n) {
      if (d.id == n.id) {
        return d.name = n.name;
      } else {
      }
    });
  });
}

function setCountryFlags(countries, flags) {
  countries.filter(function(d) {
    return flags.some(function(n) {
      if (d.id == n.id) {
        return d.url = n.url;
      }
    });
  });
}

function setCountryBounds(countries, path) {
  countries = countries.filter(function(d) {
    // France includes territory in South America, we don't include that in
    // bounds calculation
    if (d.name === 'France') {
      if (d.geometry.coordinates.length === 3) {
        d.geometry.coordinates = d.geometry.coordinates.slice(1);
      }
    }
    return d.bounds = path.bounds(d);
  });
  return countries;
}

function getSelectedCountry() {
  // get the "desired country" from the window location

  var sc;
  var frags = window.location.href.split("/").reverse();
  for (var f=0; f<frags.length; f++) {
    if (frags[f].length) {
      sc = frags[f];
      break;
    }
  }

  if(sc) {
    // TODO: use a better method to uppercase first letter of words
    sc =  sc[0].toUpperCase() + sc.slice(1);
    if (sc.indexOf("#") >= 0) {
      sc = sc.substring(0, sc.indexOf('#'))
    }
    sc = sc.replace('-', ' ');
    sc = sc.split('.')[0];    // for testing

    if (sc == 'Czech republic') sc = 'Czech Republic';
    if (sc == 'United kingdom') sc = 'United Kingdom';
  }
  return sc;
}

function zoomToCountry(
  selectedCountry, countries, path, projection, width, height
) {
  var defaultScale = 680;
  var defaultPos = [200, 960];

  projection
    .scale(1)
    .translate([0, 0]);

  if (selectedCountry) {
    var zoomCountries = countries.filter(function(d) {
      return d.name === selectedCountry;
    });

    var country = zoomCountries[0];
    if (!country) {   // generic settings, from tryouts
      return projection.scale(defaultScale).translate(defaultPos);
    }

    var b = path.bounds(country);
    var vRatio = (height/width * 0.8);    // viewport ratio
    var cwRatio = (b[1][0] - b[0][0]) / width;    // bounds to width ratio
    var chRatio = (b[1][1] - b[0][1]) / height;   // bounds to height ratio
    var s =  vRatio / Math.min(cwRatio, chRatio);
    t = [
      (width - s * (b[1][0] + b[0][0])) / 2,
      (height - s * (b[1][1] + b[0][1])) / 2
    ];

    console.log("Scale", s, "t", t);
    return projection.scale(s).translate(t);
  } else {
    return projection.scale(defaultScale).translate(defaultPos);
  }
}

$(document).ready(function() {
  $('body').addClass('factsheets');

  var isGlobalMap = $("svg-container").data('globalmap') === 'global';

  var width = $(window).width();
  var height = 560;

  if ($('svg-container').length === 0) {
    $('#site-body').prepend(
      '<div class="header-bg">' +
        '<svg-container>' +
          '<svg ></svg>' +
        '</svg-container>' +
      '</div>'
    );      // viewBox="0 0 1200 300"
    height = 380;
  }

  var selectedCountry = getSelectedCountry();
  console.log("Selected country", selectedCountry);

  var wflags = fLoc("countries.tsv");
  var w110 = fLoc("world-110m.json");
  var wnames = fLoc("world-country-names.tsv");

  var q = queue()
    .defer(d3.json, w110)
    .defer(d3.tsv, wnames)
    .defer(d3.tsv, wflags)
    .await(ready);

  function ready(error, world, names, flags) {

    if (error) {
      alert('error: ' + error);
      return;
    }

    flags.forEach(function (d) { d.id = +d.id;});
    flags.sort(function(a,b) {
      return +a.id < +b.id ? -1 : +a.id > +b.id ? +1 : 0;
    });

    // read geometry of countries. See https://github.com/topojson/world-atlas
    var countries = topojson.feature(world, world.objects.countries).features;
    var projection = d3.geo.robinson().precision(0.1);

    var path = d3.geo.path().projection(projection);

    // Augument the countries GeoJSON data with names, bounds and flags

    setCountryNames(countries, names);
    setCountryFlags(countries, flags);
    setCountryBounds(countries, path);

    zoomToCountry(selectedCountry, countries, path, projection, width, height);

    // we need to reset the country bounds because of the zoom
    setCountryBounds(countries, path);

    // path.projection(projection.scale(300));  // .translate([110,100]));

    var svg = d3
      .select("body")
      .select("svg")
      .attr("width", width)
      .attr("height", height);

    // elements defined in defs can be reused with <use>
    var defs = svg.append("defs");
    defs
      .append("path")
      .datum(
        {
          type: "Sphere"
        }
      )
      .attr("id", "sphere")
      .attr("d", path);

    svg
      .append("use")
      .attr("class", "fill")
      .attr("href", "#sphere");

    // TODO: can this be optimized, do the replacement before setting the attr?
    // console.log("The D: ", d3.select('#sphere').attr('d'));
    var new_path = d3.select('#sphere').attr('d').replace(/,/g, ' ');

    // this acts as a layer over the flags
    var gStep = isGlobalMap ? [10, 10] : [4, 4];
    var graticule = d3.geo.graticule().step(gStep);

    var lines = svg.selectAll('path.lines').data([graticule()]);
    lines.enter().append('path').classed('lines', true);
    lines.attr('d', path);
    lines.attr("id", function(d) {    // set the id, based on coordinates
      if (d.coordinates[0][0] == d.coordinates[1][0]) {
        return (d.coordinates[0][0] < 0) ? -d.coordinates[0][0] + "W" : d.coordinates[0][0] + "E";
      }
      else if (d.coordinates[0][1] == d.coordinates[1][1]) {
        return (d.coordinates[0][1] < 0) ? -d.coordinates[0][1] + "S" : d.coordinates[0][1] + "N";
      }
    });
    lines.exit().remove();

    svg.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", new_path);

    // create clip paths for the country rects
    defs
      .selectAll("mask")
      .data(countries)
      .enter()
      .append("clipPath")
      .attr("class", "mask")
      .attr("id", function(d) {
        return "iso-" + d.id;
      })
      .attr("width", function (d) {
        return d.bounds[1][0] - d.bounds[0][0];}
      )
      .attr("height", function (d) {
        return d.bounds[1][1] - d.bounds[0][1];
      })
      .append("path")
      .attr("d", path);

    // create an svg group for each country
    var group = svg
      .selectAll("country")
      .data(countries)
      .enter()
      .append('g');

    group.append("path").attr('class', 'country-stroke').attr('d', path);

    // This inserts the flags as images in the svg
    svg.selectAll("country")
      .data(countries)
      .enter()
      .insert("image", ".graticule")
      .attr("class", "country")
      .attr("href", function (d){
        if (window.available_map_countries.indexOf(d.name) > -1) {
          return d.url;
        }
      })
      .attr("x", function (d) {
        return d.bounds[0][0];}
      )
      .attr("y", function (d) {
        return d.bounds[0][1];
      })
      .attr("width", function (d) {
        return d.bounds[1][0] - d.bounds[0][0];
      })
      .attr("height", function (d) {
        return d.bounds[1][1] - d.bounds[0][1];}
      )
      .attr("preserveAspectRatio", "none")
      .attr("clip-path", function(d) {
        return "url(#iso-" + d.id + ")";
      });

    var $rect = group.append('rect')
      .attr("class", "country-wrapper")
      .attr("x", function (d) {
        return d.bounds[0][0];
      })
      .attr("y", function (d) {
        return d.bounds[0][1];
      })
      .attr("width", function (d) {
        return d.bounds[1][0] - d.bounds[0][0];
      })
      .attr("height", function (d) {
        return d.bounds[1][1] - d.bounds[0][1];
      })
      .attr("preserveAspectRatio", "none")
      .attr("clip-path", function(d) {
        return "url(#iso-" + d.id + ")";
      })

      .attr("opacity",function(d){
        if (isGlobalMap === true) {
          if (window.available_map_countries.indexOf(d.name) > -1) {
            return "0.98";
          }
        }
      })
      .attr("fill",function(d){
        if (isGlobalMap === true) {
          if (window.available_map_countries.indexOf(d.name) > -1) {
            return '#41b664';
          }
          return "#efe7d4";     // "#f7f4ed"; // change color here;    //
        }

        if (d.name == selectedCountry)
          return 'none';
        else
          return "#efe7d4";     // "#f7f4ed"; // change color here;
      });

    // add the coordinates on the side of the map
    var latitudes = graticule.lines().filter(function(d){
      return d.coordinates.length == 3;
    });

    svg.selectAll('text')
      .data(latitudes)
      .enter()
      .append("text")
      .text(function(d) {
        var c = d.coordinates[0][0] + "°"
        return c;
      })
      .attr("class","label")
      .attr("dx", 20)
      .attr("dy", function(d) {
        return projection([0, d.coordinates[0][0]])[1] - 6;
      });

    if (isGlobalMap) {
      $rect.on('click', function(d){
        if (window.available_map_countries.indexOf(d.name) > -1) {
          var link = d.name.toLowerCase();
          // "/countries/eu_country_profiles/"+link+"";
          location.href = link;
          return true;
        }
      })
      .on('mouseover', function(d){
        if (window.available_map_countries.indexOf(d.name) > -1) {
          // console.log("mouseover", this);
          d3.select(this).attr('opacity','0');
        }
      })
      .on('mouseout', function(d){
        if (window.available_map_countries.indexOf(d.name) > -1) {
          d3.select(this).attr('opacity','0.98');
        }
      });
    }
  }
});
