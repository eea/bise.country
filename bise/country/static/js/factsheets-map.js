Number.isFinite = Number.isFinite || function(value) {
  return typeof value === 'number' && isFinite(value);
}

function fLoc(fname) {
  return window.location.origin + "/++resource++bise.country/js/countries/" + fname;
}

function setCountryNames(countries) {
  countries.forEach(function(d) {
    d.name = d.properties.name;
  });
}

function setCountryFlags(countries, flags) {
  countries.forEach(function(c) {
    var cname = c.name.replace(' ', '_');
    flags.forEach(function(f) {
      if (f.url.indexOf(cname) > -1) {
        c.url = f.url;
      }
    });
  });
}

function setCountryBounds(countries, path) {
  countries = countries.filter(function(d) {
    // France includes territory in South America, we don't include that in
    // bounds calculation
    // TODO: maybe a better way would be to give a set of coordinates and only
    // include geometries that are in bounds of those
    // if (d.name === 'France') {
    //   if (d.geometry.coordinates.length === 3) {
    //     d.geometry.coordinates = d.geometry.coordinates.slice(1);
    //   }
    // }
    return d.bounds = path.bounds(d);
  });
  return countries;
}

function getSelectedCountry() {
  // get the "desired country" from data attribute

  window.isHeaderMap = $(".country-header").hasClass('country-header');

  var sc;

  if (window.isHeaderMap) {
    var $cd = $(".country-header").data('zoom-country');
    // uppercase the first letter
    var w = $cd.charAt(0).toUpperCase() + $cd.slice(1);
    sc = w
  }
  return sc;
}

function zoomToCountry(
  selectedCountry, countries, path, projection, width, height
) {

  projection
    .scale(1)
    .translate([0, 0]);

  var b, t, s, vRatio;
  // var vRatio = (height/width * 1.0);    // viewport ratio

  if (window.isGlobalMap) {
    // Make a new feature collection of all desired countries,
    // to calculate zoom bounds
    var features = {
      type: "FeatureCollection",
      features: []
    }
    countries.forEach(function(c) {
      if (window.available_map_countries.indexOf(c.name) === -1) {
        return;
      }
      features.features.push(c);
    });
    b = path.bounds(features);    // d3.geo
    vRatio = 0.9; // hardcode a ratio because it can vary widely from phone to desktop
  }
  else {
    var zoomCountries = countries.filter(function(d) {
      return d.name === selectedCountry;
    });

    var country = zoomCountries[0];

    b = path.bounds(country);
    vRatio = 0.3; // hardcode a ratio because it can vary widely from phone to desktop
  }

  var cwRatio = (b[1][0] - b[0][0]) / width;    // bounds to width ratio
  var chRatio = (b[1][1] - b[0][1]) / height;   // bounds to height ratio
  var s =  vRatio / Math.max(cwRatio, chRatio);
  t = [
    (width - s * (b[1][0] + b[0][0])) / 2,
    (height - s * (b[0][1] + b[1][1])) / 2
  ];

  return projection.scale(s).translate(t);
}

