const SENSOR_ID = "Sensor-id";
const LAT = "Lat";
const LONG = "Long";
const CO_ORDINATES = "Co-ordinates";
const PETAL_PATH = "M0 0 C50 40 50 70 20 100 L0 85 L-20 100 C-50 70 -50 40 0 0";
const LEAF_PATH = "M0 15 C15 40 15 60 0 75 C-15 60 -15 40 0 15";
const STATIC = "static";
const MOBILE = "mobile";
var xScaleBar;
var yScaleBarBar;
let transitionScale = d3.scaleLinear()
            .domain([ 0, 8000 ])
            .range([ 0, 1 ]);
let regionMap;

function drawBarChart(barChartSVG, geoData, staticSensorLocations, staticSensorReadings, mobileSensorReadings)
{

    const margin = {top: 50, right: 10, bottom: 50, left: 40};
    const height = 500 - margin.top - margin.bottom;
    const width = 600 - margin.left - margin.right;

    var divTooltip = d3.select("body").append("div")
                .attr("class", "tooltip-donut")
                .style("opacity", 0);

    regionMap = new Map();
    let staticSensorLocationMap = new Map();

    geoData.features.forEach(element => {
        regionMap.set(getNameFromGeoData(element),{[STATIC]: 0, [MOBILE]: 0});
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
                regionMap.set(getNameFromGeoData(region),  {...regionMap.get(getNameFromGeoData(region)), [STATIC]: regionMap.get(getNameFromGeoData(region))[STATIC]+1});
            }
        });
    });

    mobileSensorReadings.forEach(reading => {
        geoData.features.forEach(region => {
            if (d3.geoContains(region, [reading[LONG], reading[LAT]]))
            {
                regionMap.set(getNameFromGeoData(region), {...regionMap.get(getNameFromGeoData(region)), [MOBILE]: regionMap.get(getNameFromGeoData(region))[MOBILE]+1});
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
            .on('mouseover', function(d, i) {
                d3.select(this).transition()
                    .duration('50')
                    .attr('opacity', '.85');
                divTooltip.transition()
                    .duration(50)
                    .style("opacity", 1);
                    divTooltip.html(`${d[0]} | Static: ${d[1][STATIC]} | Mobile: ${d[1][MOBILE]}`)
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY - 15) + "px");
            })
            .on('mouseout', function(d, i) {
                d3.select(this).transition()
                    .duration('50')
                    .attr('opacity', '1');
                divTooltip.transition()
                    .duration('50')
                    .style("opacity", 0);
            })
            .attr("id", d => { return "radiation-line-" + d[0].split(" ").join("-"); })
            .attr("x1", d => xScaleBar(d[0]))
            .attr("x2", d => xScaleBar(d[0]))
            .attr("y1", yScaleBar(0))
            .attr("y2", yScaleBar(0))
            .attr("stroke", "black")
            .transition()
                .duration(500)
                .attr("y1", function(d) { return yScaleBar(d[1][STATIC]+d[1][MOBILE]); });


    g.append("g")
     .attr("class", "static-reading-petals")
     .selectAll("g.radiationPetals")
     .data(regionFreqArray)
     .enter()
     .append("path")
     .on('mouseover', function(d, i) {
        d3.select(this).transition()
            .duration('50')
            .attr('opacity', '.85');
        divTooltip.transition()
            .duration(50)
            .style("opacity", 1);
            divTooltip.html(`${d[0]} | Static: ${d[1][STATIC]} | Mobile: ${d[1][MOBILE]}`)
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 15) + "px");
    })
    .on('mouseout', function(d, i) {
        d3.select(this).transition()
            .duration('50')
            .attr('opacity', '1');
        divTooltip.transition()
            .duration('50')
            .style("opacity", 0);
    })
     .classed("radiationPetals", true)
     .attr("id", d => { return "static-radiation-petal-" + d[0].split(" ").join("-"); })
     .attr("d", LEAF_PATH)
     .attr("fill", "#4AB56D")
     .attr("stroke", "black")
     .style("stroke-width", 4.5)
     .attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(0)] + ")scale(0)rotate(324)"; })
     .transition()
         .duration(700)
         .attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(d[1][STATIC]+d[1][MOBILE])] + ")scale("+transitionScale(d[1][STATIC])+")rotate(144)"; });

   g.append("g")
    .attr("class", "mobile-reading-petals")
    .selectAll("g.radiationPetals")
    .data(regionFreqArray)
    .enter()
    .append("path")
    .on('mouseover', function(d, i) {
        d3.select(this).transition()
            .duration('50')
            .attr('opacity', '.85');
        divTooltip.transition()
            .duration(50)
            .style("opacity", 1);
            divTooltip.html(`${d[0]} | Static: ${d[1][STATIC]} | Mobile: ${d[1][MOBILE]}`)
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 15) + "px");
    })
    .on('mouseout', function(d, i) {
        d3.select(this).transition()
            .duration('50')
            .attr('opacity', '1');
        divTooltip.transition()
            .duration('50')
            .style("opacity", 0);
    })
    .classed("radiationPetals", true)
    .attr("id", d => { return "mobile-radiation-petal-" + d[0].split(" ").join("-"); })
    .attr("d", LEAF_PATH)
    .attr("fill", "#C70B0B")
    .attr("stroke", "black")
    .style("stroke-width", 4.5)
    .attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(0)] + ")scale(0)rotate(-36)"; })
    .transition()
        .duration(700)
        .attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(d[1][STATIC]+d[1][MOBILE])] + ")scale("+transitionScale(d[1][MOBILE])+")rotate(216)"; });



    g.append("path").attr("d", LEAF_PATH).attr("transform", "translate(380,30)scale(0.5)rotate(-120)").style("fill", "#4AB56D")
    g.append("path").attr("d", LEAF_PATH).attr("transform", "translate(380,60)scale(0.5)rotate(-120)").style("fill", "#C70B0B")
    g.append("text").attr("x", 420).attr("y", 23).text("Static sensor").style("font-size", "15px").attr("alignment-baseline","middle")
    g.append("text").attr("x", 420).attr("y", 53).text("Mobile sensor").style("font-size", "15px").attr("alignment-baseline","middle")



    return regionFreqArray.map(d=>[d[0], d[1][STATIC]+d[1][MOBILE]]);
}

