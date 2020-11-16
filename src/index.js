
var geoData;

document.addEventListener('DOMContentLoaded', function() {  

    Promise.all([d3.json ("data/StHimark.json")]).then(data=>{
            geoData = data[0];
            draw();
    });

});

function draw()
{

    geoData.geometries.forEach((element, idx) => {
        if(d3.geoContains(element, [-13336289,17841]))
        {
            console.log(element, idx);
        }
    }); 
}

