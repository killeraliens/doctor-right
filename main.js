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
            renderModal(returnMessageString('Location cannot be blank'));
        } else {

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
                    // console.log(responseJson.results[0].geometry.location);
                    const lat = responseJson.results[0].geometry.location.lat;
                    const lng = responseJson.results[0].geometry.location.lng;
                    searchParams.latLong = lat + ',' + lng;
                    console.log(searchParams.latLong);
                })
        }
    })
}

function renderModal(content) {
  $('#modal').css('display', 'block');
  $('#modal-content').html(
    `<span id="modal-close" class="close">Close <i class="far fa-times-circle"></i></span>` + '\n' + content
  );
  handleModalClose();
}

function returnMessageString(message) {
    return `<h3 class="modal-message">${message}</h3>`;
}

function handleModalClose() {
  $('#modal').on('click', '#modal-close', (e) => {
      $('#modal').css('display', 'none');
  });
}


getGeocode();
