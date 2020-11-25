document.addEventListener('DOMContentLoaded', function() {

    var lineSvg = d3.select(".staticSensorLineChart")
                    .attr("width", 1264)
                    .attr("height", 750);

    var map = d3.select(".map")
                .attr("width", 1264)
                .attr("height", 550);

    var barChart = d3.select(".barChart")
                .attr("width", 1264)
                .attr("height", 750);
    


    // Setting projection parameters
    var mapProjection = d3.geoMercator()
                          .scale(135000)
                          .center([-119.88075,0.125])
                          .translate([ 500, 250 ]);


    // Create geoPath function that uses built-in D3 functionality
    // to turn geographical coordinates into screen coordinates
    var geoPath = d3.geoPath().projection(mapProjection);

    d3.queue()
      .defer(d3.json, "data/StHimark.json")
      .defer(d3.csv, "data/StaticSensorLocations.csv")
      .defer(d3.csv, "data/StaticSensorReadingsAggregate.csv")
      .defer(d3.csv, "data/MobileSensorReadingsAggregate.csv")
      .await(drawMap);


    function drawMap(error, geoData, staticSensorLocations, staticSensorReadings, mobileSensorReadings) {

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
         .text(function(d){
           return d.properties.Name;
         })
         .attr("x", function(d){
           let temp = {};
           temp.geometry = d.geometry;
           temp.geometry.type = "MultiPolygon";
           temp.geometry.coordinates = [d.geometry.coordinates[0]];
           return geoPath.centroid(temp.geometry)[0];
         })
         .attr("y", function(d){
           let temp = {};
           temp.geometry = d.geometry;
           temp.geometry.type = "MultiPolygon";
           temp.geometry.coordinates = [d.geometry.coordinates[0]];
           return geoPath.centroid(temp.geometry)[1];
         })
         .attr("text-anchor","middle")
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
         .attr("cy", function (d) {
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
            .style("fill", function(d) { if (radiationMeasurements[d["Sensor-id"]][i] > 15) return "red"; else return "#33e613"; })
            .style("stroke", function(d) { if (radiationMeasurements[d["Sensor-id"]][i] > 15) return "red"; else return "#33e613"; })
            .attr("r", function(d) { if (radiationMeasurements[d["Sensor-id"]][i] > 15) return 10; else return 2; })
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

    drawLineChart(lineSvg, radiationMeasurements);
    drawBarChart(barChart, geoData, staticSensorLocations, staticSensorReadings, mobileSensorReadings);

  } // End of drawMap function


});
