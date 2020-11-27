document.addEventListener('DOMContentLoaded', function() {

    var lineSvg = d3.select(".staticSensorLineChart")
        .attr("width", 1264)
        .attr("height", 750);

    var map = d3.select(".map")
        .attr("width", 1264)
        .attr("height", 550);

    var heat = d3.select(".heat")
        .attr("width", 1264)
        .attr("height", 1100);


    var sensorProximitySVG = d3.select(".sensorProximity")
                .attr("width", 1264)
                .attr("height", 750);


    // Setting projection parameters
    var mapProjection = d3.geoMercator()
        .scale(135000)
        .center([-119.88075, 0.125])
        .translate([500, 250]);


    // Create geoPath function that uses built-in D3 functionality
    // to turn geographical coordinates into screen coordinates
    var geoPath = d3.geoPath().projection(mapProjection);

    d3.queue()
        .defer(d3.json, "data/StHimark.json")
        .defer(d3.csv, "data/StaticSensorLocations.csv")
        .defer(d3.csv, "data/StaticSensorReadingsAggregate.csv")
        .await(drawMap);


    function drawMap(error, geoData, staticSensorLocations, staticSensorReadings) {

        if (error) console.log(error);

        /* Hashmap for associating area ID with sensor-id { areaID: sensorID }
        var hashmap = {};
        staticSensorLocations.forEach(function(d) {
          let point = [parseFloat(d.Long), parseFloat(d.Lat)];
          for (var i = 0; i < geoData.features.length; i++) {
            if (d3.geoContains(geoData.features[i], point))
              hashmap[geoData.features[i].properties["Id"]] = d["Sensor-id"];
          }
        });
        */

        /* Radiatian Measurements every 6 minutes grouped-by area ID
        var raditionMeasurements = {};
        geoData.features.forEach(function(d) {
          // For each area, first find the sensor present in that area, and then find its corresponding radiation measurements
          let regionID = d.properties["Id"];
          let sensorID = hashmap[regionID];
          raditionMeasurements[sensorID] = [];

          // filter staticSensorAggregateData for this particular sensorID
          let curr = staticSensorReadings.filter(function(x) {
            return x["Sensor-id"] == sensorID;
          });

          curr.forEach(function(x) {
            raditionMeasurements[sensorID].push(parseFloat(x.Value));
          });

        }); */

        // Radiation Measurements for each static sensor
        radiationMeasurements = {};
        staticSensorLocations.forEach(function(d) {
            let sensorID = d["Sensor-id"];
            radiationMeasurements[sensorID] = [];
            let curr = staticSensorReadings.filter(function(x) {
                return x["Sensor-id"] == sensorID;
            });

            curr.forEach(function(x) {
                radiationMeasurements[sensorID].push(parseFloat(x.Value));
            });
        });


        geo_map = map.append("g")
            .attr("class", "st-himark-map")
            .selectAll("path")
            .data(geoData.features)
            .enter()
            .append("path")
            .attr("d", geoPath)
            .style("fill", "black")
            .style("stroke", "gray");


        // Neighborhood names at the centroid of each polygon
        map.append("g")
            .attr("class", "neighborhood-names")
            .selectAll("text")
            .data(geoData.features)
            .enter()
            .append("svg:text")
            .text(function(d) {
                return d.properties.Name;
            })
            .attr("x", function(d) {
                let temp = {};
                temp.geometry = d.geometry;
                temp.geometry.type = "MultiPolygon";
                temp.geometry.coordinates = [d.geometry.coordinates[0]];
                return geoPath.centroid(temp.geometry)[0];
            })
            .attr("y", function(d) {
                let temp = {};
                temp.geometry = d.geometry;
                temp.geometry.type = "MultiPolygon";
                temp.geometry.coordinates = [d.geometry.coordinates[0]];
                return geoPath.centroid(temp.geometry)[1];
            })
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .style("font-size", "9px");


        map.append("g")
            .attr("class", "static-sensors")
            .selectAll("rect")
            .data(staticSensorLocations)
            .enter()
            .append("circle")
            .attr("id", function(d) { return "static-sensor-" + d["Sensor-id"]; })
            .attr("cx", function(d) {
                let coordinates = [parseFloat(d.Long), parseFloat(d.Lat)];
                return mapProjection(coordinates)[0];
            })
            .attr("cy", function(d) {
                let coordinates = [parseFloat(d.Long), parseFloat(d.Lat)];
                return mapProjection(coordinates)[1];
            })
            .attr("r", 2)
            .style("fill", "#33e613")
            .style("opacity", 1)
            .style("stroke", "#33e613");

        var circles = d3.selectAll("circle");
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
                    .style("fill", function(d) {
                        if (radiationMeasurements[d["Sensor-id"]][i] > 15) return "red";
                        else return "#33e613";
                    })
                    .style("stroke", function(d) {
                        if (radiationMeasurements[d["Sensor-id"]][i] > 15) return "red";
                        else return "#33e613";
                    })
                    .attr("r", function(d) {
                        if (radiationMeasurements[d["Sensor-id"]][i] > 15) return 10;
                        else return 2;
                    })
                    .transition()
                    .duration(1000)
                    .attr("stroke-width", function(d) { return radiationMeasurements[d["Sensor-id"]][i] + 70; })
                    .attr('stroke-opacity', 0)
                    .ease(d3.easeSin)
                    .on("end", repeat);

                if (i == 1200) i = -1;
                i += 1;

            })();
        }
      });


    //   12, 15, 13, 11, 6, 1, 9, 14, 4

      sensorProximity("12", sensorProximitySVG, geoData, staticSensorLocations, staticSensorReadings, mobileSensorReadings);

      // Radiation Measurements for each static sensor
     radiationMeasurements = {};
     staticSensorLocations.forEach(d => {
       let sensorID = d["Sensor-id"];

       radiationMeasurements[sensorID] = {
         "readings": [],
         "timestamps": []
       };

       // Get data for the current sensor
       let curr = staticSensorReadings.filter(x => {
         return x["Sensor-id"] == sensorID;
       });

       curr.forEach( x => {
         radiationMeasurements[sensorID]["readings"].push(parseFloat(x.Value));
         radiationMeasurements[sensorID]["timestamps"].push(parseTime(x.Timestamp));
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
           d3.selectAll(".line").attr("stroke", "black");

           // Highlight the corresponding line chart
           let line = d3.select(".static-sensor-curve-" + d["Sensor-id"]);
           line.select(".line").attr("stroke", "orange");

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
            .style("fill", d => { if (radiationMeasurements[d["Sensor-id"]]["readings"][i] > 15) return "red"; else return "#00d210"; })
            .style("stroke", d => { if (radiationMeasurements[d["Sensor-id"]]["readings"][i] > 15) return "red"; else return "#00d210"; })
            .attr("r", d => { if (radiationMeasurements[d["Sensor-id"]]["readings"][i] > 15) return 10; else return 2; })
            .transition()
            .duration(1000)
            .attr("stroke-width", d => { return radiationMeasurements[d["Sensor-id"]]["readings"][i] + 70; })
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
   });


  } // End of drawMap function


});