$(document).ready(function() {
  $('body').addClass('factsheets');

  window.isGlobalMap = $("svg-container").data('globalmap') === 'global';

  var width = isGlobalMap ? $('svg').width() : $(window).width();
  console.log('SVG width', width);
  var height = 560;

  if ($('.svg-wrapper').length > 0) {
    var $svg = $('.svg-wrapper').detach();
    var $body = $('#site-body');
    $body.prepend($svg);
  }

  var selectedCountry = getSelectedCountry();
  console.log("Selected country", selectedCountry);

  var wflags = fLoc("countries.tsv");
  var w110 = fLoc("countries.geo.json");

  var q = d3.queue()
    .defer(d3.json, w110)
  // .defer(d3.tsv, wnames)
    .defer(d3.tsv, wflags)
    .await(ready);

  function ready(error, world, flags) {   // names,

    if (error) {
      alert('error: ' + error);
      return;
    }

    // read geometry of countries. See https://github.com/topojson/world-atlas
    // countries.geo.json comes from https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json

    var countries = world.features;
    var projection = d3.geoRobinson()   // azimuthalEquidistant conicEquidistant()
      .precision(0.1)
      .clipAngle(90);

    var path = d3.geoPath().projection(projection);

    // Augument the countries GeoJSON data with names, bounds and flags
    setCountryNames(countries);
    setCountryFlags(countries, flags);
    setCountryBounds(countries, path);

    zoomToCountry(selectedCountry, countries, path, projection, width, height);

    // we need to reset the country bounds because of the zoom
    setCountryBounds(countries, path);

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

    // Calculate the center meridian for the sphere. It serves to calculate
    // clipping of coordinate labels
    var bbox = svg.node().getBBox();
    var p = [bbox.x + bbox.width/2, bbox.y + bbox.height/2];
    var cp = projection.invert(p);   // lon, lat

    var gStep = window.isGlobalMap ? [10, 10] : [4, 4];
    var graticule = d3.geoGraticule().step(gStep);

    // draw the graticule lines
    var lines = svg.selectAll('path.lines')
      .data([graticule()])
      .enter()
      .append('path')
      .attr('class', 'lines')
      .attr('d', path)
    ;

    var minorGraticule = d3.geoGraticule().step([gStep[0]/4, gStep[1]/4]);
    svg.selectAll('path.sublines')
      .data(minorGraticule.lines())
      .enter()
      .append("path")
      .attr("class", "sublines")
      .attr("d", path)
    ;

    // functions as a mask for the country flags
    svg.append("path")
      .attr("class", "flagmask")
      .attr("d", path);

    // create an svg group for each country
    var group = svg
      .selectAll("country")
      .data(countries)
      .enter()
      .append('g')
    ;

    // This inserts the flags as images in the svg
    group
      .insert("image", ".flagmask")
      .attr("class", "country")
      .attr("href", function (d){
        if (window.available_map_countries.indexOf(d.name) > -1) {
          if (window.isGlobalMap) return d.url;
          if (selectedCountry && selectedCountry === d.name) return d.url;
        }
      })
      .attr("x", function (d) {
        var x = d.bounds[0][0];
        return Number.isFinite(x) ? x : 0;
      })
      .attr("y", function (d) {
        var y = d.bounds[0][1];
        return Number.isFinite(y) ? y : 0;
      })
      .attr("width", function (d) {
        var w = d.bounds[1][0] - d.bounds[0][0];
        return Number.isFinite(w) ? w : 0;
      })
      .attr("height", function (d) {
        var h = d.bounds[1][1] - d.bounds[0][1];
        return Number.isFinite(h) ? h : 0;
      })
      .attr("preserveAspectRatio", "none")
      .attr("clip-path", function(d) {
        return "url(#iso-" + d.id + ")";
      })
    ;

    // one rect for each country, masked by a clip mask
    var $rect = group.append('rect')
      .attr("class", function(d) {
        if (window.available_map_countries.indexOf(d.name) > -1) {
          return "country-wrapper country-highlighted";
        } else {
          return "country-wrapper";
        }
      })
      .attr("x", function (d) {
        var x = d.bounds[0][0];
        return Number.isFinite(x) ? x : 0;
      })
      .attr("y", function (d) {
        var y = d.bounds[0][1];
        return Number.isFinite(y) ? y : 0;
      })
      .attr("width", function (d) {
        var w = d.bounds[1][0] - d.bounds[0][0];
        return Number.isFinite(w) ? w : 0;
      })
      .attr("height", function (d) {
        var h = d.bounds[1][1] - d.bounds[0][1];
        return Number.isFinite(h) ? h : 0;
      })
      // .attr('transform', 'translate(-2, -2)')
      .attr("preserveAspectRatio", "none")
      .attr("clip-path", function(d) {
        return "url(#iso-" + d.id + ")";
      })
      .attr("opacity",function(d){
        if (window.isGlobalMap === true) {
          if (window.available_map_countries.indexOf(d.name) > -1) {
            return "0.98";
          }
        }
      })
    ;

    // better stroke for the countries
    group
      .append("path")
      .attr('class', 'country-stroke')
      .attr('d', path)
    ;

    if (window.isGlobalMap) {
      $rect.on('click', function(d){
        // console.log('you clicked', d.name, d);
        if (window.available_map_countries.indexOf(d.name) > -1) {
          var link = d.name.toLowerCase();
          // "/countries/eu_country_profiles/"+link+"";
          location.href = link;
          return true;
        }
      })
        .on('mouseover', function(d){
          if (window.available_map_countries.indexOf(d.name) > -1) {
            d3.select(this)
              .attr('opacity','0')
            // .attr('transform', 'translate(2,2)')
            ;
          }
        })
        .on('mouseout', function(d){
          if (window.available_map_countries.indexOf(d.name) > -1) {
            d3.select(this)
              .attr('opacity','0.98')
            // .attr('transform', 'translate(-2,-2)')
            ;
          }
        });
    }
  }
});
