//global default search params for better docter api
const searchParams = {
    lat: 33.448376,
    lng: -112.074036,
    radius: 10,
    term: "heart"
}


function returnQueryString(paramsObj) {
    return Object.keys(paramsObj).map(key => {
        return `${encodeURIComponent(key)}=${paramsObj[key]}`;
    }).join('&');
}


function getGeocode() {
    // $('#step-one-btn').on('click', (e) => {
    //
    //     if ($('#location').val().length === 0) {
    //         renderModal(returnMessageString('Location cannot be blank'));
    //     } else {

            const geoCodeParams = {
                address: $('#location').val(),
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
                    //console.log(responseJson.results[0].geometry.location);
                    const lat = responseJson.results[0].geometry.location.lat;
                    const lng = responseJson.results[0].geometry.location.lng;
                    searchParams.lat = lat;
                    searchParams.lng = lng;
                    // console.log(searchParams.latLong);
                })
                .catch(err => {
                    // console.log(err.message);
                    renderModal(returnMessageString(err.message));
                });
    //     }
    // })
}



function getBetterDoctor() {
    $('#search-form').on('submit', (e) => {
        e.preventDefault();

        getGeocode();
        console.log($('#search-radius').val());

        const betterDoctorParams = {
            query: $('#search-term').val(),
            location:   searchParams.lat + ',' + searchParams.lng + ',' + $('#search-radius').val(),
            user_location: searchParams.lat + ',' + searchParams.lng,
            sort: 'distance-asc',
            skip: 0,
            limit: 100,
            user_key: config.betterDoc
        }

        const rootUrl = 'https://api.betterdoctor.com/2016-03-01/doctors?';
        const url = rootUrl + returnQueryString(betterDoctorParams);

        console.log(url);

    });
}




function renderModal(content) {
  $('#modal').css('display', 'block');
  $('#modal-content').html(
    `<span id="modal-close" class="close">Close <i class="far fa-times-circle"></i></span>` + '\n' + content
  );
  handleModalClose();
}

function handleModalClose() {
    $('#modal').on('click', '#modal-close', (e) => {
        $('#modal').css('display', 'none');
    });
}

function returnMessageString(message) {
    return `<h3 class="modal-message">${message}</h3>`;
}


// getGeocode();
getBetterDoctor();
