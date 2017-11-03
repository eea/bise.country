Number.isFinite = Number.isFinite || function(value) {
  return typeof value === 'number' && isFinite(value);
}

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function filterCountriesById(countries, filterIds){
    var features = {
      type: "FeatureCollection",
      features: []
    }
    countries.forEach(function(c) {
      if (filterIds.indexOf(c.id) === -1) {
        return;
      }
      features.features.push(c);
    });
  return features;
}


function travelToOppositeMutator(start, viewport, delta) {
  // point: the point we want to mutate
  // start: starting point (the initial anchor point)
  // viewport: array of width, height
  // delta: array of dimensions to travel

  center = findCenter(viewport);

  var dirx = start[0] > center[0] ? -1 : 1;
  var diry = start[1] > center[1] ? -1 : 1;

  return function(point) {
    var res = [
      point[0] + delta[0] * dirx,
      point[1] + delta[1] * diry
    ];
    return res;
  }
}


function findCenter(viewport) {
  return [viewport[0] / 2, viewport[1] / 2];
}


function getMapletStartingPoint(
  viewport,   // an array of two integers, width and height
  startPoint, // an array of two numbers, x, y for position in viewport
  index,      // integer, position in layout
  side,       // one of ['top', 'bottom', 'left', right']
  spacer,     // integer with amount of space to leave between Maplets
  boxDim,      // array of two numbers, box width and box height
  titleHeight // height of title box
) {

  // return value is array of x,y
  // x: horizontal coordinate
  // y: vertical coordinate

  var bws = boxDim[0] + spacer;   // box width including space to the right
  var bhs = boxDim[1] + spacer + titleHeight;

  var mutator = travelToOppositeMutator(startPoint, viewport, [bws, bhs]);

  var mutPoint = [startPoint[0], startPoint[1]];

  for (var i = 0; i < index; i++) {
    mutPoint = mutator(mutPoint, index);
  }

  // TODO: this could be improved, there are many edge cases
  switch (side) {
    case 'top':
      mutPoint[0] = mutPoint[0];
      mutPoint[1] = startPoint[1];
      break;
    case 'bottom':
      mutPoint[1] = startPoint[1] - bhs;
      break;
    case 'left':
      mutPoint[0] = startPoint[0];
      mutPoint[1] = mutPoint[1];
      break;
    case 'right':
      mutPoint[0] = startPoint[0] - bws;
      mutPoint[1] = mutPoint[1];
      break;
  }

  return {
    x: mutPoint[0],
    y: mutPoint[1]
  };
}