function getNameFromGeoData(data)
{
  return data.properties.Name;
}

function transitionLine(regionName) {


    // let xScaleBar = d3.scaleBand()
    //         .range([ 0,  550])
    //         .domain([...regionMap.keys()])
    //         .padding(1);



    // let yScaleBar = d3.scaleLinear()
    //     .domain([ 0, 10000 ])
    //     .range([ 400, 0 ]);

    // Toggle innovative view
    regionName = regionName.split(" ").join("-")
    let staticPetalID = "#static-radiation-petal-" + regionName;
    let mobilePetalID = "#mobile-radiation-petal-" + regionName;
    let radiationLine = "#radiation-line-" + regionName;

    d3.select(".radiation-lines").selectAll("line").attr("stroke-width", 0.15);
    d3.select(".static-reading-petals").selectAll("path").style("opacity", 0.15).attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(d[1][STATIC]+d[1][MOBILE])] + ")scale("+transitionScale(d[1][STATIC])+")rotate(144)"; });;
    d3.select(".mobile-reading-petals").selectAll("path").style("opacity", 0.15).attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(d[1][STATIC]+d[1][MOBILE])] + ")scale("+transitionScale(d[1][MOBILE])+")rotate(216)"; });;


    d3.select(radiationLine)
        .attr("x1", d => xScaleBar(d[0]))
        .attr("x2", d => xScaleBar(d[0]))
        .attr("y1", yScaleBar(0))
        .attr("y2", yScaleBar(0))
        .attr("stroke", "black")
        .transition()
        .duration(1000)
        .attr("y1", function(d) { return yScaleBar(d[1][STATIC]+d[1][MOBILE]); })
        .attr("stroke-width", 2);

    d3.select(staticPetalID)
        .attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(0)] + ")scale(1)rotate(384)"; })
        .transition()
        .duration(1000)
        .attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(d[1][STATIC]+d[1][MOBILE])] + ")scale("+transitionScale(d[1][STATIC])+")rotate(144)"; })
        .style("opacity", 1);

    d3.select(mobilePetalID)
        .attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(0)] + ")scale(1)rotate(0)"; })
        .transition()
        .duration(1000)
        .attr("transform", d => { return "translate(" + [xScaleBar(d[0]), yScaleBar(d[1][STATIC]+d[1][MOBILE])] + ")scale("+transitionScale(d[1][MOBILE])+")rotate(216)"; })
        .style("opacity", 1);

}

$("#show-leaves").on("click", function() {
  d3.select(".radiation-lines").selectAll("line").attr("stroke-width", 1);
  d3.select(".static-reading-petals").selectAll("path").style("opacity", 1);
  d3.select(".mobile-reading-petals").selectAll("path").style("opacity", 1);
});
