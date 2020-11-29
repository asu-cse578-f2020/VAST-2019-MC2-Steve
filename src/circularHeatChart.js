function drawCircularHeat(heat, regionID, geoData, mobileData, staticData) {

  regionData = geoData.features.filter(d => {
    return d.properties.Id == regionID;
  });

  /* Label data */
  var days = ['6th April 2020', '7th April 2020', '8th April 2020', '9th April 2020', '10th April 2020'];
  var dayData = [];
  var total = 0;
  var ctr = 0;
  var flag = 0;
  var currentHour = mobileData[0]['Timestamp'].split(" ")[1].split(":")[0];
  for (var i = 0; i < mobileData.length; i++) {
      if (d3.geoContains(regionData[0], [ mobileData[i]["Long"], mobileData[i]["Lat"] ])) {
        if (currentHour != mobileData[i]['Timestamp'].split(" ")[1].split(":")[0]) {
            if (flag == 1) {
                dayData.push(total / ctr);
                ctr = 1;
                total = parseFloat(mobileData[i]['Value']);
                flag = 0;
            }
            else {
              flag += 1;
              total += parseFloat(mobileData[i]['Value']);
              ctr += 1;
            }
            currentHour = mobileData[i]['Timestamp'].split(" ")[1].split(":")[0];

        } else {
            total += parseFloat(mobileData[i]['Value']);
            ctr += 1;
        }
      }
  }

  while (dayData.length < 60)
      dayData.push(0)

  var total = 0;
  var index = 0;
  var ctr = 0;
  var flag = 0;
  var currentHour = staticData[0]['Timestamp'].split(" ")[1].split(":")[0];
  for (var i = 0; i < staticData.length; i++) {
      if (d3.geoContains(regionData[0], [ staticData[i]["Long"], staticData[i]["Lat"] ])) {
        if (currentHour != staticData[i]['Timestamp'].split(" ")[1].split(":")[0]) {
            if (flag == 1) {
              var temp = dayData[index];
              temp += (total / ctr);
              dayData[index] = temp;
              index++;
              ctr = 1;
              total = parseFloat(staticData[i]['Value']);
              flag = 0;
            }
            else {
              total += parseFloat(staticData[i]['Value']);
              ctr += 1;
              flag += 1;
            }
            currentHour = staticData[i]['Timestamp'].split(" ")[1].split(":")[0];

        } else {
            total += parseFloat(staticData[i]['Value']);
            ctr += 1;
        }
    }
  }


  /* Create the chart */
  var chart = circularHeatChart()
      .segmentHeight(15)
      .innerRadius(15)
      .numSegments(5)
      .range(['white', 'blue'])
      .segmentLabels(days)
      .radialLabels([ "Midnight", "2am", "4am", "6am", "8am", "10am", "Midday", "2pm", "4pm", "6pm", "8pm", "10pm" ]);

  heat.selectAll('svg')
      .data([dayData])
      .enter()
      .append('svg')
      .call(chart);

  }  // end of drawCircularHeat function


