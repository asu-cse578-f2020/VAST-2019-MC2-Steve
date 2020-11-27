function drawMobileSensors(map, mapProjection, mobileSensorReadings, sensor_id) {

  const SENSOR_GLYPH = "M256.6,17.236c-132.217,0-239.4,107.182-239.4,239.4s107.182,239.4,239.4,239.4S496,388.852,496,256.635,388.817,17.236,256.6,17.236ZM398.933,220.262l-64.069,64.586,13.87,89.911a8,8,0,0,1-11.51,8.362L256,342.146l-81.224,40.975a8,8,0,0,1-11.51-8.362l13.87-89.911-64.069-64.586a8,8,0,0,1,4.4-13.531l89.795-14.593,41.628-80.891a8,8,0,0,1,14.226,0l41.628,80.891,89.8,14.593A8,8,0,0,1,398.933,220.262Z";

  var values = new Map();

  let currentReadings = mobileSensorReadings.filter(x => {
    return x["Sensor-id"] == sensor_id;
  });

  let internalMap = new Map();
  internalMap.set("readings", []);
  internalMap.set("locations", []);
  internalMap.set("timestamps", []);

  currentReadings.forEach(r => {
    internalMap.get("readings").push(r.Value);
    internalMap.get("locations").push([ r.Long, r.Lat ]);
    internalMap.get("timestamps").push(r.Timestamp);
  });

  values.set(sensor_id, internalMap);

  let g = map.append("g")
                 .attr("class", "mobile-sensors");

  g.append("g")
     .attr("class", "mobile-sensor-15")
     .append("path")
     .attr("d", SENSOR_GLYPH)
     .attr("transform", "translate(" + mapProjection(values.get(sensor_id).get("locations")[0])[0] + ", " + mapProjection(values.get(sensor_id).get("locations")[0])[1] + ")scale(0.045)")
     .style("fill", "#6300b6");


   var path = g.append("path")
               .attr("class", "line")
               .datum(values.get(sensor_id).get("locations"))
               .attr("fill", "none")
               .attr("stroke", "black")
               .attr("stroke-width", 0.7)
               .attr("d", d3.line()
                             .x( function(d) { return mapProjection(d)[0]; } )
                             .y( function(d) { return mapProjection(d)[1]; } )
                );

   var totalLength = path.node().getTotalLength();

   path.attr("stroke-dasharray", totalLength + " " + totalLength)
       .attr("stroke-dashoffset", totalLength)
      .transition()
       .duration(5000)
       .ease(d3.easeLinear)
       .attr("stroke-dashoffset", 0);

}
