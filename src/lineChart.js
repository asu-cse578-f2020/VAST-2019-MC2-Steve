function drawLineChart(lineSvg, radiationMeasurements, keys, toolTipDiv) {

  var lineMargin = { top: 10, right: 10, bottom: 20, left: 10 };
  var lineWidth = +lineSvg.style('width').replace('px','') - 100;
  var lineHeight = 120;
  var lineInnerWidth = lineWidth - lineMargin.left - lineMargin.right - 30;
  var lineInnerHeight = lineHeight - lineMargin.top - lineMargin.bottom;
  //var keys = Object.keys(radiationMeasurements);
  var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");


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
     const xScale = d3.scaleTime()
                      .domain(d3.extent(radiationMeasurements[key].timestamps))
                      .range([0, lineInnerWidth]);
     const xAxis = d3.axisBottom(xScale)
                     .tickFormat(d3.timeFormat("%Y-%m-%d %H:%M:%S"));


     g.append("g")
            .attr("class", "xtick-labels-" + key.toString())
            .style("color", "gray")
            .attr("transform", "translate(100," + ((lineInnerHeight) * (i + 1)) + ")")
            .call(xAxis);


     // Y-axis
     const yScale = d3.scaleLinear()
                      .domain([12, 74])
                      .range([lineInnerHeight, 0]);
     const yAxis = d3.axisLeft(yScale);

     /*
     g.append("g")
             .attr("class", "ytick-labels-" + key.toString())
             .attr("transform", "translate(100," + ((lineInnerHeight * i)) + ")")
             .style("color", "gray")
             .call(yAxis);
     */

     // Remove every other x-tick label
      var ticks = d3.selectAll(".xtick-labels-" + key.toString() + " text");
      ticks.each(function(_, j) {
        if (j%2 !== 0) d3.select(this).remove();
      });


     var path = g.append("path")
                 .attr("class", "line")
                 .attr("transform", "translate(100," + (lineInnerHeight * i) + ")")
                 .datum(radiationMeasurements[key.toString()].readings)
                 .attr("fill", "none")
                 .attr("stroke", "black")
                 .attr("stroke-width", 1.2)
                 .attr("d", d3.line()
                               .x( function(d, idx) { return xScale(radiationMeasurements[key.toString()].timestamps[idx]); } )
                               .y( function(d) { return yScale(d); } )
                  );

     var totalLength = path.node().getTotalLength();

     path.attr("stroke-dasharray", totalLength + " " + totalLength)
         .attr("stroke-dashoffset", totalLength)
        .transition()
         .duration(4000)
         .ease(d3.easeLinear)
         .attr("stroke-dashoffset", 0);

      // Code for circular tool-tip
     var focus = g.append("g")
                  .attr("class", "focus")
                  .style("display", "none");

     focus.append("circle")
          .attr("r", 5);

      g.append("g")
       .append("rect")
       .data(radiationMeasurements[key.toString()].readings)
       .attr("class", "overlay")
       .attr("width", 974.817)
       .attr("height", lineInnerHeight)
       .attr("transform", "translate(100," + (lineInnerHeight * i) + ")")
       .style("fill", "white")
       .style("opacity", 0)
       .on("mouseover", function() { focus.style("display", null); })
       .on("mouseout", function() {
           focus.style("display", "none");
           toolTipDiv.transition()
                     .duration(500)
                     .style("opacity", 0)
        })
       .on("mousemove", function(d, idx) {
           var currentTimestamp = xScale.invert(d3.mouse(this)[0]); // get the current timestamp
           var sensorReading = radiationMeasurements[key.toString()].readings[d3.mouse(this)[0]];

           focus.attr("transform", "translate(" + (xScale(currentTimestamp) + 100) + "," + yScale(sensorReading) + ")");
           toolTipDiv.transition()
                     .duration(50)
                     .style("opacity", 1);

           var left = d3.event.pageX + 5;

           if (d3.event.pageX > window.screen.width) {
             left = left - 105;
           }

           toolTipDiv.html("<table><tbody><tr><td class='wide'>Timestamp: </td><td>" + currentTimestamp + "</td></tr>" +
                 "<tr><td>Radiation:</td><td>" + sensorReading + " </td></tr></tbody></table>")
                     .style("left", left + "px")
                     .style("top", (d3.event.pageY + 5) + "px");

       });

   });

}
