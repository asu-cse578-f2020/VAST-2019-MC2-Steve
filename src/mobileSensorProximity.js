// const SENSOR_ID = "Sensor-id";
// const LAT = "Lat";
// const LONG = "Long";
// const CO_ORDINATES = "Co-ordinates";



function mobileSensorProximity(mobileSensorId, mobileSensorProximitySVG, geoData, staticSensorLocations, staticSensorReadings, mobileSensorReadings)
{


    let mobileLineMargin, mobileLineWidth, mobileLineHeight, mobileLineInnerWidth, mobileLineInnerHeight, timeXScaleMobile, yScaleMobile;

    d3.selectAll(".proximity-mobileLine-and-dots").remove();
    // const margin = {top: 50, right: 50, bottom: 50, left: 50};
    // const height = 500 - margin.top - margin.bottom;
    // const width = 800 - margin.left - margin.right;

    d3.csv(`data/MobileProximityData/MobileProximityData_${mobileSensorId}.csv`, function(sensorData) {
    
        let g = mobileSensorProximitySVG.append("g")
                        .attr("class", "prox-mobile-sensor-curve");
        mobileLineMargin = { top: 20, right: 10, bottom: 20, left: 10 };
        mobileLineWidth = +mobileSensorProximitySVG.style('width').replace('px','') - 100;
        mobileLineHeight = 400;
        mobileLineInnerWidth = mobileLineWidth - mobileLineMargin.left - mobileLineMargin.right - 30;
        mobileLineInnerHeight = mobileLineHeight - mobileLineMargin.top - mobileLineMargin.bottom;


        var divTooltip = d3.select("body").append("div")
                .attr("class", "tooltip-donut")
                .style("opacity", 0)
                .style("z-index", 10000);
        

        // let staticSensorLocationMap = new Map();
        // //let sensorData = new Map();

        // staticSensorLocations.forEach(element => {
        //     staticSensorLocationMap.set(element[SENSOR_ID], [element[LONG], element[LAT]]);
        // });

        // staticSensorReadings = staticSensorReadings.map(e => {
        //     return {
        //         ...e,
        //         [CO_ORDINATES]: staticSensorLocationMap.get(e[SENSOR_ID]),
        //         [LAT]: staticSensorLocationMap.get(e[SENSOR_ID])[1],
        //         [LONG]: staticSensorLocationMap.get(e[SENSOR_ID])[0] 
        //     }
        // })
        // console.log(staticSensorReadings[0], mobileSensorReadings[0])

        //let sensorData=[];

        let baseMobileSensorReading = mobileSensorReadings.filter(d => d[SENSOR_ID]===mobileSensorId);
        // console.log("B4Base", baseMobileSensorReading);
        baseMobileSensorReading = baseMobileSensorReading.filter((d, idx) => idx%10==0);
        // console.log("AfterBase", baseMobileSensorReading);

        // let uniqSet = new Set();
        // mobileSensorReadings.forEach((d, idx)=>{
        //     uniqSet.add(d[SENSOR_ID])
        // })
        // console.log(Array.from(uniqSet))
        // baseMobileSensorReading.forEach((base) => {
        //     mobileSensorReadings.forEach((d, idx)=>{
        //         if(base[SENSOR_ID]!==d[SENSOR_ID] && getDistanceFromLatLonInKm([base[LONG], base[LAT]], [d[LONG], d[LAT]])<1)
        //         {
        //             sensorData.push(d);
        //         }
        //     })

        // })

        

    

        // console.log(sensorData.length);
        // mobileSensorReadings.forEach((d, idx)=>{
        //     if(getDistanceFromLatLonInKm(staticSensorLocationMap.get(mobileSensorId), [d[LONG], d[LAT]])<1)
        //     {
        //         sensorData.set(mobileSensorId, [...sensorData.get(mobileSensorId), d]);
        //     }
        // })

        var sumstat = d3.nest()
            .key(function(d) { return d[SENSOR_ID];})
            .entries(sensorData);

        // console.log(sumstat)

        // staticSensorReadings = staticSensorReadings.filter(e => e[SENSOR_ID]===mobileSensorId);

        drawAxis(mobileSensorProximitySVG);
        drawBaseLine(g, baseMobileSensorReading);
        drawVariableLines(g, sumstat);

        function drawAxis(mobileSensorProximitySVG)
        {
            timeXScaleMobile = d3.scaleTime()
                .domain([new Date(START_TIME),new Date(END_TIME)])
                .range([0,mobileLineInnerWidth]);

            // timeXScale.ticks(d3.timeMinute.every(15));

            const xAxis = d3.axisBottom(timeXScaleMobile)
                .ticks(d3.timeHour.every(4));

            mobileSensorProximitySVG.append("g")
                .style("color", "gray")
                .attr("transform", "translate(50," + (mobileLineInnerHeight) * 2 + ")")
                .call(xAxis);


            yScaleMobile = d3.scaleLinear()
                .domain([0, 100])
                .range([mobileLineInnerHeight, 0]);
                
            const yAxis = d3.axisLeft(yScaleMobile);

            mobileSensorProximitySVG.append("g")
                .attr("transform", "translate(50," + (mobileLineInnerHeight ) + ")")
                .style("color", "gray")
                .call(yAxis);
        }

        function drawVariableLines(g, sumstat)
        {
            // let colors = ["#3957ff", "#d3fe14", "#c9080a", "#fec7f8", "#0b7b3e", "#0bf0e9", "#c203c8", "#fd9b39", "#888593", "#906407", "#98ba7f", "#fe6794", "#10b0ff", "#ac7bff", "#fee7c0", "#964c63", "#1da49c", "#0ad811", "#bbd9fd", "#fe6cfe", "#297192", "#d1a09c", "#78579e", "#81ffad", "#739400", "#ca6949", "#d9bf01", "#646a58", "#d5097e", "#bb73a9", "#ccf6e9", "#9cb4b6", "#b6a7d4", "#9e8c62", "#6e83c8", "#01af64", "#a71afd", "#cfe589", "#d4ccd1", "#fd4109", "#bf8f0e", "#2f786e", "#4ed1a5", "#d8bb7d", "#a54509", "#6a9276", "#a4777a", "#fc12c9", "#606f15", "#3cc4d9", "#f31c4e", "#73616f", "#f097c6", "#fc8772", "#92a6fe", "#875b44", "#699ab3", "#94bc19", "#7d5bf0", "#d24dfe", "#c85b74", "#68ff57", "#b62347", "#994b91", "#646b8c", "#977ab4", "#d694fd", "#c4d5b5", "#fdc4bd", "#1cae05", "#7bd972", "#e9700a", "#d08f5d", "#8bb9e1", "#fde945", "#a29d98", "#1682fb", "#9ad9e0", "#d6cafe", "#8d8328", "#b091a7", "#647579", "#1f8d11", "#e7eafd", "#b9660b", "#a4a644", "#fec24c", "#b1168c", "#188cc1", "#7ab297", "#4468ae", "#c949a6", "#d48295", "#eb6dc2", "#d5b0cb", "#ff9ffb", "#fdb082", "#af4d44", "#a759c4", "#a9e03a", "#0d906b"]
            // console.log(colors.length)
            // let colorsPalette = d3.scaleSequential(d3.interpolateRdYlGn)
            for(let i=0;i<sumstat.length;i++)
            {
                let lineAndDots = g.append("g")
                    .attr("class", "proximity-mobileLine-and-dots")
                    .attr("transform", "translate(" + ((mobileLineMargin.left + mobileLineMargin.right) / 2) + "," + 0 + ")")

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
                lineAndDots.selectAll("mobile-line-circle")
                    .data(sumstat[i].values)
                    .enter().append("circle")
                        .on('mouseover', function(d, i) {
                            //console.log(d)
                            d3.select(this).transition()
                                .duration('50')
                                .attr('opacity', '.85');
                            divTooltip.transition()
                                .duration(50)
                                .style("opacity", 1);
                                divTooltip.html(`Mobile Sensor: ${d[SENSOR_ID]} | Value: ${d["Value"]}`)
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
                        .attr("class", "proximity-mobileLine-and-dots")
                        .attr("transform", "translate(50," + (mobileLineInnerHeight ) + ")")
                        .attr("class", "data-circle")
                        .attr("r", 1)
                        .style("fill", function(d, idx) {return colors[Number(d[SENSOR_ID])]; })
                        .attr("cx", function(d, idx) {return timeXScaleMobile(new Date(d["Timestamp"])); })
                        .attr("cy", function(d, idx) { return yScaleMobile(d["Value"]); } );
            }
        }

        function drawBaseLine(g, sensorReadings)
        {
            let lineAndDots = g.append("g")
                    .attr("class", "proximity-mobileLine-and-dots")
                    .attr("transform", "translate(" + ((mobileLineMargin.left + mobileLineMargin.right) / 2) + "," + 0 + ")")

                    // Data line
                    lineAndDots.append("path")
                        .attr("class", "proximity-mobileLine-and-dots")
                        .attr("transform", "translate(50," + (mobileLineInnerHeight ) + ")")
                        .datum(sensorReadings)
                        .attr("fill", "none")
                        .attr("stroke", "black")
                        .style("opacity", 1)
                        .attr("stroke-width", 1)
                        .attr("class", "data-line")
                        .attr("d", d3.line()
                                .x(function(d, idx) { return timeXScaleMobile(new Date(d["Timestamp"])); } )
                                .y(function(d, idx) { return yScaleMobile(d["Value"]); } ));

                // Data dots
                    // lineAndDots.selectAll("line-circle")
                    //     .data(sensorReadings)
                    //     .enter().append("circle")
                    //         .attr("transform", "translate(100," + (mobileLineInnerHeight ) + ")")
                    //         .attr("class", "data-circle")
                    //         .attr("r", 1.5)
                    //         .attr("cx", function(d, idx) {return timeXScaleMobile(new Date(d["Timestamp"])); })
                    //         .attr("cy", function(d, idx) { return yScaleMobile(d["Value"]); } );
        }

    })
    

}


