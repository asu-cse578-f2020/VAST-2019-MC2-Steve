const SENSOR_ID = "Sensor-id";
const LAT = "Lat";
const LONG = "Long";
const CO_ORDINATES = "Co-ordinates";
const PETAL_PATH = "M0 0 C50 40 50 70 20 100 L0 85 L-20 100 C-50 70 -50 40 0 0";
const LEAF_PATH = "M0 15 C15 40 15 60 0 75 C-15 60 -15 40 0 15";
var xScaleBar;
var yScaleBarBar;

function drawBarChart(barChartSVG, geoData, staticSensorLocations, staticSensorReadings, mobileSensorReadings)
{

    // <script src="https://d3js.org/d3-color.v2.min.js"></script>
    // <script src="https://d3js.org/d3-interpolate.v2.min.js"></script>
    // <script src="https://d3js.org/d3-scale-chromatic.v2.min.js"></script>

    const margin = {top: 50, right: 10, bottom: 50, left: 40};
    const height = 500 - margin.top - margin.bottom;
    const width = 600 - margin.left - margin.right;

    let regionMap = new Map();
    let staticSensorLocationMap = new Map();

    geoData.features.forEach(element => {
        regionMap.set(getNameFromGeoData(element),0);
    });

    staticSensorLocations.forEach(element => {
        staticSensorLocationMap.set(element[SENSOR_ID], [element[LONG], element[LAT]]);
    });

    staticSensorReadings = staticSensorReadings.map(e => {
        return {
            ...e,
            [CO_ORDINATES]: staticSensorLocationMap.get(e[SENSOR_ID])
        }
    })

    staticSensorReadings.forEach(reading => {
        geoData.features.forEach(region => {
            if (d3.geoContains(region, reading[CO_ORDINATES]))
            {
                regionMap.set(getNameFromGeoData(region), regionMap.get(getNameFromGeoData(region))+1);
            }
        });
    });

    mobileSensorReadings.forEach(reading => {
        geoData.features.forEach(region => {
            if (d3.geoContains(region, [reading[LONG], reading[LAT]]))
            {
                regionMap.set(getNameFromGeoData(region), regionMap.get(getNameFromGeoData(region))+1);
            }
        });
    });

    let g = barChartSVG.append("g")
                       .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    xScaleBar = d3.scaleBand()
        .range([ 0, width ])
        .domain([...regionMap.keys()])
        .padding(1);

    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScaleBar))
        .selectAll("text")
          .attr("transform", "translate(-10,0)rotate(-45)")
          .style("text-anchor", "end");

    yScaleBar = d3.scaleLinear()
          .domain([ 0, 10000 ])
          .range([ height, 0 ]);
    g.append("g")
          .call(d3.axisLeft(yScaleBar));

    let regionFreqArray = Array.from(regionMap, ([name, value]) => ([name, value]));

    g.append("g")
     .attr("class", "radiation-lines")
        .selectAll("myline")
        .data(regionFreqArray)
        .enter()
        .append("line")
            .attr("id", d => { return "radiation-line-" + d[0].split(" ").join("-"); })
            .attr("x1", d => xScaleBar(d[0]))
            .attr("x2", d => xScaleBar(d[0]))
            .attr("y1", yScaleBar(0))
            .attr("y2", yScaleBar(0))
            .attr("stroke", "black")
            .transition()
                .duration(500)
                .attr("y1", function(d) { return yScaleBar(d[1]); });

    /*
    let c = "#69b3a2";
    g.append("g")
     .attr("class", "radiation-circles")
     .selectAll("mycircle")
     .data(regionFreqArray)
     .enter()
     .append("circle")
            .attr("cx", d => xScaleBar(d[0]))
            .attr("cy", d => yScaleBar(1))
            .attr("r", "0")
            .style("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .on("mouseover", function(d) {
              d3.select(this).attr("r", "15");
            })
            .on("mouseout", function(d) {
              d3.select(this).attr("r", "10");
            })
            .transition()
                .duration(750)
                .attr("cx", d => xScaleBar(d[0]) )
                .attr("cy", d => yScaleBar(d[1]) )
                .attr("r", "10");
    */

    g.append("g")
     .attr("class", "static-reading-petals")
     .selectAll("g.radiationPetals")
     .data(regionFreqArray)
     .enter()
     .append("path")
     .classed("radiationPetals", true)
     .attr("id", d => { return "static-radiation-petal-" + d[0].split(" ").join("-"); })
     .attr("d", LEAF_PATH)
     .attr("fill", "#4AB56D")
     .attr("stroke", "black")
     .style("stroke-width", 4.5)
     .attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(0)] + ")scale(0)rotate(324)"; })
     .transition()
         .duration(700)
         .attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(d[1])] + ")scale(0.3)rotate(144)"; });

   g.append("g")
    .attr("class", "mobile-reading-petals")
    .selectAll("g.radiationPetals")
    .data(regionFreqArray)
    .enter()
    .append("path")
    .classed("radiationPetals", true)
    .attr("id", d => { return "mobile-radiation-petal-" + d[0].split(" ").join("-"); })
    .attr("d", LEAF_PATH)
    .attr("fill", "#C70B0B")
    .attr("stroke", "black")
    .style("stroke-width", 4.5)
    .attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(0)] + ")scale(0)rotate(-36)"; })
    .transition()
        .duration(700)
        .attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(d[1])] + ")scale(0.3)rotate(216)"; });

    return regionFreqArray;
}

function getNameFromGeoData(data)
{
  return data.properties.Name;
}

function transitionLine(regionName) {

  // Toggle innovative view
  regionName = regionName.split(" ").join("-")
  let staticPetalID = "#static-radiation-petal-" + regionName;
  let mobilePetalID = "#mobile-radiation-petal-" + regionName;
  let radiationLine = "#radiation-line-" + regionName;

  d3.select(".radiation-lines").selectAll("line").attr("stroke-width", 0.15);
  d3.select(".static-reading-petals").selectAll("path").style("opacity", 0.15).attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(d[1])] + ")scale(0.3)rotate(144)"; });;
  d3.select(".mobile-reading-petals").selectAll("path").style("opacity", 0.15).attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(d[1])] + ")scale(0.3)rotate(216)"; });;

  d3.select(radiationLine)
    .attr("x1", d => xScaleBar(d[0]))
    .attr("x2", d => xScaleBar(d[0]))
    .attr("y1", yScaleBar(0))
    .attr("y2", yScaleBar(0))
    .attr("stroke", "black")
    .transition()
      .duration(700)
      .attr("y1", function(d) { return yScaleBar(d[1]); })
      .attr("stroke-width", 2);

  d3.select(staticPetalID)
    .attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(0)] + ")scale(0)rotate(384)"; })
    .transition()
      .duration(700)
      .attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(d[1])] + ")scale(0.6)rotate(144)"; })
      .style("opacity", 1);

  d3.select(mobilePetalID)
    .attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(0)] + ")scale(0)rotate(-196)"; })
    .transition()
      .duration(700)
      .attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(d[1])] + ")scale(0.6)rotate(216)"; })
      .style("opacity", 1);

}
