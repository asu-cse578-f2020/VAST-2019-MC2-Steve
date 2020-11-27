const SENSOR_ID = "Sensor-id";
const LAT = "Lat";
const LONG = "Long";
const CO_ORDINATES = "Co-ordinates";

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

    var xScale = d3.scaleBand()
        .range([ 0, width ])
        .domain([...regionMap.keys()])
        .padding(1);

    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale))
        .selectAll("text")
          .attr("transform", "translate(-10,0)rotate(-45)")
          .style("text-anchor", "end");

    var yScale = d3.scaleLinear()
          .domain([ 0, 10000 ])
          .range([ height, 0 ]);
    g.append("g")
          .call(d3.axisLeft(yScale));

    let regionFreqArray = Array.from(regionMap, ([name, value]) => ([name, value]));
    
    g.selectAll("myline")
        .data(regionFreqArray)
        .enter()
        .append("line")
            .attr("x1", d => xScale(d[0]))
            .attr("x2", d => xScale(d[0]))
            .attr("y1", d => yScale(d[1]))
            .attr("y2", yScale(0))
            .attr("stroke", "gray")

    g.selectAll("mycircle")
        .data(regionFreqArray)
        .enter()
        .append("circle")
            .attr("cx", d => xScale(d[0]))
            .attr("cy", d => yScale(d[1]))
            .attr("r", "10")
            .style("fill", "#69b3a2")
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .on("mouseover", function(d) {
              d3.select(this).attr("r", "15");
            })
            .on("mouseout", function(d) {
              d3.select(this).attr("r", "10");
            });

    return regionFreqArray;
}

function getNameFromGeoData(data)
{
  return data.properties.Name;
}