function drawCountries(
  svg,        // d3 selector for a svg element
  x,          // coordinate in svg for x
  y,          // coordinate in svg for y
  width,      // width of desired map
  height,     // height of desired map
  countries,  // topojson with country as features
  focusIds,   // country ids where we zoom focus
  projection, // desired projection (ex: mercator projection d3 object)
  graticules  // array of graticules and css classes
              //    [[gr1, 'main-lines'], [gr2, 'secondary-lines]]
) {
  // Draw the countries in the specified viewport

  var focusCountriesFeature = filterCountriesById(countries, focusIds);
  console.log('focus', focusCountriesFeature);

  var path = d3.geoPath().projection(projection);   // the path transformer

  var cprectid = makeid();
  var defs = svg.append('defs');

  defs
    .append('clipPath')
    .attr('id', cprectid)
    .append('rect')
    .attr('x', x)
    .attr('y', y)
    .attr('height', height)
    .attr('width', width)
  ;

  var g = svg
    .append('g')
    .attr('clip-path', 'url(#' + cprectid + ')')
  ;

  var b = path.bounds(focusCountriesFeature);
  vRatio = 0.5; // hardcode a ratio because it can vary widely from phone to desktop
  var cwRatio = (b[1][0] - b[0][0]) / width;    // bounds to width ratio
  var chRatio = (b[1][1] - b[0][1]) / height;   // bounds to height ratio
  var s =  vRatio / Math.max(cwRatio, chRatio);
  t = [
    (width - s * (b[1][0] + b[0][0])) / 2 + x,
    (height - s * (b[0][1] + b[1][1])) / 2 + y
  ];
  projection.scale(s).translate(t);

  g     // the world sphere, acts as ocean
    .append("path")
    .datum(
      {
        type: "Sphere"
      }
    )
    .attr("class", "sphere")
    .attr("d", path)
  ;

  graticules = graticules || [];
  console.log('grats', graticules);

  if (graticules.length) {
    var grat = g.append('g');
    grat.selectAll('path')
      .data([graticules[0][0].lines()])
      .enter()
      .append("path")
      .attr('d', path)
      .attr('class', 'graticules')
    ;
    grat.exit().remove();
  }



  // var grats = g.append('g');
  //
  // graticules = graticules || [];
  // graticules.forEach(function(gc) {
  //   var gf = {
  //     type: "FeatureCollection",
  //     features: gc[0].lines()
  //   }
  //   console.log('drawing lines', gc);
  //   grats
  //     .attr('class', 'graticules')
  //     .selectAll('path')
  //     .data(gc[0].lines())
  //     .enter()
  //     .append('path')
  //     .attr('class', gc[1])
  //     .attr('x', x)
  //     .attr('y', y)
  //     .attr('d', path)
  //   ;
  // });

  g     // draw all countries
    .selectAll('path')
    .data(countries)
    .enter()
    .append('path')
    .attr('id', function(d) {
      return 'c-' + cprectid + '-' + d.id;
    })
    .attr('class', function(d) {
      if (focusIds.indexOf(d.id) > -1) {
        return 'country-stroke country-focus';
      }
      return 'country-stroke';
    })
    .attr('d', path)
    .attr('x', x)
    .attr('y', y)
  ;

  // define clipping paths for all focused countries
  defs
    .selectAll('clipPath')
    .data(countries)
    .enter()
    .append('clipPath')
    .attr('id', function(d) {
      return 'cp-' + cprectid + '-' + d.id;
    })
    .append('path')
    .attr('d', path)
    .attr('x', x)
    .attr('y', y)
  ;

  var cb = path.bounds(focusCountriesFeature);

  var imgs = svg.append('g');
  imgs
    .selectAll('image')
    .attr('class', 'country-flags')
    .data(focusCountriesFeature.features)
    .enter()
    .append('image')
    .attr('href', function(d) {
      return d.url;
    })
    .attr('class', 'country-flag')
    .attr('clip-path', function(d) {
      return 'url(#cp-' + cprectid + '-' + d.id + ')';
    })
    .attr("x", function (d) {
      var pbox = d3.select('#c-' + cprectid + '-' + d.id).node().getBBox();
      return pbox.x;
    })
    .attr("y", function (d) {
      var pbox = d3.select('#c-' + cprectid + '-' + d.id).node().getBBox();
      return pbox.y;
    })
    .attr("width", function (d) {
      var pbox = d3.select('#c-' + cprectid + '-' + d.id).node().getBBox();
      return pbox.width;
    })
    .attr("height", function (d) {
      var pbox = d3.select('#c-' + cprectid + '-' + d.id).node().getBBox();
      return pbox.height;
    })
    .attr("preserveAspectRatio", "none")
    .attr('opacity', '0')

    .on('mouseover', function(d){
      d3.select(this).attr('opacity', 1);
    })
    .on('mouseout', function(d){
      d3.select(this).attr('opacity', 0);
    })
    .on('click', function(d){
      // handleClick(d);
      if (window.available_map_countries.indexOf(d.name) > -1) {
        var link = d.name.toLowerCase();
        // "/countries/eu_country_profiles/"+link+"";
        location.href = link;
        return true;
      }
    })
  ;
}


