
//Global State and Map
const paramsObj = { //global default 'state' of search params referenced in all API calls / param updates
    lat: 33.448376,
    lng: -112.074036,
    radius: 10,
    term: "heart",
    formattedLocation: "",
    usersInputLocation: "",
    sort: 'distance-asc'
};

var map;



//Helpers for Fetching APIs
function returnQueryString(params) {
    return Object.keys(params).map(key => {
        return `${encodeURIComponent(key)}=${params[key]}`;
    }).join('&');
}


// API Calls (utilize/update the global paramsObj)
function getAndSetParamsGeocode(address) {
    //console.log(`getting geocode for ${address}`);
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
    $('#start-form').on('submit ', async (e) => {
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
            sort: paramsObj.sort,
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
          //console.log(form);
          if (form !== '#sort-order-form') {
            //console.log(`hiding ${form} `);
            $(`${form}`).css('display','none');
          }
          console.log(`rendering search results`);
          renderResultsPage(responseJson);
        })
        .catch(err => {
          renderModal(returnMessageString(err.message));
        })

}


async function renderResultsPage(responseJson) {
  // console.log('global params at render>>>');
  // console.log(paramsObj);
  // console.log('responseJson at render >>>');
  // console.log(responseJson);

  await renderNavParams();
  handleEditLocationButton();
  handleEditRadiusButton();
  handleEditSearchTermButton();



  renderThisForm(returnEditSearchTermFormString());
  hideOtherEditForms('#edit-search-term-form', '#edit-search-term-btn');
  handleEditSearchTermForm();

  listenToOrderFormIcon();


  $('#listings-title').text(
    `"${paramsObj.term}" Doctors Found Near ${paramsObj.formattedLocation} `
   );


  $('#listings-count-and-order-description').html(
    `Showing <span>${responseJson.data.length}</span> out of a total of <span>${responseJson.meta.total}</span>
    medical professionals containing the term <span>${paramsObj.term}</span> ${returnlistingsDescriptionTail()}`
  );

  const doctors = generateDoctorsArr(responseJson);
  renderListDoctors(doctors);

  initMap();
  renderDoctorMarkers(doctors);



  $('footer').css('display', 'block');
}


// Result/Listing Components

function returnlistingsDescriptionTail() {
    if (paramsObj.sort == 'distance-asc') {
      return `in order of locations closest to you.`;
    } else if (paramsObj.sort == 'best-match-asc') {
      return `in order of best match`;
    }
}


function renderListDoctors(doctors) {
  console.log(`rendering List of doctors...`);
  $('#list-doctors').html(returnListingsString(doctors));
  $('#section-results').css('display', 'block');
}



function listenToFormIcons() {
  const icons = $('.edit-params-form').find('span.before-content');

  $(icons).on('click', function(e) {
    const targetInput = $(this).closest('form').find('input');
    targetInput.trigger('focus');

    const targetSelect = $(this).closest('form').find('select');
    const targetSelectOptions = $(this).closest('form').find('option');
    selectDropdownExtension(targetSelect, targetSelectOptions);
    icons.css('z-index', 22);
  });
}

function listenToOrderFormIcon() {
  const icons = $('#sort-order-form').find('i.before-content');

  $(icons).on('click', function(e) {

    const targetSelect = $(this).closest('form').find('select');

    const targetSelectOptions = $(this).closest('form').find('option');
    selectDropdownExtension(targetSelect, targetSelectOptions);
    icons.css('z-index', 22);
  });
}

    //Helper for select element expansion, use within event
function selectDropdownExtension(targetSelect, targetSelectOptions) {
  let pxHeight = (targetSelectOptions.length * 26) + 'px';
    targetSelect.css('z-index', 22);
    targetSelect.attr('size', targetSelectOptions.length);
    targetSelect.css({height: pxHeight });
    targetSelectOptions.css({padding: '4px'});
    targetSelectOptions.on('click', function() {
      targetSelect.attr('size', 1);
      targetSelect.css({height: "40px"});
      targetSelect.css('z-index', 20);
    });
}



