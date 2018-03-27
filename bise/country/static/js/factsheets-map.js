var nonEuMembers;
var mapletsCountries;

Number.isFinite = Number.isFinite || function(value) {
  return typeof value === 'number' && isFinite(value);
};

function makeid() {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}
var countryGroups;

function filterCountriesById(countries, filterIds) {
  var features = {
    type: 'FeatureCollection',
    features: []
  };
  countries.forEach(function(c) {
    if (filterIds.indexOf(c.name) === -1) {
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

  var center = findCenter(viewport);

  var dirx = start[0] > center[0] ? -1 : 1;
  var diry = start[1] > center[1] ? -1 : 1;

  return function(point) {
    var res = [
      point[0] + delta[0] * dirx,
      point[1] + delta[1] * diry
    ];
    return res;
  };
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
      mutPoint[1] = startPoint[1];
      break;
    case 'bottom':
      mutPoint[1] = startPoint[1] - bhs;
      break;
    case 'left':
      mutPoint[0] = startPoint[0];
      break;
    case 'right':
      mutPoint[0] = startPoint[0] - bws;
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
  graticules, // array of graticules and css classes
              //    [[gr1, 'main-lines'], [gr2, 'secondary-lines]]
  zoomLevel   // correction factor for zoom
) {
  // Draw the countries in the specified viewport

  var focusCountriesFeature = filterCountriesById(countries, focusIds);

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
    .attr('class', 'country-maps')
    .attr('clip-path', 'url(#' + cprectid + ')')
  ;

  var b = path.bounds(focusCountriesFeature);

  // var vRatio = window.vRatio;
  var cwRatio = (b[1][0] - b[0][0]) / width;    // bounds to width ratio
  var chRatio = (b[1][1] - b[0][1]) / height;   // bounds to height ratio
  var s =  zoomLevel / Math.max(cwRatio, chRatio);
  var t = [
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

  if (graticules.length) {
    var grat = g
      .append('g')
      .attr('class', 'ggroup')
      .selectAll('path')
    ;

    graticules.forEach(function(gc) {
      grat
        .data(gc[0].lines())
        .enter()
        .append('path')
        .attr('class', gc[1])
        .attr('x', x)
        .attr('y', y)
        .attr('d', path)
      ;
    });
  }

  // tooltip with country names on hover
  var tooltip = d3.select("body")
      .append("div")
      .attr('class', 'tooltip')
      ;

  // draw all countries
  g
    .append('g')
    .selectAll('path')
    .data(countries)
    .enter()
    .append('path')
    .attr('id', function(d) {
      return 'c-' + cprectid + '-' + d.properties.id;
    })
    .style("fill", function(d) {
      if ($('.maes-map').length > 0) {
        var isMapletCountry = mapletsCountries.indexOf(d.name) > -1;
        for (var i = 0; i < countryGroups.length; i++) {
          var c = countryGroups[i]['countries'];
          var filterTitle = countryGroups[i]['title'];
          if (c.indexOf(d.name) > -1) {
            if (isMapletCountry) return countryGroups[i]['color'];
            if ($('.maplet-container').length > 0) return '#b0b0b0';
            return countryGroups[i]['color'];
          }
          if (filterTitle === 'Outside data coverage') {
            if ($('.maplet-container').length > 0) return '#b0b0b0';
          }
        }
      }
    })
    .on('mouseover', function(d) {
        if (!window.isHeaderMap) {
          if (nonEuMembers.indexOf(d.name) > -1) {
            return tooltip
            .style("visibility", "visible")
            .html(d.name);
          }
        }
    })
    .on('mousemove', function(d) {
      if (!window.isHeaderMap) {
        if (nonEuMembers.indexOf(d.name) > -1) {
          return tooltip
          .style("visibility", "visible")
          .style("top", (d3.event.pageY) + "px")
          .style("left", (d3.event.pageX + 10) + "px")
          .html(d.name);
        }
      }
    })
    .on('mouseout', function(d) {
      if (!window.isHeaderMap) {
        if (nonEuMembers.indexOf(d.name) > -1) {
          return tooltip
          .style("visibility", "hidden");
        }
      }
    })
    .attr('class', function(d) {
      return 'country-stroke';
    })
    .attr('d', path)
    .attr('x', x)
    .attr('y', y)
  ;


  d3.selectAll(".countries-checkbox").on("change", update);
  update();

  function update () {
    if ($('.general-map').length > 0) {
      d3.selectAll('.country-stroke').attr('class', function(d) {
        var euCountries = window.available_map_countries.indexOf(d.name) > -1;
        var nonEuCountries = nonEuMembers.indexOf(d.name) > -1;
        var isMapletCountry = mapletsCountries.indexOf(d.name) > -1;

        if (d3.select("#checkb_1").property("checked")) {
          // focus eu members on the map
          if (euCountries) {
            if (isMapletCountry) return 'country-stroke country-focus';
            return 'country-stroke country-focus non-focused-country';
          }
        }
        else if (d3.select("#checkb_2").property("checked")) {
          // focus non-eu members on the map
          if (nonEuCountries) {
            if (isMapletCountry) return 'country-stroke non-eu-country-focus';
            return 'country-stroke non-eu-country-focus non-focused-country';
          }
        }
        else if (d3.select("#checkb_3").property("checked")) {
          // focus all countries on the map
          if (nonEuCountries) {
            if (isMapletCountry) return 'country-stroke non-eu-country-focus';
            return 'country-stroke non-eu-country-focus non-focused-country';
          }
          if (euCountries) {
            if (isMapletCountry) return 'country-stroke country-focus';
            return 'country-stroke country-focus non-focused-country';
          }
        }
        return 'country-stroke non-focused-country';
      })
    }
  }


  // define clipping paths for all focused countries
  defs
    .selectAll('clipPath')
    .data(countries)
    .enter()
    .append('clipPath')
    .attr('id', function(d) {
      return 'cp-' + cprectid + '-' + d.properties.id;
    })
    .append('path')
    .attr('d', path)
    .attr('x', x)
    .attr('y', y)
  ;

  var imgs = svg.append('g');
  imgs
    .attr('class', 'flag-images')
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
      return 'url(#cp-' + cprectid + '-' + d.properties.id + ')';
    })
    .attr("x", function (d) {
      var pbox = d3.select('#c-' + cprectid + '-' + d.properties.id).node().getBBox();
      return pbox.x;
    })
    .attr("y", function (d) {
      var pbox = d3.select('#c-' + cprectid + '-' + d.properties.id).node().getBBox();
      return pbox.y;
    })
    .attr("width", function (d) {
      var pbox = d3.select('#c-' + cprectid + '-' + d.properties.id).node().getBBox();
      return pbox.width;
    })
    .attr("height", function (d) {
      var pbox = d3.select('#c-' + cprectid + '-' + d.properties.id).node().getBBox();
      return pbox.height;
    })
    .attr("preserveAspectRatio", "none")
    .attr('opacity', function() {
      return window.isHeaderMap ? '1' : '0';
    })
    .on('mouseover', function(d) {
      if (window.isHeaderMap) {
        $('.country-flag').css('cursor', 'unset');
        return;
      }
      if (window.available_map_countries.indexOf(d.name) == -1) {
        d3.select(this).attr('opacity', 0).style('cursor', 'default');
      } else {
        d3.select(this).attr('opacity', 1);
      }
      if (window.isGlobalMap) {
        return tooltip
        .style("visibility", "visible")
        .html(d.name);
      }
    })
    .on('mousemove', function(d) {
      if (window.isGlobalMap) {
        return tooltip
        .style("visibility", "visible")
        .style("top", (d3.event.pageY) + "px")
        .style("left", (d3.event.pageX + 10) + "px")
        .html(d.name);
      }
    })
    .on('mouseout', function(d) {
      if (window.isHeaderMap) return;
      d3.select(this).attr('opacity', 0);
      if (window.isGlobalMap) {
        return tooltip
        .style("visibility", "hidden");
      }
    })
    .on('click', function(d) {
      if (window.isHeaderMap) return;
      if (window.available_map_countries.indexOf(d.name) > -1) {
        var link = d.name.toLowerCase();
        var tabsLoc = {
          '##countries': 't-0',
          '##factsheets': 't-1',
          '##contributions': 't-2',
          '##maes': 't-3',
          '##green-infrastructure': 't-4'
        }
        for (var key in tabsLoc) {
          if (tabsLoc.hasOwnProperty(key)) {
            var wLoc = window.location.href
            if (wLoc.indexOf(key) > -1) {
              location.href = link + '##' + tabsLoc[key];
            } else {
              location.href = link;
            }
          }
        }
        return true;
      }
    })
  ;
}

function drawCountriesForMinimap(
  svg,        // d3 selector for a svg element
  x,          // coordinate in svg for x
  y,          // coordinate in svg for y
  width,      // width of desired map
  height,     // height of desired map
  countries,  // topojson with country as features
  focusIds,   // country ids where we zoom focus
  projection, // desired projection (ex: mercator projection d3 object)
  zoomLevel   // correction factor for zoom
) {

  // Specially made for the whole EU countries inset maplet
  // Draws the countries in the specified viewport

  var focusCountriesFeature = filterCountriesById(countries, focusIds);

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
    .attr('class', 'country-maps')
    .attr('clip-path', 'url(#' + cprectid + ')')
  ;

  var b = path.bounds(focusCountriesFeature);

  // var vRatio = window.vRatio;
  var cwRatio = (b[1][0] - b[0][0]) / width;    // bounds to width ratio
  var chRatio = (b[1][1] - b[0][1]) / height;   // bounds to height ratio
  var s =  zoomLevel / Math.max(cwRatio, chRatio);
  var t = [
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

  // draw all countries for EU minimap
  var rect = g
    .append('g')
    .selectAll('path')
    .data(countries)
    .enter()
    .append('path')
    .attr('id', function(d) {
      return 'c-' + cprectid + '-' + d.properties.id;
    })
    .attr('class', function(d) {
      if (focusIds.indexOf(d.name) > -1) {
        return 'minimap-country-stroke minimap-country-focus';
      }
      return 'minimap-country-stroke';
    })
    .on('mouseover', function(d) {
      $('path.minimap-country-focus').attr('class', 'country-stroke minimap-country')
    })
    .on('mouseout', function(d) {
      $('path.minimap-country').attr('class', 'country-stroke minimap-country-focus')
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
      return 'cp-' + cprectid + '-' + d.properties.id;
    })
    .append('path')
    .attr('d', path)
    .attr('x', x)
    .attr('y', y)
  ;
}


// TODO: we need to detect if we need to hide the maplets for small res
function addInsetCountryToMap(
  svg,
  viewport,
  countries,
  focusId,
  index,
  startPoint,
  side,
  projection,
  zoomLevel
) {
  //
  // Adds a "zoom" to the desired country, added to the left side of the map
  // Inset Maps are bits of the map highlighted. See
  // http://gisgeography.com/map-elements-how-to-guide-map-making/
  //
  //      box width
  //  |  |-----|
  //  |  |     | box height
  //  |  |     |
  //  |  |-----|
  //  | spacer
  //  ---------------

  var boxw = 60;
  var boxh = 60;
  var spacer = 10;
  var boxtitle = 0;   // 10

  if (!index) {
    index = 0;
  }

  var msp = getMapletStartingPoint(
    viewport,
    startPoint,
    index,
    side,
    spacer,
    [boxw, boxh],
    boxtitle
  );

  drawCountries(
    svg,
    msp.x,
    msp.y,
    boxw,
    boxh,
    countries,
    [focusId],
    projection,
    [],
    zoomLevel
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

  var countryName = countries.filter(function(d) {
    return d.name === focusId;
  })[0].name;

  var label = svg.append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('class', 'country-focus-label')
    .attr('text-anchor', 'middle')
    .text(countryName)
  ;

  var lbbox = label.node().getBBox();
  var textboxh = lbbox.height + lbbox.height / 4;

  label
    .attr('x', msp.x + boxw/2)
    .attr('y', msp.y + boxh - textboxh/2 + 5)   //  - textboxh / 3
  ;

  label.raise();
}

function renderEUMinimap(
  svg,
  viewport,
  countries,
  focusId,
  startPoint,
  side,
  projection,
  zoomLevel,
  boxw,
  boxh
) {

  var spacer = 0;
  var boxtitle = 10;

  var msp = getMapletStartingPoint(
    viewport,
    startPoint,
    side,
    spacer,
    [boxw, boxh],
    boxtitle
  );

  drawCountriesForMinimap(
    svg,
    msp.x,
    msp.y,
    boxw,
    boxh,
    countries,
    focusId,
    projection,
    zoomLevel
  );

  svg
    .append('rect')
    .attr('class', 'maplet-outline minimap')
    .attr('x', msp.x)
    .attr('y', msp.y)
    .attr('width', boxw)
    .attr('height', boxh)
    .append('text')
  ;

  var label = svg.append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('class', 'eu-focus-label')
    .attr('text-anchor', 'middle')
    .text('EU')
  ;

  var lbbox = label.node().getBBox();

  label
    .attr('x', msp.x + 18)
    .attr('y', msp.y + 40)
  ;

  var img = svg.append('g');
  img
    .append('image')
    .attr('class', 'eu-flag')
    .attr('x', msp.x + 5)
    .attr('y', msp.y + 5)
    .attr('width', 30)
    .attr('height', 20)
    .attr('href', 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg')
  ;

  label.raise();
}

function fLoc(fname) {
  return window.location.origin + "/++resource++bise.country/js/countries/" + fname;
}

function setCountryNames(countries) {
  countries.forEach(function(d) {
    d.name = d.properties.SHRT_ENGL;
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

function init(settings) {
  countryGroups = settings['filteredCountries'];
  nonEuMembers = settings.nonEuMembers;
  var getCountries = [];

  var $load = $('<div class="map-loader"><div class="loading-spinner"/></div>');

  var $sw = $('#countryfactsheets-map');
  $sw.append($load);

  // temp disabled
  // d3.select("body").select("#countryfactsheets-map svg").selectAll("*").remove();
  $("#countries-filter").detach();

  var $sw = $('#countryfactsheets-map');
  var $dw = $('<div id="countries-filter">' +
    '<span>Report on MAES-related <span class="break-p">developments</span></span>' +
    '<ul class="filter-listing"></ul></div>');
  $sw.append($dw);

  for (var i = 0; i < countryGroups.length; i++) {
    var $dbox = $('<li><div class="color-box"/><span class="type-title"/></li>');
    $('.filter-listing').append($dbox);
    var eqColor = $('#countries-filter ul li div').eq(i);
    var eqTitle = $('.type-title').eq(i);
    eqColor.css('background-color', countryGroups[i]['color']);
    eqTitle.text(countryGroups[i]['title']);
    getCountries.push(countryGroups[i]['countries']);
  }

  if ($('.maes-map').length > 0) {
    $('#countries-filter').show();
  } else {
    $('#countries-filter').hide();
  }

  var showMapFilter = $("#countryfactsheets-map").data('show-map-filter');

  if (showMapFilter === false) {
    $('.eu-map-filter').hide();
  } else {
    $('.eu-map-filter').show();
  }

  // select only one checkbox at a time
  $(".countries-checkbox").change(function() {
    $('.countries-checkbox').not(this).prop('checked', false);
  });

  var allCountries = [].concat.apply([],getCountries);

  var filteredCountries = allCountries;
  mapletsCountries = settings['maplets'];
  nonEuMembers = settings['nonEuMembers'];

  $('body').addClass('factsheets');

  window.isHeaderMap = $(".country-header").hasClass('country-header');
  window.isHeaderGlobalMap = $("#countryfactsheets-map").hasClass('svg-header-wrapper');
  window.isGlobalMap = $(".svg-map-container").data('globalmap') === 'global';

  // get ratio from data attribute
  var zoomLevel = parseFloat($(".svg-map-container").data('ratio'));

  var width = window.isGlobalMap ? $('.svg-map-container svg').width() : $(window).width();

  if (window.isHeaderGlobalMap) {
    var width = $(window).width();

    $('.eu-map-filter, #countries-filter').css({
      'top': '100px',
    }).css('right', function () { return getPageContentRight() +  'px' });
    $('.intro-wrapper').css('left', function () { return getPageContentRight() +  'px' });
  }

  var height = $('.svg-map-container svg').height();

  if ($('.header-bg').length > 0) {
    var $svgh = $('.header-bg');
    var $svgw = $svgh.detach();
    var $body = $('#site-body');
    $body.prepend($svgw);
  }

  var wflags = fLoc("countries.tsv");
  var w110 = fLoc("eu-countries.geojson");
  d3
    .queue()
    .defer(d3.json, w110)
    .defer(d3.tsv, wflags)
    .await(ready);

  function ready(error, world, flags) {   // names,

    if (error) {
      alert('error: ' + error);
      return;
    }

    $('.map-loader').hide();
    $('.intro-wrapper').css('display', 'block');

    if ($('.general-map').length > 0) {
      $('.eu-map-filter').css('display', 'block');
    }

    // read geometry of countries. See https://github.com/topojson/world-atlas
    // countries.geo.json comes from https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json

    // this refreshes the whole map. Used for changing the tabs
    d3.select("body").select("#countryfactsheets-map svg").selectAll("*").remove();

    var countries = world.features;

    // Augument the countries GeoJSON data with names, bounds and flags
    setCountryNames(countries);
    setCountryFlags(countries, flags);

    var svg = d3
      .select("body")
      .select(".svg-map-container svg")
      .attr("width", width)
    ;

    var gStep = window.isGlobalMap ? [10, 10] : [4, 4];
    var graticule = d3.geoGraticule().step(gStep);
    var minorGraticule = d3.geoGraticule().step([gStep[0]/4, gStep[1]/4]);

    var countries_Id = countries.map(function(d) {
      if (filteredCountries.indexOf(d.name) > -1) {
        return d.name;
      }
    }).filter(function(c) {
      return c;
    });

    window.available_map_countries = countries_Id;

    var globalMapProjection = d3.geoRobinson();   // azimuthalEquidistant conicEquidistant()

    function drawMap(width) {

      globalMapProjection
        .scale(1)
        .translate([0, 0]);

      drawCountries(
        svg,
        0,
        0,
        width,
        height,
        countries,
        countries_Id,
        globalMapProjection,
        [
          [graticule, 'main-lines'],
          [minorGraticule, 'sub-lines']
        ],
        zoomLevel
      );

      var available_map_country_ids = countries.map(function(d) {
        if (filteredCountries.indexOf(d.name) > -1) {
          return d.name;
        }
      }).filter(function(c) {
        return c;
      });

      // add the maplet insets and other customization (EU maplet for MAES)
      customizeMap(
        svg,
        settings,
        available_map_country_ids,
        width,
        height,
        countries,
        countries_Id
      )
    }

    drawMap(width);

    $(window).resize(function() {
      width = window.isGlobalMap
        ? $('.svg-map-container svg').width()
        : $(window).width()
      ;
      svg.selectAll("*").remove();
      drawMap(width);
      if (window.isGlobalMap) {
        $('.eu-map-filter, #countries-filter').css('right',
          function() { return getPageContentRight() +  'px' }
        );
        $('.intro-wrapper').css('left',
          function() { return getPageContentRight() +  'px' }
        );
      }
    })
  }
}

$(document).ready(function() {
  var settingsURL = $(".svg-map-container").data('settings');
  if (settingsURL) d3.json(settingsURL, init);

  // set cookie for map helper
  function mapHelper() {
    days = 30;
    myDate = new Date();
    myDate.setTime(myDate.getTime()+(days*24*60*60*1000));
    document.cookie = 'MapHelper=Accepted; expires=' + myDate.toGMTString();
  }

  var cookie = document.cookie.split(';')
  .map(function(x) { return x.trim().split('='); })
  .filter(function(x) { return x[0]==='MapHelper'; })
  .pop();

  if (cookie && cookie[1] === 'Accepted') {
    $(".map-helper").hide();
  }

  $('.map-helper a').click(function() {
    mapHelper();
    $(".map-helper").hide();
    return false;
  });
});

function getPageContentRight() {
  var pc = $(".page-content").width();
  var wh = $(window).width();
  var right = (wh - pc) / 2;
  return right;
}

function getPageContentLeft() {
  var pc = $(".page-content").width();
  var wh = $(window).width();
  var left = (wh + pc) / 2;
  return left;
}

function customizeMap(
  svg,
  settings,
  available_map_country_ids,
  width,
  height,
  countries,
  countries_Id
) {

  var mapletsCountries = settings['maplets'];

  if (window.isGlobalMap) {
    var focusCountries = mapletsCountries.split(',');

    var mp = d3.geoPatterson();
    mp
      .scale(1)
      .translate([0, 0]);

    var mside = 'left';
    var mstart = [10, 10];
    var mw = 120;  // maplet width and height
    var mh = 120;

    var detectMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // eu minimap position in header map
    if (window.isHeaderGlobalMap) {
      var mside = 'top';
      mw = 124;
      mh = 124;
      var mstart = [$(window).width() - getPageContentRight() - mw, 320];

      if (detectMobile || ($(window).width() < 800) ) {
        var mstart = [$(window).width() - getPageContentRight() - mw - 20, 180];
      }
    }

    if ($('.maes-map').length > 0) {
      var mc = svg
       .append('g')
       .attr('class', 'minimap-container')
       ;

      renderEUMinimap(
        mc,
        [width, height],
        countries,
        countries_Id,
        mstart,
        mside,
        mp,
        0.8,
        mw,
        mh
      );
    }

    // add the zoomed countries (cyprus, malta, etc) as maplets
    focusCountries.forEach(function(id, index) {
      var start;
      var isMaesMap = $('.maes-map').length > 0;

      if (isMaesMap) {
        orientation = 'bottom';
        start = [10, height];
      }
      else {
        orientation = 'left';
        start = [10, 10];
      }

      if (detectMobile || ($(window).width() < 800)) {
        orientation =  'bottom';
        start = [10, height];
      }

      if (window.isHeaderGlobalMap) {
        orientation =  'bottom';
        start = [$(window).width() - getPageContentLeft(), 470];

        if (detectMobile || ($(window).width() < 800)) {
         orientation =  'left';
         start = [$(window).width() - getPageContentLeft() + 20, 170];
        }
      }

      var p = d3.geoMercator();
      p
        .scale(1)
        .translate([0, 0]);

      var gm = svg
       .append('g')
       .attr('class', 'maplet-container')
       ;

        addInsetCountryToMap(
          gm,
          [width, height],
          countries,
          id,
          index,
          start,
          orientation,
          p,

          0.6
        );
    });
  }
}
