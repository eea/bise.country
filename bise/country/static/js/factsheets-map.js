$(document).ready(function() {

  // console.log("Context countries", window.available_map_countries);
  $('body').addClass('factsheets');

  if ($('svg-container').length === 0) {
    $('#site-body').prepend('<div class="header-bg"><svg-container><svg viewBox="0 0 1200 300"></svg> </svg-container> </div>');
  }

  var pos = ['scale', 'translateX', 'translateY'];
  pos = [4,-46,-43];

  // read possible values from data-* attributes set on <svg-container>
  var pScale = $("svg-container").data('posscale');
  if (pScale) {
    pos[0] = parseInt(pScale);
  }
  var pX = $("svg-container").data('posx');
  if (pX) {
    pos[1] = parseInt(pX);
  }
  var pY = $("svg-container").data('posy');
  if (pY) {
    pos[2] = parseInt(pY);
  }
  // console.log("used pos", pos);

  var isGlobalMap = $("svg-container").data('globalmap') === 'global';

  var wflags = window.location.origin + "/++resource++bise.country/js/countries/countries.tsv",
    w110 = window.location.origin + "/++resource++bise.country/js/countries/world-110m.json",
    wnames = window.location.origin + "/++resource++bise.country/js/countries/world-country-names.tsv";

  var width = 1200;
  var height = 700;

  var projection = d3.geo.robinson()
    .scale(160)
    .translate([width / 2, height / 2.3])
    .precision(.1);

  var path = d3.geo.path().projection(projection);

  var graticule = d3.geo.graticule();

  var svg = d3.select("body").select("svg")
    .attr("width", width)
    .attr("height", height);

  var defs = svg.append("defs");

  defs.append("path")
    .datum({type: "Sphere"})
    .attr("id", "sphere")
    // .attr('fill',' rgb(255, 140, 168)') // change global color here
    .attr("d", path)

  var new_path = d3.select('#sphere').attr('d').replace(/,/g, ' ')

  d3.select('#sphere').attr('d', new_path)

  svg.append("use")
    .attr("class", "stroke")
    .attr("xlink:href", "#sphere");

  svg.append("use")
    .attr("class", "fill")
    .attr("xlink:href", "#sphere");

  svg.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", new_path);

  var q = queue()
    .defer(d3.json, w110)
    .defer(d3.tsv, wnames)
    .defer(d3.tsv, wflags)
    .await(ready);

  function ready(error, world, names, flags) {

    var href = window.location.href;

    var frags = href.split("/").reverse();
    var selected_country;

    for (var f=0; f<frags.length; f++) {
      if (frags[f].length) {
        selected_country = frags[f];
        break;
      }
    }

    if(selected_country) {
      selected_country =  selected_country[0].toUpperCase() + selected_country.slice(1);
      if (selected_country.includes('#')) {
        selected_country = selected_country.substring(0, selected_country.indexOf('#'))
      }
      selected_country = selected_country.replace('-', ' ');
      //for testing
      selected_country = selected_country.split('.')[0]
    }

    if (selected_country == 'Czech republic') selected_country = 'Czech Republic';
    if (selected_country == 'United kingdom') selected_country = 'United Kingdom';

    //ugly ifs
    // if (selected_country == 'United Kingdom')
    //     pos[0]=5;pos[2]=-12
    // if(selected_country == '')

    switch(selected_country) {
      case 'United Kingdom':
        pos[0]=5;pos[2]=-5
        break;
      case 'Estonia':
      case 'Lithuania':
      case 'Latvia':
      case 'Sweden':
        pos[0]=5;pos[2]=25
        break;
      case 'Spain':
        pos[0]=5;pos[1]=-45;pos[2]=-62
        break;
      default:
    }

    if (error) {
      alert('error: ' + error);
      return;
    }

    flags.forEach(function (d) { d.id = +d.id;});
    flags.sort(function(a,b) {
      return +a.id < +b.id ? -1 : +a.id > +b.id ? +1 : 0;
    });

    var countries = topojson.feature(world, world.objects.countries).features,
      land = topojson.feature(world, world.objects.land);

    countries = countries.filter(function(d) {
      return names.some(function(n) {
        if (d.id == n.id) {
          return d.name = n.name;
        }
      });
    });

    countries = countries.filter(function(d) {
      return flags.some(function(n) {
        if (d.id == n.id) {
          var bounds = path.bounds(d);
          if (bounds[0][0] < 0) bounds[0][0] = 0;
          if (bounds[1][0] > width) bounds[1][0] = width;
          if (bounds[0][1] < 0) bounds[0][1] = 0;
          if (bounds[1][1] < 0) bounds[1][1] = height;

          d.bounds = bounds;

          return d.url = n.url;
        }
      });
    });
    // console.log('countries', countries);

    // countries = countries.filter(function(d) {
    //   if (available_map_countries.indexOf(d.name) > -1) {
    //     console.log('This is good', d.name);
    //     return true;
    //   } else {
    //     console.log('this is not good', d.name);
    //   }
    // });

    // for (var f of countries){
    //     $('body').append(f.url+" ")
    // }

    // /* usage: */
    // // stringified SVG
    // for (var f of countries) {
    // var svgPathString = "<svg style=\"position:absolute; width: 0; height: 0\"><symbol viewBox=\"0 0 100 \" id=\""+f.id+"\">  <use xlink:href="+f.url+"></image> </symbol></svg>"
    // // create sprite
    // var mysvg = createSVGSprite(svgPathString)
    // // insert sprite into the DOM
    // document.body.appendChild(mysvg)
    // }


    defs.selectAll("mask")
      .data(countries)
      .enter()
      .append("clipPath")
      .attr("class", "mask")
      .attr("id", function(d) {
        return "iso-" + d.id
      })
      .attr("width", function (d) {
        return d.bounds[1][0] - d.bounds[0][0];}
      )
      .attr("height", function (d) {
        return d.bounds[1][1] - d.bounds[0][1];
      })
      .append("path")
      .attr("d", path);

    var group = svg.selectAll("country")
      .data(countries)
      .enter()
      .append('g');

    svg.selectAll("country")
      .data(countries)
      .enter()
      .insert("image", ".graticule")
      .attr("class", "country")
      .attr("xlink:href", function (d){
        var myurl = d.url.split("/");
        var finalurl = myurl[myurl.length - 1];
        //return 'http://bise-portal.edw.ro/flags/'+finalurl+''
        return d.url
        ;})
      .attr("x", function (d) {
        if(d.name=='France')
          return '586'
        else
          return d.bounds[0][0];}
      )
      .attr("y", function (d) {return d.bounds[0][1];})
      .attr("width", function (d) {
        if(d.name=='France')
          return '39'
        else
          return d.bounds[1][0] - d.bounds[0][0];}
      )
      .attr("height", function (d) {
        if(d.name=='France')
          return '37'
        else
          return d.bounds[1][1] - d.bounds[0][1];}
      )
      .attr("preserveAspectRatio", "none")
      .attr("clip-path", function(d) {
        return "url(#iso-"+d.id+")";
      });
    //
    // .attr('width',function(d){
    //   if(d.name=='France')
    //     return '39'
    //   else
    //   return document.querySelector("#iso-"+d.id+"").getBBox().width
    // })
    //  .attr('height',function(d){
    //   if(d.name=='France')
    //     return '37'
    //   else
    //   return document.querySelector("#iso-"+d.id+"").getBBox().height
    // });

    var $rect = group.append('rect')
      .attr("class", "country-wrapper")
      // .attr("data-country-name", function(d) {
      //   return d.name;
      // })
      .attr("x", function (d) {return d.bounds[0][0];})
      .attr("y", function (d) {return d.bounds[0][1];})
      .attr("width", function (d) {
        return d.bounds[1][0] - d.bounds[0][0];}
      )
      .attr("height", function (d) {return d.bounds[1][1] - d.bounds[0][1];})
      .attr("preserveAspectRatio", "none")
      .attr("clip-path", function(d) {
        return "url(#iso-" + d.id + ")";
      })
      .attr("opacity",function(d){
        if (isGlobalMap === true) {
          if (window.available_map_countries.indexOf(d.name) > -1) {
            return "0.5";
          }
        }
      })
      .attr("fill",function(d){
        if (isGlobalMap === true) {
          if (window.available_map_countries.indexOf(d.name) > -1) {
            return 'black';
          }
          return "#f7f4ed"; // change color here;
        }

        if (d.name == selected_country)
          return 'none';
        else
          return "#f7f4ed"; // change color here;
      });

    if (isGlobalMap) {
      $rect.on('click', function(d){
        if (window.available_map_countries.indexOf(d.name) > -1) {
          // console.log("You clicked", d);
          var dd = d3.select(this);
          // console.log("the dom obj", dd);
          return false;
          // TODO: this locations, don't hardcode
          // var link = d.name.toLowerCase();
          // location.href = "/countries/eu_country_profiles/"+link+"";
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
          d3.select(this).attr('opacity','0.5');
        }
      });
    }

    // interior boundaries
    svg.insert("path", ".graticule")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("clip-path", "url(#sphere)")
      .attr("d", path);
    // exterior boundaries
    svg.insert("path", ".graticule")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a === b}))
      .attr("d", path)
      .attr("class", "boundary");

    svg.style('transform', 'scale('+pos[0]+') translate('+pos[1]+'px, '+pos[2]+'px');
  }
});
