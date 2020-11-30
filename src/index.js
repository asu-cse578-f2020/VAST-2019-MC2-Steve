document.addEventListener('DOMContentLoaded', function() {

    const FACTORY_GLYPH = "M456.723,121,328.193,248H312V121H291.3L166.084,248H152V32H32V480H480V121ZM172,432H132V392h40Zm0-80H132V312h40Zm80,80H212V392h40Zm0-80H212V312h40Zm80,80H292V392h40Zm0-80H292V312h40Zm80,80H372V392h40Zm0-80H372V312h40Z";
    const HOSPITAL_GLYPH = "M352,104V208H160V104H88V448H238V376h38v72H424V104ZM197,394H157V354h40Zm0-92H157V262h40Zm80,0H237V262h40Zm80,92H317V354h40Zm0-92H317V262h40ZM352,104V208H160V104H88V448H238V376h38v72H424V104ZM197,394H157V354h40Zm0-92H157V262h40Zm80,0H237V262h40Zm80,92H317V354h40Zm0-92H317V262h40Z";
    const MOBILE_SENSOR_IDX = [ 15, 22, 40,  1, 27, 30,  8, 41,  9, 37, 26, 16, 49, 13,  2, 31, 44,
                     6, 43, 14, 11, 23, 32,  3,  5, 35, 24,  4, 34, 45, 47, 39, 19, 29,
                     38, 12, 33, 17, 46, 10,  7, 18, 20, 50, 28, 48, 36, 25, 42, 21 ];
    const STATIC_SENSOR_IDX = [12, 15, 13, 11, 6, 1, 9, 14, 4];



    STATIC_SENSOR_IDX.sort((a,b)=>a-b);
    MOBILE_SENSOR_IDX.sort((a,b)=>a-b);

    // Populate the mobile sensor dropdown
    var selectpicker = d3.select(".navbar")
                     .select(".mobile-select-picker");
    var mobileSensorSelectPicker = d3.select(".navbar")
                                     .select("#mobile-sensor-id");


    // MOBILE_SENSOR_IDX.forEach(id => {
    //   mobileSensorSelectPicker.append("option")
    //                           .text("Mobile Sensor " + id)
    //                           .attr("value", id);
    // });

    var staticSelectpicker = d3.select(".navbar")
                     .select(".static-select-picker");


    STATIC_SENSOR_IDX.forEach(id => {
      staticSelectpicker.append("option")
                  .text("Static Sensor " + id)
                  .attr("value", id);
    });
    var regionSelectPicker = d3.select(".navbar")
                               .select(".region-select-picker");


    // Define the div for the tooltip
    var toolTipDiv;
    toolTipDiv = d3.select("body")
                 .append("div")
                 .attr("class", "tooltip")
                 .style("opacity", 0);

    var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
    var alwaysSafePlantLocation = [ -119.784825, 0.162679 ];

    var lineSvg = d3.select(".staticSensorLineChart")
                    .attr("width", 1110)
                    .attr("height", 240);

    var map = d3.select(".map")
                .attr("width", 575)
                .attr("height", 550);

    var barChart = d3.select(".barChart")
                .attr("width", 610)
                .attr("height", 550);

    var heat = d3.select(".heat")
        .attr("width", 460)
        .attr("height", 460);

    var sensorProximitySVG = d3.select(".sensorProximity")
                .attr("width", 1110)
                .attr("height", 750);

    var mobileSensorProximitySVG = d3.select(".mobileSensorProximity")
                .attr("width", 1264)
                .attr("height", 750);


    // Setting projection parameters
    var mapProjection = d3.geoMercator()
                          .scale(120000)
                          .center([ -119.87500, 0.113 ])
                          .translate([ 220, 250 ]);

    var geoPath = d3.geoPath().projection(mapProjection);


    d3.queue()
      .defer(d3.json, "data/StHimark.json")
      .defer(d3.csv, "data/StaticSensorLocations.csv")
      .defer(d3.csv, "data/StaticSensorReadingsAggregate.csv")
      .defer(d3.csv, "data/MobileSensorReadingsAggregate.csv")
      .defer(d3.csv, "data/HospitalLocations.csv")
      .await(drawMap);


    function drawMap(error, geoData, staticSensorLocations, staticSensorReadings, mobileSensorReadings, hospitalLocations) {

      if (error) console.log(error);

      var regionNameMappings = new Map();

      geoData.features.forEach(d => {
        let locationID = d.properties.Id;
        let locationName = d.properties.Name;
        
        //console.log(d);
        // Populate the region select picker with region names
        regionSelectPicker.append("option")
                          .text(locationName)
                          .attr("value", locationID);
        //console.log(regionSelectPicker);

        regionNameMappings.set(locationID, locationName);
      });
      
      $('.region-select-picker').selectpicker('refresh');
      // Hashmap for associating area ID with sensor-id { areaID: sensorID }
      var hashmap = new Map();

      staticSensorLocations.forEach(function(d) {
        let point = [ parseFloat(d.Long), parseFloat(d.Lat) ];
        for (var i = 0; i < geoData.features.length; i++) {

          let locationID = geoData.features[i].properties.Id;

          if (d3.geoContains(geoData.features[i], point)) {
            if (hashmap.has(locationID)) {
              hashmap.get(locationID).push( d["Sensor-id"] );
            }
            else {
              hashmap.set(locationID, [ d["Sensor-id"] ]);
            }
          }
        }
      });


      // Radiation Measurements for each static sensor
      radiationMeasurements = new Map();
      staticSensorLocations.forEach(d => {
       let sensorID = d["Sensor-id"];
       let tempMap = new Map();
       tempMap.set("readings", []);
       tempMap.set("timestamps", []);
       radiationMeasurements.set(sensorID, tempMap);

       // Get data for the current sensor
       let curr = staticSensorReadings.filter(x => {
         return x["Sensor-id"] == sensorID;
       });

       curr.forEach( x => {
         radiationMeasurements.get(sensorID).get("readings").push(parseFloat(x.Value));
         radiationMeasurements.get(sensorID).get("timestamps").push(x.Timestamp);
       });
     });

      var regionFreqArray = drawBarChart(barChart, geoData, staticSensorLocations, staticSensorReadings, mobileSensorReadings);
      var regionFreqDict = {};
      regionFreqArray.forEach(d => { regionFreqDict[d[0].toString()] = d[1]; });


     /**
     Color scale for the choropleth map.
     Based on the number of sensor readings per region. **/
     var geoMapColorScale = d3.scaleLog()
                              .domain([ 2000, 7994 ])
                              .range([ "#c6dbef", "#6baed6", "#3182bd", "#08519c" ]);

     // Choropleth map
     geo_map = map.append("g")
                   .attr("class", "st-himark-map")
                   .selectAll("path")
                   .data(geoData.features)
                   .enter()
                   .append("path")
                   .attr("d", geoPath)
                   .style("fill", d => { return geoMapColorScale(regionFreqDict[d.properties.Name]); })
                   .style("stroke", "white")
                   .on("mouseover", function(d) {
                     d3.select(this).style("stroke", "white").attr("stroke-width", 10);
                   })
                   .on("mouseout", function(d) {
                     d3.select(this).style("stroke", "white").attr("stroke-width", 1);
                   })
                   .on("click", function(d) {
                        onRegionClick(d);
                   });


     // Always Safe Nuclear Plant
     map.append("g")
        .attr("class", "nuclear-plant")
        .append("path")
        .attr("d", FACTORY_GLYPH)
        .attr("transform", "translate(" + mapProjection(alwaysSafePlantLocation)[0] + ", " + mapProjection(alwaysSafePlantLocation)[1] + ")scale(0.05)")
        .style("fill", "orange");


     // Neighborhood names at the centroid of each polygon
     map.append("g")
        .attr("class", "neighborhood-names")
        .selectAll("text")
        .data(geoData.features)
        .enter()
         .append("svg:text")
         .attr("transform", d => { if (d.properties.Name == "Wilson Forest") return "rotate(-90, 550.9, 278.9)"; else return "rotate(0)"; })
         .text(d => {
           return d.properties.Name;
         })
         .attr("x", d => {
           let temp = {};
           temp.geometry = d.geometry;
           temp.geometry.type = "MultiPolygon";
           temp.geometry.coordinates = [d.geometry.coordinates[0]];
           return geoPath.centroid(temp.geometry)[0];
         })
         .attr("y", d => {
           let temp = {};
           temp.geometry = d.geometry;
           temp.geometry.type = "MultiPolygon";
           temp.geometry.coordinates = [d.geometry.coordinates[0]];
           return geoPath.centroid(temp.geometry)[1];
         })
         .attr("text-anchor","middle")
         .attr("fill", "black")
         .style("font-size", "10px");


      // Hospitals
      map.append("g")
         .attr("class", "hospitals")
         .selectAll("path")
         .data(hospitalLocations)
         .enter()
         .append("path")
         .attr("d", HOSPITAL_GLYPH)
         .attr("transform", d => {
           let coordinates = [ parseFloat(d.Long), parseFloat(d.Lat) ];
           return "translate(" + mapProjection(coordinates)[0] + ", " + mapProjection(coordinates)[1] + ")scale(0.04)";
         })
         .style("fill", "black");


      // Static sensors
      map.append("g")
         .attr("class", "static-sensors")
         .selectAll("circle")
         .data(staticSensorLocations)
         .enter()
         .append("circle")
         .attr("id", d => { return "static-sensor-" + d["Sensor-id"]; })
         .attr("cx", d => {
           let coordinates = [parseFloat(d.Long), parseFloat(d.Lat)];
           return mapProjection(coordinates)[0];
         })
         .attr("cy", d => {
           let coordinates = [parseFloat(d.Long), parseFloat(d.Lat)];
           return mapProjection(coordinates)[1];
         })
         .attr("r", 2)
         .style("fill", "#42ff00")
         .style("opacity", 1)
         .style("stroke", "#42ff00")

    drawMapLegend(map, geoMapColorScale);
    var circles = d3.select(".static-sensors").selectAll("circle");
    pulse(circles);

    // The pulsating effect shows spikes in radiation measurements. When the radius of the
    // circle increases, it is an indication of radiation detection.
    function pulse(circle) {

        let i = 0;
        (function repeat() {

           circle
            .transition()
            .duration(100)
            .attr("stroke-width", 0)
            .attr('stroke-opacity', 0)
            .transition()
            .duration(100)
            .attr("stroke-width", 0)
            .attr('stroke-opacity', 0.5)
            .style("fill", d => { if (radiationMeasurements.get(d["Sensor-id"]).get("readings")[i] > 15) return "red"; else return "#00d210"; })
            .style("stroke", d => { if (radiationMeasurements.get(d["Sensor-id"]).get("readings")[i] > 15) return "red"; else return "#00d210"; })
            .attr("r", d => { if (radiationMeasurements.get(d["Sensor-id"]).get("readings")[i] > 15) return 10; else return 2; })
            .transition()
            .duration(1000)
            .attr("stroke-width", d => {  getMapHeaderTimestamp(i, d["Sensor-id"]); return radiationMeasurements.get(d["Sensor-id"]).get("readings")[i] + 70; })
            .attr('stroke-opacity', 0)
            .ease(d3.easeSin)
            .on("end", repeat);

            if (i == 1200) i = -1;
            i += 1;

        })();
    }

   d3.select("#mobile-sensor-id")
    .on("change", function() {
      d3.select(".mobile-sensors").remove().exit();
      drawMobileSensors(map, mapProjection, mobileSensorReadings, this.value);
      mobileSensorProximity(this.value, mobileSensorProximitySVG, geoData, staticSensorLocations, staticSensorReadings, mobileSensorReadings);

   });

   d3.select("#static-sensor-id")
    .on("change", function() {
    //   d3.select(".mobile-sensors").remove().exit();

    $("#staticSensorProximityReadingsModal").modal("toggle");
    let modal = d3.select("#staticSensorProximityReadingsModal");
    modal.select(".modal-title").text("Static Sensor " + this.value);
    modal.select(".modal-body").style("height", "60vh");

    // Remove all the child nodes of lineSvg
    d3.select(".sensorProximity").selectAll("g").remove();
    sensorProximity(this.value, sensorProximitySVG, geoData, staticSensorLocations, staticSensorReadings, mobileSensorReadings);

   });

   d3.select("#region-id")
   .on("change", function() {

     $("#sensorReadingsModal").modal("toggle");
     let regionID = parseInt(this.value);
     let modal = d3.select("#sensorReadingsModal");

     // Remove all the child nodes of lineSvg.
     d3.select(".staticSensorLineChart").selectAll("g").remove();

     if (hashmap.has(regionID)) {
       let keys = hashmap.get(regionID);
       drawLineChart(lineSvg, radiationMeasurements, keys, toolTipDiv);
       let peakValues = getPeakValueTimestamp(radiationMeasurements, keys);
       modal.select(".modal-title").html("<span style='font-size: 1.5rem; font-weight: bolder'> " + regionNameMappings.get(regionID) + " </span> &nbsp; &nbsp; &nbsp; <span class='badge badge-pill badge-dark' style='font-size: 0.9rem;'>Peak Value: " + peakValues[0] + " </span> &nbsp; &nbsp; &nbsp; <span class='badge badge-pill badge-dark' style='font-size: 0.9rem;'>Timestamp: " + peakValues[1] + "</span>");
    }
    else {
      modal.select(".modal-title").html("<span style='font-size: 1.5rem; font-weight: bolder'> " + regionNameMappings.get(regionID) + " </span> &nbsp; &nbsp; &nbsp; <span style='font-size: 0.9rem;'> No static sensors exist in this region. </span>");
    }

    // Draw the circular heatmap
    drawCircularHeat(heat, regionID, geoData, mobileSensorReadings, staticSensorReadings);

  });

   // Updates the timestamp on map header
   function getMapHeaderTimestamp(index, sensorID) {
     let timestamp = radiationMeasurements.get(sensorID).get("timestamps")[index];
     d3.select(".map-header").html("<h5 class='card-header'> St. Himark Map &nbsp; &nbsp;  <span class='badge badge-pill badge-dark'>Timestamp: " + timestamp + "</span> </h5 ");
   }


   function onRegionClick(d){

        transitionLine(d.properties.Name);
        filterMobileSensorsPerRegion(d.properties.Name, geoData, mobileSensorSelectPicker, mobileSensorReadings);
    }

    function filterMobileSensorsPerRegion(regionName, geoData,mobileSensorSelectPicker, mobileSensorReadings)
    {
        let mobileSensorSet = new Set();
        let currentGeoData = geoData.features.filter(d=> d.properties.Name===regionName)[0];

        mobileSensorReadings.forEach(reading => {
            if (d3.geoContains(currentGeoData, [reading[LONG], reading[LAT]]))
            {
                mobileSensorSet.add(reading[SENSOR_ID]);
            }
        });


        document.getElementById("mobile-sensor-id").innerHTML = "";
        // mobileSensorSelectPicker.empty();
        // let mobileSelect = d3.select(".mobile-select-picker");
        Array.from(mobileSensorSet).forEach(id => {
            // console.log(id);
            mobileSensorSelectPicker.append("option")
                                    .text("Mobile Sensor " + id)
                                    .attr("value", id);
        });
        $('.mobile-select-picker').selectpicker('refresh');
        // console.log(mobileSensorSet);
    }

  } // End of drawMap function




  function getPeakValueTimestamp(radiationMeasurements, keys) {

    function argMax(array) {
        return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
    }

    var result = [];

    keys.forEach(k => {
      result.push({
        "val": Math.max(...radiationMeasurements.get(k).get("readings")),
        "timestamp": radiationMeasurements.get(k).get("timestamps")[argMax(radiationMeasurements.get(k).get("readings"))]
      });
    });

    if (result.length == 1)
      return [ result[0]["val"], result[0]["timestamp"] ];
    else {
      if (result[0]["val"] >= result[1]["val"])
        return [ result[0]["val"], result[0]["timestamp"] ];
      else
        return [ result[1]["val"], result[1]["timestamp"] ];
    }

  }

  function drawMapLegend(map, geoMapColorScale) {

    map.append("svg:text")
       .attr("transform", "translate(175, 430)")
       .text("Always Safe Nuclear Plant")
       .attr("text-anchor", "end")
       .attr("fill", "black")
       .style("font-size", "12px");

    map.append("path")
       .attr("d", FACTORY_GLYPH)
       .attr("transform", "translate(10, 410)scale(0.05)")
       .style("fill", "orange");

    map.append("svg:text")
       .attr("transform", "translate(80, 390)")
       .text("Hospital")
       .attr("text-anchor", "end")
       .attr("fill", "black")
       .style("font-size", "12px");

    map.append("path")
        .attr("d", HOSPITAL_GLYPH)
        .attr("transform", "translate(10, 370)scale(0.05)")
        .style("fill", "black");

    const axis = d3.scaleLog()
                   .domain([ 2000, 7994 ])
                   .range([ 0, 200 ]);

    const legendAxis = d3.axisBottom(axis)
                         .ticks("7", ".1s");


    const defs = map.append("defs");
    const linearGradient = defs.append("linearGradient").attr("id", "linear-gradient");

    linearGradient.selectAll("stop")
                  .data(geoMapColorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: geoMapColorScale(t) })))
                  .enter().append("stop")
                  .attr("offset", d => d.offset)
                  .attr("stop-color", d => d.color);
    // Legend svg
    map.append("g")
          .attr("class", "rect-container")
          .attr("transform", `translate(110, 450)`)
          .append("rect")
          .attr("transform", `translate(-100, 0)`)
          .attr("width", 200)
          .attr("height", 20)
          .style("fill", "url(#linear-gradient)");

    map.append("g")
           .attr("class", "legend-axis")
           .attr("transform", "translate(10, 470)")
           .call(legendAxis)
           .style("stroke-width", 0);

     map.select(".legend-axis")
       .selectAll(".tick line")
       .attr("stroke-opacity", 1)
       .attr("stroke-width", 1)
       .attr("y2", -20)
       .style("stroke", "white");

     map.select(".legend-axis")
       .selectAll(".tick text")
       .style("padding", "10px");
  }
});




