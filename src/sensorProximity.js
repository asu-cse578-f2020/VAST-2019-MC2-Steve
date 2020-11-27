// const SENSOR_ID = "Sensor-id";
// const LAT = "Lat";
// const LONG = "Long";
// const CO_ORDINATES = "Co-ordinates";
const START_TIME = "2020-04-06 00:00:00";
const END_TIME = "2020-04-10 23:54:00";

var lineMargin, lineWidth, lineHeight, lineInnerWidth, lineInnerHeight, timeXScale, yScale;
function sensorProximity(staticSensorId, sensorProximitySVG, geoData, staticSensorLocations, staticSensorReadings, mobileSensorReadings)
{
    // const margin = {top: 50, right: 50, bottom: 50, left: 50};
    // const height = 500 - margin.top - margin.bottom;
    // const width = 800 - margin.left - margin.right;
    console.log("asdf");

    let g = sensorProximitySVG.append("g")
                      .attr("class", "prox-static-sensor-curve");
    lineMargin = { top: 20, right: 10, bottom: 20, left: 10 };
    lineWidth = +sensorProximitySVG.style('width').replace('px','') - 100;
    lineHeight = 400;
    lineInnerWidth = lineWidth - lineMargin.left - lineMargin.right - 30;
    lineInnerHeight = lineHeight - lineMargin.top - lineMargin.bottom;

    let staticSensorLocationMap = new Map();
    let sensorData = new Map();

    staticSensorLocations.forEach(element => {
        staticSensorLocationMap.set(element[SENSOR_ID], [element[LONG], element[LAT]]);
    });

    sensorData.set(staticSensorId, []);

    mobileSensorReadings.forEach((d, idx)=>{
        if(getDistanceFromLatLonInKm(staticSensorLocationMap.get(staticSensorId), [d[LONG], d[LAT]])<1)
        {
            sensorData.set(staticSensorId, [...sensorData.get(staticSensorId), d]);
        }
    })

    var sumstat = d3.nest()
        .key(function(d) { return d[SENSOR_ID];})
        .entries(sensorData.get(staticSensorId));

    console.log(sensorData);
    console.log(sumstat)

    staticSensorReadings = staticSensorReadings.filter(e => e[SENSOR_ID]===staticSensorId);

    drawAxis(sensorProximitySVG);
    drawBaseLine(g, staticSensorReadings);
    drawVariableLines(g, sumstat);

    // d3.selectAll(".proximity-line-and-dots").remove();

}

function drawAxis(sensorProximitySVG)
{
    timeXScale = d3.scaleTime()
        .domain([new Date(START_TIME),new Date(END_TIME)])
        .range([0,lineInnerWidth]);

    // timeXScale.ticks(d3.timeMinute.every(15));

    const xAxis = d3.axisBottom(timeXScale)
        .ticks(d3.timeHour.every(4));

    sensorProximitySVG.append("g")
        .style("color", "gray")
        .attr("transform", "translate(50," + (lineInnerHeight) * 2 + ")")
        .call(xAxis);


    yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([lineInnerHeight, 0]);
    const yAxis = d3.axisLeft(yScale);

    sensorProximitySVG.append("g")
        .attr("transform", "translate(50," + (lineInnerHeight ) + ")")
        .style("color", "gray")
        .call(yAxis);
}

