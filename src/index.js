document.addEventListener('DOMContentLoaded', function() {

    var map = d3.select(".map")
                .attr("width", 1000)
                .attr("height", 500);


    // Setting projection parameters
    var mapProjection = d3.geoMercator()
                          .scale(110000)
                          .center([-119.89075,0.09995])
                          .translate([ 500, 250 ]);


    // Create geoPath function that uses built-in D3 functionality
    // to turn geographical coordinates into screen coordinates
    var geoPath = d3.geoPath().projection(mapProjection);

    d3.queue()
      .defer(d3.json, "data/StHimark.json")
      .defer(d3.csv, "data/StaticSensorLocations.csv")
      .await(drawMap);


    function drawMap(error, geoData, staticSensorLocations) {

      if (error) console.log(error);

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


      // Check if a point lies within the bounds of a polygon
      /* WORKS */
      var point = [-119.76075, 0.04205];
      for (var i = 0; i < geoData.features.length; i++) {
        if (d3.geoContains(geoData.features[i], point))
          console.log(i);
      }


      map.append("g")
         .attr("class", "static-sensors")
         .selectAll("rect")
         .data(staticSensorLocations)
         .enter()
         .append("rect")
         .attr("x", function(d) {
           let coordinates = [parseFloat(d.Long), parseFloat(d.Lat)];
           return mapProjection(coordinates)[0];
         })
         .attr("y", function (d) {
           let coordinates = [parseFloat(d.Long), parseFloat(d.Lat)];
           return mapProjection(coordinates)[1];
         })
         .attr("width", 12)
         .attr("height", 12)
         .style("fill", "orange")
         .style("opacity", 1)
         .style("stroke", "black");

  } // End of drawMap function


});