// Nav Components
async function renderNavParams() {
  //console.log('rendering nav with reverse geo name');
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
    // console.log(`calling reverse geocode for ${latLngStr}`);
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
function handleChangeSortedBy() {
  $('#sort-order').on('change', function(e) {
    e.preventDefault();
    //console.log(`${$(this)} #sort-order select was CHANGED, setting params and submitting form`);

    const selectEl = document.getElementById("sort-order");
    const sortMethod = selectEl.options[selectEl.selectedIndex].value;
    paramsObj.sort = sortMethod;

    getBetterDoctor('#sort-order-form');
  });
}

function renderThisForm(formString) {
  $('#edit-form-container').html(formString);
}

function handleEditLocationButton() {
  $('#edit-location-btn').on('click' , function(e) {
    e.preventDefault();
    // console.log(`${$(this).attr('id')} was CLICKED, exposing form`);

      $(this).toggleClass('active-edit');

      renderThisForm(returnEditLocationFormString());

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
        <input id="edit-location-input" class="add-before location-input" aria-label="Update Location" type="text" placeholder="City & State or Zipcode" >
        <button type="submit" class="submit-btn">Go</button>
      </div>
    </form>
  `;
}

function handleEditLocationForm() {
  listenToFormIcons();
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
      //console.log(`${$(this).attr('id')} was CLICKED, exposing form`);

      $(this).toggleClass('active-edit');

      renderThisForm(returnEditRadiusFormString());

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
          <option value="10" selected="selected">10 miles</option>
          <option value="25">25 miles</option>
          <option value="50">50 miles</option>
        </select>
        <button type="submit" class="submit-btn">Go</button>
      </div>
    </form>
  `;
}

function handleEditRadiusForm() {
  listenToFormIcons();
  $('#edit-radius-form').on('submit', (e) => {
    e.preventDefault();
    //console.log(`${$(this)} #edit-radius-form was SUBMITTED, calling getbetterdoctor function`);

    const selectEl = document.getElementById("edit-radius");
    const radius = selectEl.options[selectEl.selectedIndex].value;
    paramsObj.radius = radius;
    getBetterDoctor('#edit-radius-form');

  })
}

function handleEditSearchTermButton() {
  $('#edit-search-term-btn').on('click', function(e) {
    e.preventDefault();
    //console.log(`${$(this).attr('id')} was CLICKED, exposing form`);

      $(this).toggleClass('active-edit');

      renderThisForm(returnEditSearchTermFormString());

      hideOtherEditForms('#edit-search-term-form', '#edit-search-term-btn');

      handleEditSearchTermForm();
  })
}

function returnEditSearchTermFormString() {
  return `
    <form id="edit-search-term-form" class="edit-params-form" autocomplete="off">
      <span class="before-content">
        <i class="fas fa-search before-content"></i>
      </span>
      <div class="flex">
        <div class="autocomplete">
          <input id="edit-search-term-input" class="add-before term-input" aria-label="Type of doctor or area of issue" placeholder="Type of doctor or area of issue" required>
        </div>
       <button type="submit" class="submit-btn">Go</button>
      </div>
    </form>
  `;
}

function handleEditSearchTermForm() {
  listenToFormIcons();
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
      // $(thisForm).slideDown(100, function() {
      //   $(thisForm).find('input').val('');
      // });
      $(thisForm).find('input').val('');
      $(thisForm).css('display', 'block');
  }
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
function listenToStartFormStepIntro() {

  $('#start-form').on('click ', '#step-intro-btn', function(e) {
  // $('#step-one-btn').on('click keydown', function(e) {

    //console.log(e.code);


      $('#step-intro').css({
        transform: 'translateY(-150vh)'
      });
      $('#step-one').addClass('active-fieldset');
      $('#step-one').removeAttr('disabled');
      // setTimeout(function() { $('#step-one').css({height: 0, padding: 0})}, 500);
      setTimeout(function() { $('#step-intro').addClass('done-fieldset')}, 500);

      listenToStartFormStepOne();

  });
}

function listenToStartFormStepOne() {

  $('#start-form').on('click ', '#step-one-btn', function(e) {
  // $('#step-one-btn').on('click keydown', function(e) {

    e.preventDefault();

    if ( $('#location').val().length === 0 || $('#location').val() === ' ') {
      renderModal(returnMessageString('You must enter an address, city & state, or zipcode.'));
    } else {
      $('#step-one').css({
        transform: 'translateY(-150vh)'
      });
      $('#step-two').addClass('active-fieldset');
      $('#step-two').removeAttr('disabled');
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
      $('#step-three').removeAttr('disabled');

      setTimeout(function() { $('#step-two').addClass('done-fieldset')}, 500);

      listenToStartFormStepThree()
  });
}

function listenToStartFormStepThree() {
  $('#start-form-submit-btn').on('click ', function(e) {
    e.preventDefault();
    if ( $('#search-term').val().length === 0 || $('#search-term').val() === ' ') {
      renderModal(returnMessageString(`You must enter a search term to find the right type of medical professional.`));
    } else {
      handleStartFormSubmit();
      $('#start-form').submit();
      $(this).unbind();
    }
  });

  $('#search-term').on('keydown', function(e) {
    if (e.keyCode == 13) {
      e.preventDefault();
      return false;
    }

  });

}


//Map!!!!

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: paramsObj.lat, lng: paramsObj.lng},
    zoom: determineZoom()
    // gestureHandling: 'greedy'
  });

}

function determineZoom() {
  if (Number(paramsObj.radius) <= 10 ) {
    return 11;
  } else {
    return 9;
  }
}

function renderDoctorMarkers(doctors) {
    doctors.forEach(doctor => {
      doctor.makeMarkers.forEach(marker => {
        marker.setMap(map);
        listenToMarker(doctor, marker);
      });
    });
}

function listenToMarker(doctor, marker) {
  google.maps.event.addListener(marker, 'click', (function(marker) {
    return function() {
      // infowindow.setContent(doctor.nameTitle);
      // infowindow.open(map, marker);
      renderModal(returnMessageString(doctor.nameTitle));
    }
  })(marker));

}


listenToStartFormStepIntro();
handleChangeSortedBy();