function drawVariableLines(g, sumstat)
{
    let colors = ["#3957ff", "#d3fe14", "#c9080a", "#fec7f8", "#0b7b3e", "#0bf0e9", "#c203c8", "#fd9b39", "#888593", "#906407", "#98ba7f", "#fe6794", "#10b0ff", "#ac7bff", "#fee7c0", "#964c63", "#1da49c", "#0ad811", "#bbd9fd", "#fe6cfe", "#297192", "#d1a09c", "#78579e", "#81ffad", "#739400", "#ca6949", "#d9bf01", "#646a58", "#d5097e", "#bb73a9", "#ccf6e9", "#9cb4b6", "#b6a7d4", "#9e8c62", "#6e83c8", "#01af64", "#a71afd", "#cfe589", "#d4ccd1", "#fd4109", "#bf8f0e", "#2f786e", "#4ed1a5", "#d8bb7d", "#a54509", "#6a9276", "#a4777a", "#fc12c9", "#606f15", "#3cc4d9", "#f31c4e", "#73616f", "#f097c6", "#fc8772", "#92a6fe", "#875b44", "#699ab3", "#94bc19", "#7d5bf0", "#d24dfe", "#c85b74", "#68ff57", "#b62347", "#994b91", "#646b8c", "#977ab4", "#d694fd", "#c4d5b5", "#fdc4bd", "#1cae05", "#7bd972", "#e9700a", "#d08f5d", "#8bb9e1", "#fde945", "#a29d98", "#1682fb", "#9ad9e0", "#d6cafe", "#8d8328", "#b091a7", "#647579", "#1f8d11", "#e7eafd", "#b9660b", "#a4a644", "#fec24c", "#b1168c", "#188cc1", "#7ab297", "#4468ae", "#c949a6", "#d48295", "#eb6dc2", "#d5b0cb", "#ff9ffb", "#fdb082", "#af4d44", "#a759c4", "#a9e03a", "#0d906b"]

    // let colorsPalette = d3.scaleSequential(d3.interpolateRdYlGn)
    for(let i=0;i<sumstat.length;i++)
    {
        let lineAndDots = g.append("g")
            .attr("class", "proximity-line-and-dots")
            .attr("transform", "translate(" + ((lineMargin.left + lineMargin.right) / 2) + "," + 0 + ")")

        // Data line
        // lineAndDots.append("path")
        //     .attr("class", "proximity-line-and-dots")
        //     .attr("transform", "translate(50," + (lineInnerHeight ) + ")")
        //     .datum(sumstat[i].values)
        //     .attr("fill", "none")
        //     .attr("stroke", colors[i])
        //     .attr("stroke-width", 0)
        //     .attr("class", "data-line")
        //     .attr("d", d3.line()
        //             .x(function(d, idx) { return timeXScale(new Date(d["Timestamp"])); } )
        //             .y(function(d, idx) { return yScale(d["Value"]); } ));

    // Data dots
        lineAndDots.selectAll("line-circle")
            .data(sumstat[i].values)
            .enter().append("circle")
                .attr("class", "proximity-line-and-dots")
                .attr("transform", "translate(50," + (lineInnerHeight ) + ")")
                .attr("class", "data-circle")
                .attr("r", 3)
                .style("fill", colors[i])
                .attr("cx", function(d, idx) {return timeXScale(new Date(d["Timestamp"])); })
                .attr("cy", function(d, idx) { return yScale(d["Value"]); } );
    }
}

function drawBaseLine(g, staticSensorReadings)
{
    let lineAndDots = g.append("g")
            .attr("class", "proximity-line-and-dots")
            .attr("transform", "translate(" + ((lineMargin.left + lineMargin.right) / 2) + "," + 0 + ")")

            // Data line
            lineAndDots.append("path")
                .attr("class", "proximity-line-and-dots")
                .attr("transform", "translate(50," + (lineInnerHeight ) + ")")
                .datum(staticSensorReadings)
                .attr("fill", "none")
                .attr("stroke", "black")
                .style("opacity", 1)
                .attr("stroke-width", 1)
                .attr("class", "data-line")
                .attr("d", d3.line()
                        .x(function(d, idx) { return timeXScale(new Date(d["Timestamp"])); } )
                        .y(function(d, idx) { return yScale(d["Value"]); } ));

        // Data dots
            // lineAndDots.selectAll("line-circle")
            //     .data(staticSensorReadings)
            //     .enter().append("circle")
            //         .attr("transform", "translate(100," + (lineInnerHeight ) + ")")
            //         .attr("class", "data-circle")
            //         .attr("r", 1.5)
            //         .attr("cx", function(d, idx) {return timeXScale(new Date(d["Timestamp"])); })
            //         .attr("cy", function(d, idx) { return yScale(d["Value"]); } );
}

function getDistanceFromLatLonInKm(point1,point2) {

    let lat1 = point1[1], lon1 = point1[0], lat2 = point2[1],lon2 = point2[0];
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1);
    var a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d;
  }

  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }
