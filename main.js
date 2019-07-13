
//Global Results State
const paramsObj = { //global default 'state' of search params referenced in all API calls / param updates
    lat: 33.448376,
    lng: -112.074036,
    radius: 10,
    term: "heart"
};

//Helpers for Fetching APIs
function returnQueryString(params) {
    return Object.keys(params).map(key => {
        return `${encodeURIComponent(key)}=${params[key]}`;
    }).join('&');
}


// API Calls (utilize/update the global paramsObj)
function getAndSetParamsGeocode(address) {

    const geoCodeParams = {
        address: encodeURIComponent(address),
        key: config.gmaps
    }

    const urlRoot = 'https://maps.googleapis.com/maps/api/geocode/json?';
    const url = urlRoot + returnQueryString(geoCodeParams);

    return fetch(url)
      .then(response => {
          if (response.ok) {
              return response.json();
          }
          throw new Error(response.statusText);
      })
      .then( responseJson => {
          paramsObj.lat = responseJson.results[0].geometry.location.lat;
          paramsObj.lng = responseJson.results[0].geometry.location.lng;
      })
      .catch(err => {
          renderModal(returnMessageString(err.message));
      });
}

function handleFormSubmit(form) {
    $(`${form}`).on('submit', async (e) => {
        e.preventDefault();

        const address = $('#location').val();
        await getAndSetParamsGeocode(address);

        const selectEl = document.getElementById("search-radius");

        const radius = selectEl.options[selectEl.selectedIndex].value;
        paramsObj.radius = radius;

        paramsObj.term = $('#search-term').val();

        getBetterDoctor(form);
    });
}

function getBetterDoctor(form) {

        const betterDoctorParams = {
            query: paramsObj.term,
            location:   paramsObj.lat + ',' + paramsObj.lng + ',' + paramsObj.radius,
            user_location: paramsObj.lat + ',' + paramsObj.lng,
            sort: 'distance-asc',
            skip: 0,
            limit: 10,
            user_key: config.betterDoc
        };

        const rootUrl = 'https://api.betterdoctor.com/2016-03-01/doctors?';
        const url = rootUrl + returnQueryString(betterDoctorParams);

        fetch(url)
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error(response.statusText);
        })
        .then(responseJson => {
           $(`${form}`).css('display','none');
           renderResultsPage(responseJson);
        })
        .catch(err => {
          renderModal(returnMessageString(err.message));
        })

}


function renderResultsPage(responseJson) {
  console.log('global params at render>>>');
  console.log(paramsObj);
  // console.log('bd params at render>>>');
  // console.log(betterDoctorParams);
  console.log(responseJson);

  renderNavParams();
  renderListDoctors(responseJson);
}



// Nav Components
async function renderNavParams() {
  let formattedLocation = await getReverseGeocode(paramsObj.lat+','+paramsObj.lng);
  $('#nav-params').html(returnParamsNavString(formattedLocation));
  $('#nav-params').css('display', 'block');
}

 function returnParamsNavString(formattedLocation) {
    return `
      <div class="edit-params-container">
        <button id="edit-location" class="params-btn"><i class="fas fa-map-marker"></i>${formattedLocation}</button>
        <button id="edit-radius" class="params-btn"><i class="far fa-dot-circle"></i>${paramsObj.radius} mi</button>
        <button id="edit-search-term" class="params-btn"><i class="fas fa-search"></i>${paramsObj.term}</button>
      </div>
    `;
}

//Helper API Call returns city and state string for location edit nav button
function getReverseGeocode(latLngStr) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latLngStr}&key=${config.gmaps}`;

    return fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(responseJson => {
      const city = responseJson.results[4].address_components[1].long_name;
      const stateAbb = responseJson.results[4].address_components[3].short_name;
      return city + ', ' + stateAbb;
    })
    .catch(err => {
          renderModal(returnMessageString(err.message));
    });
}

// Result/Listing Components
function renderListDoctors(responseJson) {
  $('#list-doctors').html(returnListingsString(responseJson));
  $('#section-results').css('display', 'block');
}

function returnListingsString(responseJson) {
  return responseJson.data.map(doctor => {
    let fullNameTitle = doctor.profile.first_name + ' ' + doctor.profile.last_name + ' ' + doctor.profile.title;
    return `
      <li>
        <img class="avatar" src="${doctor.profile.image_url}" alt="${doctor.profile.slug}"></img>
        <h3>${fullNameTitle}</h3>
        <h5>${doctor.specialties[0].description} cnt.. ${doctor.specialties.length}</h5>
        <p>
          Locations Total (${doctor.practices.length}) <br>
          Locations Near You (${whereLocationTrue(doctor.practices).length}): <br>
          ${returnLocationsString(whereLocationTrue(doctor.practices))}
        </p>
        <span>${doctor.specialties[0].name}</span>
      </li>
    `;
  }).join('\n');
}

// Card Helpers
function whereLocationTrue(doctorPracticesArr) {
  return doctorPracticesArr.filter(function(obj) {
    return obj.within_search_area == true;
  });
}

function returnLocationsString(locationsArr) {
  return locationsArr.map(location => {
      let address = location.visit_address;
      return `<b>${location.name}</b>${address.street} ${address.city}, ${address.state} ${address.zip}<br>`;
  }).join('\n');
}


// Aside Modal Components
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

handleFormSubmit('#start-form');
