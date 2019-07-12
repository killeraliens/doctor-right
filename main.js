
function returnQueryString(paramsObj) {
    return Object.keys(paramsObj).map(key => {
        return `${encodeURIComponent(key)}=${paramsObj[key]}`;
    }).join('&');
}


function getGeocode(address) {

    const geoCodeParams = {
        address: encodeURIComponent(address),
        key: config.gmaps
    }

    const urlRoot = 'https://maps.googleapis.com/maps/api/geocode/json?';
    const url = urlRoot + returnQueryString(geoCodeParams);

    return $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
      timeout: 3000
    });

}

function handleFormSubmit(form) {
    $(`${form}`).on('submit', (e) => {
        e.preventDefault();

        const paramsObj = {};

        const address = $('#location').val();

        getGeocode(address)
        .done(function(data) {
            //logs just fine! but after all the other logs.
            console.log(
              data.results[0].geometry.location.lat + ',' + data.results[0].geometry.location.lng
            );
            paramsObj.lat = data.results[0].geometry.location.lat;
            paramsObj.lng = data.results[0].geometry.location.lng;
        })
        .fail(function() {
              alert("Geocode API call blew it.");
        });

        const r = document.getElementById("search-radius");
        const radius = r.options[r.selectedIndex].value;
        paramsObj.radius = radius;

        paramsObj.term = $('#search-term').val();

        //lat and lng are undefined! Why????
        console.log(paramsObj);
        console.log(paramsObj.term);
        console.log(paramsObj.lat);
        console.log(paramsObj.lng);
        console.log(paramsObj.radius);

        // getBetterDoctor(paramsObj);
        //The getBetterDocter function below will be called as a final result of this form submittal.
        //It will return the data I really want.
        //but the paramsObject needs to be complete before passing it on!
    });
}

// function getBetterDoctor(paramsObj) {
//   uses to paramsObj to set new details and makes a final fetch call
// }


handleFormSubmit('#start-form');
