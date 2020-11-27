function drawLineChart(lineSvg, radiationMeasurements) {

  var lineMargin = { top: 20, right: 10, bottom: 20, left: 10 };
  var lineWidth = +lineSvg.style('width').replace('px','') - 100;
  var lineHeight = 120;
  var lineInnerWidth = lineWidth - lineMargin.left - lineMargin.right - 30;
  var lineInnerHeight = lineHeight - lineMargin.top - lineMargin.bottom;
  var keys = Object.keys(radiationMeasurements);
  var timestamps = {};

  d3.csv("data/StaticSensorReadingsAggregate.csv", function(data) {

    for (var i = 0; i < keys.length; i++) {

      let objects = data.filter(function(x) {
                    return x["Sensor-id"] == keys[i];
                });

      timestamps[keys[i]] = [];
      objects.forEach(function(x) {
        timestamps[keys[i]].push(x.Timestamp);
      });

    }

     // Draw multiple line charts
     keys.forEach(function(key, i) {

       // Draw the line-chart
       let g = lineSvg.append("g")
                      .attr("class", "static-sensor-curve-" + key.toString());

        g.append("text")
          .attr("class", "sensor-label")
          .attr("transform", "translate(40," + ((lineInnerHeight) * (i + 1))/1 + ")")
          .attr("text-anchor", "middle")
          .text("Static Sensor " + key.toString())
          .style("font", "10px sans-serif")
          .style("fill", "gray");

        // X-axis
       const xScale = d3.scaleLinear()
                      .domain([0, 1200])
                      .range([0, lineInnerWidth]);
       const xAxis = d3.axisBottom(xScale);
       lineSvg.append("g")
              .attr("class", "xtick-labels-" + key.toString())
              .style("color", "gray")
              .attr("transform", "translate(100," + (lineInnerHeight) * (i + 1) + ")")
              .call(xAxis);


       // Y-axis
       const yScale = d3.scaleLinear()
                        .domain([12, 74])
                        .range([lineInnerHeight, 0]);
       const yAxis = d3.axisLeft(yScale);

       lineSvg.append("g")
               .attr("class", "ytick-labels-" + key.toString())
               .attr("transform", "translate(100," + (lineInnerHeight * i) + ")")
               .style("color", "gray")
               .call(yAxis);

       // Remove every other y-tick label
        var ticks = d3.selectAll(".ytick-labels-" + key.toString() + " text");
        ticks.each(function(_, j) {
          if (j%2 !== 0) d3.select(this).remove();
        });

       g.append("path")
        .attr("transform", "translate(100," + (lineInnerHeight * i) + ")")
        .datum(radiationMeasurements[key.toString()])
        .attr("fill", "none")
        .attr("stroke", "#E64613")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
                     .x(function(d, idx) { return xScale(idx); } )
                     .y(function(d, idx) { return yScale(d); } ));


     });

  });

}