// TODO: we need to detect if we need to hide the maplets for small res
function addComposedCountryToMap(
  svg,
  viewport,
  countries,
  focusId,
  index,
  startPoint,
  side,
  projection
) {
  // Adds a zoom to the desired country, added to the left side of the map
  //
  // cf = correction factor, based on index in left side rendering
  //
  //      box width
  //  |  |-----|
  //  |  |     | box height
  //  |  |     |
  //  |  |-----|
  //  | spacer
  //  ---------------

  var boxw = 70;
  var boxh = 70;
  var spacer = 20;

  if (!index) {
    index = 0;
  }

  if (!index) {
    index = 0;
  }

  var msp = getMapletStartingPoint(
    viewport,
    startPoint,
    index,
    side,
    20,
    [60, 60],
    10
  );

  drawCountries(
    svg,
    msp.x,
    msp.y,
    boxw,
    boxh,
    countries,
    [focusId],
    projection
  );

  svg
    .append('rect')
    .attr('class', 'maplet-outline')
    .attr('x', msp.x)
    .attr('y', msp.y)
    .attr('width', boxw)
    .attr('height', boxh)
    .append('text')
    .html(index)
  ;

  var label = svg.append('text')
    .attr('x', 0)
    .attr('y', 0)
    // .attr('width', boxw)
    // .append('tspan')
    .attr('class', 'country-focus-label')
    .attr('text-anchor', 'middle')
    .text(focusId)
  ;

  var lbbox = label.node().getBBox();
  // bottomy - boxh - lbbox.height - spacer - (lbbox.y / 1.2)
  // boxw / 2 - lbbox.width / 2 + spacer

  var textboxh = lbbox.height + lbbox.height / 4;

  label
    .attr('x', msp.x + boxw/2)
    .attr('y', msp.y - textboxh / 3)
  ;


  svg
    .append('rect')
    .attr('class', 'country-focus-text-bg')
    .attr('x', msp.x)
    .attr('y', msp.y - textboxh)
    .attr('width', boxw)
    .attr('height', textboxh)
  ;

  label.raise();

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


$(document).ready(function() {
  $('body').addClass('factsheets');

  window.isGlobalMap = $("svg-container").data('globalmap') === 'global';

  var width = isGlobalMap ? $('svg').width() : $(window).width();
  var height = 560;

  if ($('.svg-wrapper').length > 0) {
    var $svgh = $('<div class="header-bg"/>');
    var $svg = $('.svg-wrapper');
    $svgh.append($svg);
    var $svgw = $svgh.detach();
    var $body = $('#site-body');
    $body.prepend($svgw);
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
    var projection = d3.geoRobinson();   // azimuthalEquidistant conicEquidistant()
    projection
          .scale(1)
          .translate([0, 0]);

    // var path = d3.geoPath().projection(projection);

    // Augument the countries GeoJSON data with names, bounds and flags
    setCountryNames(countries);
    setCountryFlags(countries, flags);

    var svg = d3
      .select("body")
      .select("svg")
      .attr("width", width)
      .attr("height", height);

    var gStep = window.isGlobalMap ? [10, 10] : [4, 4];
    var graticule = d3.geoGraticule().step(gStep);
    var minorGraticule = d3.geoGraticule().step([gStep[0]/4, gStep[1]/4]);

    drawCountries(
      svg,
      0,
      0,
      width,
      height,
      countries,
      ['CYP', 'ROU'],
      projection,
      [[graticule, 'main-lines'], [minorGraticule, 'sub-lines']]
    );

    var available_map_country_ids = countries.map(function(d) {
      if (window.available_map_countries.indexOf(d.name) > -1) {
        return d.id;
      }
    });
    console.log('Countries', available_map_country_ids);

    console.log('width', width);
    console.log('height', height);
    if (window.isGlobalMap) {

      //'MLT', 'CYP''LUX'
      ['MLT', 'CYP', 'LUX'].forEach(function(id, index) {
        // TODO: check if it's in window.available_map_countries;
        // TODO: change available_map_countries to be a data attribute passable
        // from template

        var p = d3.geoMercator();
        p
          .scale(1)
          .translate([0, 0]);

        if (available_map_country_ids.indexOf(id) > -1) {
          addComposedCountryToMap(
            svg,
            [width, height],
            countries,
            id,
            index,
            [10, 26],
            'left',
            p
          );
        }
      })
    }

  }
});
