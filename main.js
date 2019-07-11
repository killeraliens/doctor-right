//global default search params for better docter api
const searchParams = {
    latLong: "33.448376, -112.074036",
    radius: "10",
    term: "heart"
}


function returnQueryString(paramsObj) {
    return Object.keys(paramsObj).map(key => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(paramsObj[key])}`;
    }).join('&');
}


function getGeocode() {
    $('#step-one-btn').on('click', (e) => {

        if ($('#location').val().length === 0) {
            // const address = 'phoenix';
            console.log($('#location').val() + ' this is zero');
            renderMissingFieldError('city & state or zipcode');
        } else {
            // const address = $('#location').val();
            console.log($('#location').val() + ' this has value');


            const address = $('#location').val();

            const geoCodeParams = {
                address: address,
                key: config.gmaps
            }

            const urlRoot = 'https://maps.googleapis.com/maps/api/geocode/json?';
            const url = urlRoot + returnQueryString(geoCodeParams);
            console.log(url);

            fetch(url)
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error(response.statusText);
                })
                .then( responseJson => {
                    // console.log(responseJson.results[0].geometry.location);
                    const lat = responseJson.results[0].geometry.location.lat;
                    const lng = responseJson.results[0].geometry.location.lng;
                    searchParams.latLong = lat + ',' + lng;
                    console.log(searchParams.latLong);
                })
        }
    })
}

function renderMissingFieldError(field) {
  $('#modal').css('display', 'block');
  $('#error-message').text(`Please enter ${field}`);
}

getGeocode();