function circularHeatChart() {

    var margin = { top: 20, right: 20, bottom: 20, left: 20 },
        innerRadius = 50,
        numSegments = 12,
        segmentHeight = 20,
        domain = null,
        range = ["white", "red"],
        accessor = function(d) { return d; },
        radialLabels = segmentLabels = [];

    function chart(selection) {
        selection.each(function(data) {
            var svg = d3.select(this);
            var div = d3.select("body").append("div")
                .attr("class", "tooltip-donut")
                .style("opacity", 0);
            var offset = innerRadius + Math.ceil(data.length / numSegments) * segmentHeight;
            g = svg.append("g")
                .classed("circular-heat", true)
                .attr("transform", "translate(" + parseInt(margin.left + offset) + "," + parseInt(margin.top + offset) + ")");

            var autoDomain = false;
            if (domain === null) {
                domain = d3.extent(data, accessor);
                autoDomain = true;
            }
            var color = d3.scaleLinear().domain(domain).range(range);
            if (autoDomain)
                domain = null;

            g.selectAll("path").data(data)
                .enter().append("path")
                .attr("d", d3.arc().innerRadius(ir).outerRadius(or).startAngle(sa).endAngle(ea))
                .attr("fill", function(d) { return color(accessor(d)); })
                .on('mouseover', function(d, i) {
                    d3.select(this).transition()
                        .duration('50')
                        .attr('opacity', '.85');
                    div.transition()
                        .duration(50)
                        .style("opacity", 1);
                    div.html(d)
                        .style("left", (d3.event.pageX + 10) + "px")
                        .style("top", (d3.event.pageY - 15) + "px");
                })
                .on('mouseout', function(d, i) {
                    d3.select(this).transition()
                        .duration('50')
                        .attr('opacity', '1');
                    div.transition()
                        .duration('50')
                        .style("opacity", 0);
                });


            // Unique id so that the text path defs are unique - is there a better way to do this?
            var id = d3.selectAll(".circular-heat").length;

            //Radial labels
            var lsa = 0.01; //Label start angle
            var labels = svg.append("g")
                .classed("labels", true)
                .classed("radial", true)
                .attr("transform", "translate(" + parseInt(margin.left + offset) + "," + parseInt(margin.top + offset) + ")");

            labels.selectAll("def")
                .data(radialLabels).enter()
                .append("def")
                .append("path")
                .attr("id", function(d, i) { return "radial-label-path-" + id + "-" + i; })
                .attr("d", function(d, i) {
                    var r = innerRadius + ((i + 0.2) * segmentHeight);
                    return "m" + r * Math.sin(lsa) + " -" + r * Math.cos(lsa) +
                        " a" + r + " " + r + " 0 1 1 -1 0";
                });

            labels.selectAll("text")
                .data(radialLabels).enter()
                .append("text")
                .append("textPath")
                .attr("xlink:href", function(d, i) { return "#radial-label-path-" + id + "-" + i; })
                .style("font-size", 0.6 * segmentHeight + 'px')
                .text(function(d) { return d; });

            //Segment labels
            var segmentLabelOffset = 2;
            var r = innerRadius + Math.ceil(data.length / numSegments) * segmentHeight + segmentLabelOffset;
            labels = svg.append("g")
                .classed("labels", true)
                .classed("segment", true)
                .attr("transform", "translate(" + parseInt(margin.left + offset) + "," + parseInt(margin.top + offset) + ")");

            labels.append("def")
                .append("path")
                .attr("id", "segment-label-path-" + id)
                .attr("d", "m0 -" + r + " a" + r + " " + r + " 0 1 1 -1 0");

            labels.selectAll("text")
                .data(segmentLabels).enter()
                .append("text")
                .append("textPath")
                .attr("xlink:href", "#segment-label-path-" + id)
                .attr("startOffset", function(d, i) { return i * 100 / numSegments + "%"; })
                .text(function(d) { return d; });
        });

    }

    /* Arc functions */
    ir = function(d, i) {
        return innerRadius + Math.floor(i / numSegments) * segmentHeight;
    }
    or = function(d, i) {
        return innerRadius + segmentHeight + Math.floor(i / numSegments) * segmentHeight;
    }
    sa = function(d, i) {
        return (i * 2 * Math.PI) / numSegments;
    }
    ea = function(d, i) {
        return ((i + 1) * 2 * Math.PI) / numSegments;
    }

    /* Configuration getters/setters */
    chart.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return chart;
    };

    chart.innerRadius = function(_) {
        if (!arguments.length) return innerRadius;
        innerRadius = _;
        return chart;
    };

    chart.numSegments = function(_) {
        if (!arguments.length) return numSegments;
        numSegments = _;
        return chart;
    };

    chart.segmentHeight = function(_) {
        if (!arguments.length) return segmentHeight;
        segmentHeight = _;
        return chart;
    };

    chart.domain = function(_) {
        if (!arguments.length) return domain;
        domain = _;
        return chart;
    };

    chart.range = function(_) {
        if (!arguments.length) return range;
        range = _;
        return chart;
    };

    chart.radialLabels = function(_) {
        if (!arguments.length) return radialLabels;
        if (_ == null) _ = [];
        radialLabels = _;
        return chart;
    };

    chart.segmentLabels = function(_) {
        if (!arguments.length) return segmentLabels;
        if (_ == null) _ = [];
        segmentLabels = _;
        return chart;
    };

    chart.accessor = function(_) {
        if (!arguments.length) return accessor;
        accessor = _;
        return chart;
    };

    return chart;
}
