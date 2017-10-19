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
  // get the "desired country" from the window location

  var sc;
  var frags = window.location.pathname.split("/").reverse();
  for (var f=0; f<frags.length; f++) {
    if (frags[f].length) {
      sc = frags[f];
      break;
    }
  }

  if(sc) {
    if (sc.indexOf("#") >= 0) {
      sc = sc.substring(0, sc.indexOf('#'))
    }
    sc = sc.replace('-', ' ');
    sc = sc.split('.')[0];    // for testing

    // Uppercase first letters of words
    sc = sc.split(" ").map(function(w) {
      return w[0].toUpperCase() + w.slice(1);
    }).join(" ");
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
    vRatio = 0.5; // hardcode a ratio because it can vary widely from phone to desktop
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
  var w110 = fLoc("countries.geo.json");

  var q = queue()
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
    var projection = d3.geo
      .robinson()   // azimuthalEquidistant conicEquidistant()
      .precision(0.1)
      .clipAngle(90);

    var path = d3.geo.path().projection(projection);

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

    // Calculate the center meridian for the sphere. It serves to calculate
    // clipping of coordinate labels
    var bbox = svg.node().getBBox();
    var p = [bbox.x + bbox.width/2, bbox.y + bbox.height/2];
    var cp = projection.invert(p);   // lon, lat

    // TODO: can this be optimized, do the replacement before setting the attr?
    // console.log("The D: ", d3.select('#sphere').attr('d'));
    // TODO: is replace() still needed?
    var new_path = d3.select('#sphere').attr('d').replace(/,/g, ' ');

    var gStep = window.isGlobalMap ? [10, 10] : [4, 4];
    var graticule = d3.geo.graticule().step(gStep);

    // draw the graticule lines
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

    var minorGraticule = d3.geo.graticule().step([gStep[0]/4, gStep[1]/4]);
    svg.selectAll('path.sublines')
      .data(minorGraticule.lines())    // .lines())
      .enter()
      .append("path")
      .attr("class", "sublines")
      .attr("d", path)
    ;

    // functions as a mask for the country flags
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
    //
    // add the coordinates on the side of the map
    var latitudes = [];
    for (var i=-180; i < 180; i+=10) {
      for (var j=-180; j < 180; j+=10) {
        latitudes.push({type: 'Point', coordinates:[i, j]});
      }
    }

    var centerPos = projection.invert([width/2,height/2]);
    var arc = d3.geo.greatArc();

    // show text coordinates
    // svg.selectAll('text')
    //   .data(latitudes)
    //   .enter()
    //   .append("text")
    //   .text(function(d) {
    //     var c = d.coordinates[1] + "°"
    //     return c;
    //   })
    //   // .style("display",function(d) {
    //   //   var dist = arc.distance({
    //   //     source: d.coordinates,
    //   //     target: centerPos
    //   //   });
    //   //   var res = dist;
    //   //   console.log(d.coordinates, dist);
    //   //   return (dist < 0.5) ? 'inline' : 'none';
    //   // })
    //
    //   .attr('display', function(d) {
    //     // var rev = projection(d.coordinates);
    //     var b = path.bounds(d);
    //     console.log(b, d.coordinates);
    //     function ip(c) {
    //       return Number.isFinite(c) && c >= 0;
    //     }
    //     if (!(b[0].every(ip) && b[1].every(ip))) return 'none';
    //
    //     var lon = d.coordinates[0]
    //     if ((cp[0] - lon) >= 90) return 'none';
    //     if ((cp[0] - lon) <= -90) return 'none';
    //
    //     return  'inline';
    //   })
    //
    //   .attr("class","label")
    //   .attr('text-anchor', 'start')
    //   .attr("dx", function(d) {
    //     return projection(d.coordinates)[0] + 24;
    //   })
    //   .attr("dy", function(d) {
    //     // return projection([0, d.coordinates[0]])[1] - 6;
    //     return projection(d.coordinates)[1] - 6;
    //   });
    //
    // create an svg group for each country
    var group = svg
      .selectAll("country")
      .data(countries)
      .enter()
      .append('g');

    // better stroke for the countries
    group.append("path").attr('class', 'country-stroke').attr('d', path);

    // This inserts the flags as images in the svg
    svg.selectAll("country")
      .data(countries)
      .enter()
      .insert("image", ".graticule")
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
      }
      )
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
      });

    // one rect for each country, masked by a clip mask
    var $rect = group.append('rect')
      .attr("class", "country-wrapper")
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
      .attr("opacity",function(d){
        if (window.isGlobalMap === true) {
          if (window.available_map_countries.indexOf(d.name) > -1) {
            return "0.98";
          }
        }
      })
      .attr("fill",function(d){
        if (window.isGlobalMap === true) {
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
