
//Global Results State
const paramsObj = { //global default 'state' of search params referenced in all API calls / param updates
    lat: 33.448376,
    lng: -112.074036,
    radius: 10,
    term: "heart",
    formattedLocation: "",
    usersInputLocation: ""
};

//Helpers for Fetching APIs
function returnQueryString(params) {
    return Object.keys(params).map(key => {
        return `${encodeURIComponent(key)}=${params[key]}`;
    }).join('&');
}


// API Calls (utilize/update the global paramsObj)
function getAndSetParamsGeocode(address) {
    console.log(`getting geocode for ${address}`);
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
          renderModal(returnMessageString(`
            Sorry, we are having a hard time finding a location for "${paramsObj.usersInputLocation}".
            You can re-enter your city & state or zipcode in the top menu to find doctors closest to you.
          `));
      });
}

function handleStartFormSubmit() {
    $('#start-form').on('submit', async (e) => {
        e.preventDefault();
        console.log('handling start form submit');

        const address = $('#location').val();
        paramsObj.usersInputLocation = $('#location').val();
        await getAndSetParamsGeocode(address);

        const selectEl = document.getElementById("search-radius");
        const radius = selectEl.options[selectEl.selectedIndex].value;
        paramsObj.radius = radius;

        paramsObj.term = $('#search-term').val();

        getBetterDoctor('#start-form');
    });
}

function getBetterDoctor(form) {
        console.log('calling better doctor api');
        const betterDoctorParams = {
            query: paramsObj.term,
            location:   paramsObj.lat + ',' + paramsObj.lng + ',' + paramsObj.radius,
            user_location: paramsObj.lat + ',' + paramsObj.lng,
            sort: 'distance-asc',
            skip: 0,
            limit: 30,
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
          console.log(`hiding ${form} and rendering results page`);
          $(`${form}`).css('display','none');
          renderResultsPage(responseJson);
        })
        .catch(err => {
          renderModal(returnMessageString(err.message));
        })

}


async function renderResultsPage(responseJson) {
  console.log('global params at render>>>');
  console.log(paramsObj);
  console.log('responseJson at render >>>');
  console.log(responseJson);

  await renderNavParams();
  handleEditLocationButton();
  handleEditRadiusButton();
  handleEditSearchTermButton();

  injectThisForm(returnEditSearchTermFormString());
  hideOtherEditForms('#edit-search-term-form', '#edit-search-term-btn');
  handleEditSearchTermForm();


  $('#listings-title').text(
    `"${paramsObj.term}" Doctors Found Near ${paramsObj.formattedLocation} `
   );
  $('#listings-count-and-order-description').html(
    `Showing <span>${responseJson.data.length}</span> out of a total of <span>${responseJson.meta.total}</span>
    medical professionals containing the term <span>${paramsObj.term}</span> in order of locations closest to you.`
  );
  renderListDoctors(responseJson);
}



// Nav Components
async function renderNavParams() {
  console.log('rendering nav with reverse geo name');
  let formattedLocation = await getReverseGeocode(paramsObj.lat+','+paramsObj.lng);
  paramsObj.formattedLocation = formattedLocation;
  $('#nav-params').html(returnParamsNavString(formattedLocation));
  $('#nav-params').css('display', 'block');
}

function returnParamsNavString(formattedLocation) {
    return `
        <button id="edit-location-btn" class="params-btn"><i class="fas fa-map-marker"></i>${formattedLocation}</button>
        <button id="edit-radius-btn" class="params-btn"><i class="far fa-dot-circle"></i>${paramsObj.radius} mi</button>
        <button id="edit-search-term-btn" class="params-btn active-edit"><i class="fas fa-search"></i>${paramsObj.term}</button>
    `;
}

