document.addEventListener('DOMContentLoaded', function() {

   const FACTORY_GLYPH = "M456.723,121,328.193,248H312V121H291.3L166.084,248H152V32H32V480H480V121ZM172,432H132V392h40Zm0-80H132V312h40Zm80,80H212V392h40Zm0-80H212V312h40Zm80,80H292V392h40Zm0-80H292V312h40Zm80,80H372V392h40Zm0-80H372V312h40Z";
   const HOSPITAL_GLYPH = "M352,104V208H160V104H88V448H238V376h38v72H424V104ZM197,394H157V354h40Zm0-92H157V262h40Zm80,0H237V262h40Zm80,92H317V354h40Zm0-92H317V262h40ZM352,104V208H160V104H88V448H238V376h38v72H424V104ZM197,394H157V354h40Zm0-92H157V262h40Zm80,0H237V262h40Zm80,92H317V354h40Zm0-92H317V262h40Z";
   const MOBILE_SENSOR_IDX = [ 15, 22, 40,  1, 27, 30,  8, 41,  9, 37, 26, 16, 49, 13,  2, 31, 44,
                     6, 43, 14, 11, 23, 32,  3,  5, 35, 24,  4, 34, 45, 47, 39, 19, 29,
                     38, 12, 33, 17, 46, 10,  7, 18, 20, 50, 28, 48, 36, 25, 42, 21 ];

    // Populate the mobile sensor dropdown
    var selectpicker = d3.select(".navbar")
                     .select(".selectpicker");


    MOBILE_SENSOR_IDX.forEach(id => {
      selectpicker.append("option")
                  .text("Mobile Sensor " + id)
                  .attr("value", id);
    });


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
                    .attr("height", 550);

    var map = d3.select(".map")
                .attr("width", 600)
                .attr("height", 550);

    var barChart = d3.select(".barChart")
                .attr("width", 610)
                .attr("height", 550);

    var heat = d3.select(".heat")
        .attr("width", 1264)
        .attr("height", 1100);


    var sensorProximitySVG = d3.select(".sensorProximity")
                .attr("width", 1264)
                .attr("height", 750);


    // Setting projection parameters
    var mapProjection = d3.geoMercator()
                          .scale(120000)
                          .center([ -119.88075, 0.125 ])
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

      // Hashmap for associating area ID with sensor-id { areaID: sensorID }
      var hashmap = new Map();
      staticSensorLocations.forEach(function(d) {
        let point = [ parseFloat(d.Long), parseFloat(d.Lat) ];
        for (var i = 0; i < geoData.features.length; i++) {

          let locationID = geoData.features[i].properties["Id"];

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


      //   12, 15, 13, 11, 6, 1, 9, 14, 4
     sensorProximity("12", sensorProximitySVG, geoData, staticSensorLocations, staticSensorReadings, mobileSensorReadings);

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
                     d3.select(this).style("stroke", "white").style("stroke-width", 10);
                   })
                   .on("mouseout", function(d) {
                     d3.select(this).style("stroke", "white").style("stroke-width", 1);
                   })
                   .on("click", function(d) {
                      $("#sensorReadingsModal").modal("toggle");
                      d3.select("#sensorReadingsModal").select(".modal-title").text(d.properties.Name);

                      // Remove all the child nodes of lineSvg
                      d3.select(".staticSensorLineChart").selectAll("g").remove();
                      if (hashmap.has(d.properties.Id)) {
                        let keys = hashmap.get(d.properties.Id);
                        drawLineChart(lineSvg, radiationMeasurements, keys, toolTipDiv);
                      }

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
         .on("click", function(d) {
           // Clear the colours of all the line charts
           //d3.selectAll(".line").attr("stroke", "black");

           // Highlight the corresponding line chart
           //let line = d3.select(".static-sensor-curve-" + d["Sensor-id"]);
           //line.select(".line").attr("stroke", "orange");

         });

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
            .attr("stroke-width", d => { return radiationMeasurements.get(d["Sensor-id"]).get("readings")[i] + 70; })
            .attr('stroke-opacity', 0)
            .ease(d3.easeSin)
            .on("end", repeat);

            if (i == 1200) i = -1;
            i += 1;

        })();
    }

    drawCircularHeat();

    d3.select("#mobile-sensor-id")
    .on("change", function() {
      d3.select(".mobile-sensors").remove().exit();
      drawMobileSensors(map, mapProjection, mobileSensorReadings, this.value);
   });


  } // End of drawMap function

  function drawCircularHeat() {
        d3.csv('data/MobileSensorReadingsAggregate.csv', function(mobileData) {
            d3.csv('data/StaticSensorReadingsAggregate.csv', function(staticData) {
                /* Label data */
                var days = ['6th April 2020', '7th April 2020', '8th April 2020', '9th April 2020', '10th April 2020'];
                var dayData = [];
                var total = 0;
                var ctr = 0;
                var currentHour = mobileData[0]['Timestamp'].split(" ")[1].split(":")[0];
                for (var i = 0; i < mobileData.length; i++) {
                    if (currentHour != mobileData[i]['Timestamp'].split(" ")[1].split(":")[0]) {
                        dayData.push(total / ctr);
                        currentHour = mobileData[i]['Timestamp'].split(" ")[1].split(":")[0];
                        ctr = 1;
                        total = parseFloat(mobileData[i]['Value']);
                    } else {
                        total += parseFloat(mobileData[i]['Value']);
                        ctr += 1;
                    }
                }
                while (dayData.length < 120)
                    dayData.push(0)

                var total = 0;
                var index = 0;
                var ctr = 0;
                var currentHour = staticData[0]['Timestamp'].split(" ")[1].split(":")[0];
                for (var i = 0; i < staticData.length; i++) {
                    if (currentHour != staticData[i]['Timestamp'].split(" ")[1].split(":")[0]) {
                        var temp = dayData[index];
                        temp += (total / ctr);
                        dayData[index] = temp;
                        index++;
                        currentHour = staticData[i]['Timestamp'].split(" ")[1].split(":")[0];
                        ctr = 1;
                        total = parseFloat(staticData[i]['Value']);
                    } else {
                        total += parseFloat(staticData[i]['Value']);
                        ctr += 1;
                    }
                }

                /* Create the chart */
                var chart = circularHeatChart()
                    .segmentHeight(20)
                    .innerRadius(20)
                    .numSegments(5)
                    .range(['white', 'blue'])
                    .segmentLabels(days)
                    .radialLabels(["Midnight", "1am", "2am", "3am", "4am", "5am", "6am", "7am", "8am", "9am", "10am", "11am", "Midday", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm", "11pm"]);

                heat.selectAll('svg')
                    .data([dayData])
                    .enter()
                    .append('svg')
                    .call(chart);
            });
        });
    }  // end of drawCircularHeat function

});