//Helper API Call returns city and state string for location edit nav button
function getReverseGeocode(latLngStr) {
    console.log(`calling reverse geocode for ${latLngStr}`);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latLngStr}&key=${config.gmaps}`;

    return fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .then(responseJson => {
      if (responseJson.results.length > 0) {
        const correctObj = responseJson.results[0];
        const addressComponentArr = correctObj.address_components;
        const correctObjCorrectComponent = findCityInReverseGeocodeResults(addressComponentArr);
        // console.log(correctObjCorrectComponent);
        const cityLocalityNeighborhood = correctObjCorrectComponent.long_name;

        return cityLocalityNeighborhood;
      } else {
        return paramsObj.usersInputLocation;
      }
    })
    .catch(err => {
          renderModal(returnMessageString(err.message));
    });
}

function findCityInReverseGeocodeResults(addressComponentArr) {
  return addressComponentArr.find(obj => {
    return (obj.types[0] == 'locality') || (obj.types[0] == 'political');
  })
}


// Nav Actions
function injectThisForm(formString) {
  $('#edit-form-container').html(formString);
}

function handleEditLocationButton() {
  $('#edit-location-btn').on('click' , function(e) {
    e.preventDefault();
    console.log(`${$(this).attr('id')} was CLICKED, exposing form`);

      $(this).toggleClass('active-edit');

      injectThisForm(returnEditLocationFormString());

      hideOtherEditForms('#edit-location-form', '#edit-location-btn');
      handleEditLocationForm();
  });
}

function returnEditLocationFormString() {
  return `
    <form id="edit-location-form" class="edit-params-form ">
      <span class="before-content">
        <i class="fas fa-map-marker before-content"></i>
      </span>
      <div class="flex">
        <input id="edit-location-input" class="add-before location-input" aria-label="Edit your location" type="text" placeholder="City & State or Zipcode" >
        <button type="submit" class="submit-btn">Set Location</button>
      </div>
    </form>
  `;
}

function handleEditLocationForm() {
  $('#edit-location-form').on('submit', async (e) => {
    e.preventDefault();


      console.log(`${$(this)} #edit-location-form was SUBMITTED, calling getbetterdoctor function`);
    if ($('#edit-location-input').val() !== '') {

      const address = $('#edit-location-input').val();
      await getAndSetParamsGeocode(address);
      getBetterDoctor('#edit-location-form');
    } else {
      renderModal(returnMessageString('You must enter a location'));
    }
  })
}

function handleEditRadiusButton() {
  $('#edit-radius-btn').on('click', function(e) {
    e.preventDefault();
      console.log(`${$(this).attr('id')} was CLICKED, exposing form`);

      $(this).toggleClass('active-edit');

      injectThisForm(returnEditRadiusFormString());

      hideOtherEditForms('#edit-radius-form', '#edit-radius-btn');
      handleEditRadiusForm();
  })
}

function returnEditRadiusFormString() {
  return `
    <form id="edit-radius-form" class="edit-params-form ">
      <span class="before-content">
        <i class="far fa-dot-circle before-content"></i>
      </span>
      <div class="flex">
        <select name="edit-radius" id="edit-radius" class="add-before radius-input">
          <option value="5">5 miles</option>
          <option value="10">10 miles</option>
          <option value="25">25 miles</option>
          <option value="50">50 miles</option>
        </select>
        <button type="submit" class="submit-btn">Update Distance</button>
      </div>
    </form>
  `;
}

function handleEditRadiusForm() {
  $('#edit-radius-form').on('submit', (e) => {
    e.preventDefault();
    console.log(`${$(this)} #edit-radius-form was SUBMITTED, calling getbetterdoctor function`);

    const selectEl = document.getElementById("edit-radius");
    const radius = selectEl.options[selectEl.selectedIndex].value;
    paramsObj.radius = radius;
    getBetterDoctor('#edit-radius-form');

  })
}

function handleEditSearchTermButton() {
  $('#edit-search-term-btn').on('click', function(e) {
    e.preventDefault();
    console.log(`${$(this).attr('id')} was CLICKED, exposing form`);

      $(this).toggleClass('active-edit');

      injectThisForm(returnEditSearchTermFormString());

      hideOtherEditForms('#edit-search-term-form', '#edit-search-term-btn');
      handleEditSearchTermForm();
  })
}

function returnEditSearchTermFormString() {
  return `
    <form id="edit-search-term-form" class="edit-params-form">
      <span class="before-content">
        <i class="fas fa-search before-content"></i>
      </span>
      <div class="flex">
       <input id="edit-search-term-input" class="add-before term-input" placeholder="Search specialties" required>
       <button type="submit" class="submit-btn">Find Doctors</button>
      </div>
    </form>
  `;
}

function handleEditSearchTermForm() {
  $('#edit-search-term-form').on('submit', (e) => {
    e.preventDefault();

    if ($('#edit-search-term').val() !== '') {
      console.log(`${$(this)} #edit-search-term-form was SUBMITTED, calling getbetterdoctor function`);

      paramsObj.term = $('#edit-search-term-input').val();
      getBetterDoctor('#edit-search-term-form');
    } else {
      renderModal(returnMessageString('You must enter a specialty keyword to search'));
    }

  })
}


function hideOtherEditForms(thisForm, thisBtn) {
  const otherForms = $('.edit-params-form').not($(thisForm));
  const otherBtns = $('.params-btn').not($(thisBtn));
  if ($(thisBtn).hasClass('active-edit')) {
      $(otherBtns).removeClass('active-edit');
      $(otherForms).find('input').val('');
      $(otherForms).css('display', 'none');
      $(thisForm).slideDown(300, function() {
        $(thisForm).find('input').val('');
      });
  }
}

// Result/Listing Components
function renderListDoctors(responseJson) {
  console.log(`rendering List of doctors...`);

  $('#list-doctors').html(returnListingsString(responseJson));
  $('#section-results').css('display', 'block');
}

function returnListingsString(responseJson) {
   console.log(`making li strings for each doctor`);
  return responseJson.data.map(doctor => {
    let fullNameTitle = doctor.profile.first_name + ' ' + doctor.profile.last_name + ' ' + doctor.profile.title;
    let practices = removeDuplicateLocations(doctor.practices);
    let specialtiesArr = doctor.specialties;
    return `
      <li class="doctor-card">
        <img class="avatar" src="${doctor.profile.image_url}" alt="${doctor.profile.slug}"></img>
        <h3>${fullNameTitle}</h3>
        <p>${returnSpecialtiesDescriptionString(specialtiesArr)}</p>
        <h5>Total practices for this professional (${practices.length})</h5>
        <h5>Locations within your search radius (${whereLocationTrue(practices).length})</h5>
        ${returnLocationsString(whereLocationTrue(practices))}
        <span>${returnSpecialtiesNameString(specialtiesArr)}</span>
      </li>
    `;
  }).join('\n');
}

// Card Helpers
function removeDuplicateLocations(doctorPracticesArr) {
  let dict = {};
  let reject = [];
  let keep = [];
  for (let i = 0; i < doctorPracticesArr.length; i++) {
    if (doctorPracticesArr[i].visit_address.street in dict ) {
       reject.push(doctorPracticesArr[i]);
    } else {
      dict[doctorPracticesArr[i].visit_address.street] = 1;
      keep.push(doctorPracticesArr[i]);
    }
  }
  return keep;
}

function whereLocationTrue(doctorPracticesArr) {
  return doctorPracticesArr.filter(function(obj) {
    return obj.within_search_area == true;
  });
}

function returnLocationsString(locationsArr) {
  return locationsArr.map(location => {
      let address = location.visit_address;
      let phonesArr = location.phones;
      return `
        <p><b>${location.name}</b><br>${address.street} ${address.city}, ${address.state} ${address.zip}</p>
        <p>${formatPhones(phonesArr)}</p>
      `;
  }).join('\n');
}

function formatPhones(phonesArr) {
  return phonesArr.map(phone => {
    if(phone.type == 'landline') {
      return `<span><i class="fas fa-phone"></i>Tel</span> ${phone.number}<br>`;
    } else if (phone.type == 'fax') {
      return `<span><i class="fas fa-fax"></i>Fax</span> ${phone.number}<br>`;
    }
  }).join('\n');
}

function returnSpecialtiesDescriptionString(specialtiesArr) {
  return specialtiesArr.map(specialty => `${specialty.description}`).join(' ');
}

function returnSpecialtiesNameString(specialtiesArr) {
  return specialtiesArr.map(specialty => `${specialty.name}`).join(', ');
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


//Start Form Animation
function listenToStartFormStepOne() {
  $('#start-form').on('click', '#step-one-btn', function(e) {

    if ( $('#location').val().length === 0 || $('#location').val() === ' ') {
      renderModal(returnMessageString('You must enter an address, city & state, or zipcode.'));
    } else {
      $('#step-one').css({
        transform: 'translateY(-150vh)'
      });
      $('#step-two').addClass('active-fieldset');
      // setTimeout(function() { $('#step-one').css({height: 0, padding: 0})}, 500);
      setTimeout(function() { $('#step-one').addClass('done-fieldset')}, 500);

      listenToStartFormStepTwo();
    }
  });
}

function listenToStartFormStepTwo() {
  $('#start-form').on('click', '#step-two-btn', function(e) {


      $('#step-two').css({
        transform: 'translateY(-150vh)'
      });
      $('#step-three').addClass('active-fieldset');
      // setTimeout(function() { $('#step-one').css({height: 0, padding: 0})}, 500);
      setTimeout(function() { $('#step-two').addClass('done-fieldset')}, 500);

      listenToStartFormStepThree()
  });
}

function listenToStartFormStepThree() {
  $('#start-form-submit-btn').on('click', function(e) {
    e.preventDefault();
    if ( $('#search-term').val().length === 0 || $('#search-term').val() === ' ') {
      renderModal(returnMessageString(`You must enter a search term to find the right type of medical professional.`));
    } else {
      $('#start-form').submit();
    }
  });

}


listenToStartFormStepOne();
handleStartFormSubmit();
