
//Global State and Map
const paramsObj = { //global default 'state' of search params referenced in all API calls / param updates
    lat: 33.448376,
    lng: -112.074036,
    radius: 10,
    term: "heart",
    formattedLocation: "",
    usersInputLocation: "",
    sort: 'distance-asc',
    insuranceUid: "",
    insuranceName: "add insurance plan",
    insuranceOptions: []
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
    const geoCodeParams = {
        address: encodeURIComponent(address),
        key: config.geocode
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
          // console.log('geocode response', responseJson)
          paramsObj.lat = responseJson.results[0].geometry.location.lat;
          paramsObj.lng = responseJson.results[0].geometry.location.lng;
      })
      .catch(err => {
          // console.log('error in geocode', err)
          return renderModal(returnMessageString(`
            Sorry, we are having a hard time finding a location for "${paramsObj.usersInputLocation}".
            You can re-enter your city & state or zipcode in the top menu to find doctors closest to you.
          `));
      });
}

function handleStartFormSubmit() {
    $('#start-form').on('submit ', async (e) => {
        $(this).unbind();
        $(this).blur();

        e.preventDefault();

        const address = $('#location').val();
        paramsObj.usersInputLocation = $('#location').val();
        await getAndSetParamsGeocode(address);

        // const selectEl = document.getElementById("search-radius");
        // const radius = selectEl.options[selectEl.selectedIndex].value;
        // paramsObj.radius = radius;

        paramsObj.term = $('#search-term').val();

        getBetterDoctor('#start-form');
    });
}

function getBetterDoctor(form) {
  const betterDoctorParams = {};

  betterDoctorParams.query = paramsObj.term;
  if (paramsObj.insuranceName !== 'add insurance plan') {
    betterDoctorParams.insurance_uid = paramsObj.insuranceUid;
  }
  betterDoctorParams.location = paramsObj.lat + ',' + paramsObj.lng + ',' + paramsObj.radius;
  betterDoctorParams.user_location = paramsObj.lat + ',' + paramsObj.lng;
  betterDoctorParams.sort = paramsObj.sort;
  betterDoctorParams.skip = 0;
  betterDoctorParams.limit = 30;
  betterDoctorParams.user_key = config.betterDoc;


  const rootUrl = 'https://api.betterdoctor.com/2016-03-01/doctors?';
  const url = rootUrl + returnQueryString(betterDoctorParams);

  fetch(url)
  .then(response => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json();
  })
  .then(responseJson => {
    if (form !== '#sort-order-form') {
      $(`${form}`).css('display','none');
    }
    // console.log(`rendering search results`);
    renderResultsPage(responseJson);
  })
  .catch(err => {
    if (err.message) {
      renderModal(returnMessageString(err.message));
    }
    renderModal(returnMessageString("BetterDoctor API server error"))
  })
}


async function renderResultsPage(responseJson) {

  renderNavLogo()
  await renderNavParams();
  handleEditLocationButton();
  handleEditRadiusButton();
  handleEditSearchTermButton();
  handleEditInsuranceButton();


  renderThisForm(returnEditSearchTermFormString());
  hideOtherEditForms('#edit-search-term-form', '#edit-search-term-btn');
  handleEditSearchTermForm();


  renderResultsHeader(responseJson);
  listenToOrderFormIcon();

  const doctors = generateDoctorsArr(responseJson);
  renderListDoctors(doctors);

  initMap();
  renderDoctorMarkers(doctors);
  renderYouMarker();

  $('footer').css('display', 'block');
}


function returnlistingsDescriptionTail() {
    if (paramsObj.sort == 'distance-asc') {
      return `in order of locations closest to you.`;
    } else if (paramsObj.sort == 'best-match-asc') {
      return `in order of <span>best match</span>`;
    }
}


function renderResultsHeader(responseJson) {
  $('#listings-title').text(
    `'${paramsObj.term}' Doctors Found Near ${paramsObj.formattedLocation} `
   );

  $('#listings-count-and-order-description').html(
    `Showing <span>${responseJson.data.length}</span> out of a total of <span>${responseJson.meta.total}</span>
    medical professionals containing the term <span>${paramsObj.term}</span> ${returnlistingsDescriptionTail()}`
  );

  $('#section-results-header').css('display', 'block');
}


// Nav Components
function renderNavLogo() {
  const imgString = `
    <img id="loaded-bar-graphic" src="./assets/dnm-logo-bar.png" alt="doctor's near me logo">
  `
  $('#loaded-bar-graphic-container').html(imgString);
  $('#loaded-bar-graphic-container').css('display', 'flex ');
}

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
        <button id="edit-insurance-btn" class="params-btn"><i class="${returnPlusOrScript()}"></i>${paramsObj.insuranceName}</button>
    `;
}

function returnPlusOrScript() {
  if (paramsObj.insuranceName == 'add insurance plan') {
    return `fas fa-plus`;
  } else {
    return `far fa-times-circle`;
  }
}

function listenToInsuranceClose() {
  $('#edit-insurance-btn').has('.fa-times-circle').on('click', function(e) {
     // console.log('resetting insurance');
     paramsObj.insuranceName = 'add insurance plan';
     paramsObj.insuranceUid = '';
     $(this).html(`<i class="${returnPlusOrScript()}"></i>${paramsObj.insuranceName}`);
     getBetterDoctor('#edit-insurance-form');
  });
}

    //Helper APi Call to fill insurance provider select options
function getBetterDoctorInsuranceOptions() {
  const betterDoctorParams = {
      user_key: config.betterDoc
  };

  const rootUrl = 'https://api.betterdoctor.com/2016-03-01/insurances?';
  const url = rootUrl + returnQueryString(betterDoctorParams);

  fetch(url)
  .then(response => {
    if (response.ok) {
      return response.json();
    }
    throw new Error(response.statusText);
  })
  .then(responseJson => {
    paramsObj.insuranceOptions = setGlobalInsuranceOptions(responseJson.data);

  })
  .catch(err => {
    renderModal(returnMessageString(err.message));
  });

}

    //Helper API Call returns city and state string for location edit nav button
function getReverseGeocode(latLngStr) {
    // console.log(`calling reverse geocode for ${latLngStr}`);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latLngStr}&key=${config.geocode}`;

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

    //Helper for select element dropdown expansion, enables input icons to be clickable.
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


function handleChangeSortedBy() {
  $('#sort-order').on('change', function(e) {
    e.preventDefault();

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
        <div style="width: 100%">
          <label for="edit-location-input"><span class="visually-hidden">Edit Location</span>
            <input id="edit-location-input" class="add-before location-input" name="edit location" type="text" placeholder="City & State or Zipcode" >
          </label>
        </div>
        <button type="submit" class="submit-btn">Go</button>
      </div>
    </form>
  `;
}

function handleEditLocationForm() {
  listenToFormIcons();
  $('#edit-location-form').on('submit', async (e) => {
    e.preventDefault();


    // console.log(`${$(this)} #edit-location-form was SUBMITTED, calling getbetterdoctor function`);
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
        <div style="width: 100%">
          <label for="edit-radius"><span class="visually-hidden">Edit Search Radius</span>
            <select name="edit-radius" id="edit-radius" class="add-before radius-input">
              <option value="5">5 miles</option>
              <option value="10" selected="selected">10 miles</option>
              <option value="25">25 miles</option>
              <option value="50">50 miles</option>
            </select>
          </label>
        </div>
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
        <div style="width: 100%">
          <label for="edit-search-term-input"><span class="visually-hidden">Edit Search Term</span>
            <input id="edit-search-term-input" class="add-before term-input" name="edit search term" placeholder="Type of doctor or area of issue" required>
          </label>
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
      // console.log(`${$(this)} #edit-search-term-form was SUBMITTED, calling getbetterdoctor function`);

      paramsObj.term = $('#edit-search-term-input').val();
      getBetterDoctor('#edit-search-term-form');
    } else {
      renderModal(returnMessageString('You must enter a specialty keyword to search'));
    }

  })
}


function handleEditInsuranceButton() {
  listenToInsuranceClose();
  $('#edit-insurance-btn').on('click', function(e) {
    e.preventDefault();

    $(this).toggleClass('active-edit');

    renderThisForm(returnEditInsuranceFormString());

    hideOtherEditForms('#edit-insurance-form', '#edit-insurance-btn');


    handleEditInsuranceDatalistInput();
    handleEditInsuranceForm();

  })
}

function returnEditInsuranceFormString() {
  return `
    <form id="edit-insurance-form" class="edit-params-form ">
      <span class="before-content">
        <i class="fas fa-plus before-content"></i>
      </span>
      <div class="flex">
        <div style="width: 100%">
          <label for="edit-insurance"><span class="visually-hidden">Select Insurance with autocomplete</span></label>
          <input list="insuranceList" id="edit-insurance" />
          <label for="edit-insurance-select"><span class="visually-hidden">Select Insurance from options</span></label>
          <datalist id="insuranceList">
            <select id="edit-insurance-select">
              ${returnEditInsuranceOptionsString()}
            </select>
          </datalist>
          <input type="hidden" name="selected" id="edit-insurance-hidden"/>
        </div>
        <button type="submit" class="submit-btn">Go</button>
      </div>
    </form>
  `;
}

function returnEditInsuranceOptionsString() {
  return paramsObj.insuranceOptions.map(planObj => { return `<option data-value="${planObj.uid}">${planObj.name}</option>` }).join(`\n`);
}

async function setGlobalInsuranceOptions(responseData) {
  let insuranceCos = await [].concat(responseData);
  let insurancePlanArrs = insuranceCos.map(coObj => { return coObj.plans });
  let insurancePlans = [].concat.apply([], insurancePlanArrs);
  paramsObj.insuranceOptions = insurancePlans;
}

function handleEditInsuranceDatalistInput() {
      document.querySelector('input[list]').addEventListener('input', function(e) {
        let input = e.target,
          list = input.getAttribute('list'),
          options = document.querySelectorAll('#' + list + ' option'),
          hiddenInput = document.getElementById(input.getAttribute('id') + '-hidden'),
          inputValue = input.value;
        hiddenInput.value = inputValue;


        for(let i = 0; i < options.length; i++) {
            let option = options[i];

            if(option.innerText === inputValue) {
                hiddenInput.value = option.getAttribute('data-value');
                break;
            }
        }
      });
}

function handleEditInsuranceForm() {
  listenToFormIcons();
  if (navigator.userAgent.search("Safari") >= 0 && navigator.userAgent.search("Chrome") < 0 )
  {
     $('#edit-insurance').css({"display": "none"});
     $('#insuranceList').css({"display": "block"});
     $('#edit-insurance-form').on('submit', (e) => {
      e.preventDefault();
      let selectEl = document.getElementById("edit-insurance-select");
      paramsObj.insuranceName = selectEl.options[selectEl.selectedIndex].textContent;
      paramsObj.insuranceUid = selectEl.options[selectEl.selectedIndex].getAttribute("data-value");
      // console.log(paramsObj.insuranceUid);
      getBetterDoctor('#edit-insurance-form');
    });

  } else {
    $('#edit-insurance-form').on('submit', (e) => {
      e.preventDefault();

      if (isIncludedInGlobalInsurance($('#edit-insurance-hidden').val()) ) {
        paramsObj.insuranceName = $('#edit-insurance').val();
        paramsObj.insuranceUid = $('#edit-insurance-hidden').val();
        getBetterDoctor('#edit-insurance-form');
      } else {
        paramsObj.insuranceName = "add insurance plan";
        paramsObj.insuranceUid = "";
        renderModal(returnMessageString(`Sorry, we couldn't find a plan named '${$('#edit-insurance').val()}'`));
        $('#edit-insurance').val('');
      }

      function isIncludedInGlobalInsurance(submitVal) {
        for (let i = 0; i < paramsObj.insuranceOptions.length; i++) {
          if (paramsObj.insuranceOptions[i].uid == submitVal ) {
            return true;
          }
        }
        return false;
      }
    });
  }
}

function hideOtherEditForms(thisForm, thisBtn) {
  const otherForms = $('.edit-params-form').not($(thisForm));
  const otherBtns = $('.params-btn').not($(thisBtn));
  if ($(thisBtn).hasClass('active-edit')) {
      $(otherBtns).removeClass('active-edit');
      $(otherForms).find('input').val('');
      $(otherForms).css('display', 'none');
      $(thisForm).find('input').val('');
      $(thisForm).css('display', 'block');
  }
}



// Aside Modal Components
function renderModal(content) {
  $('#modal').css('display', 'block');
  $('#modal-content').html(
    `<span id="modal-close" class="close"> <img src="./assets/dnm-close-x.png" alt="" /> </span>` + '\n' + content
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

function renderListDoctors(doctorsArr) {
  // console.log(`rendering List of doctors...`);
  $('#list-doctors').html(returnListingsString(doctorsArr));
  $('#section-results').css('display', 'block');
  listenToCardLinks(doctorsArr);
}

function returnListingsString(doctorsArr) {
  return doctorsArr.map((doctor) => {
    return `
      <li class="card doctor-card" id="${doctor.id}">
        <div class="flex">
          <img class="avatar" src="${doctor.imgUrl}" alt="${doctor.slug}">
          <h3 class="card-expand-link">${doctor.nameTitle}<i class="fas fa-angle-double-right"></i></h3>
        </div>
        <p>${doctor.specialtiesDesc}</p>
        <a class="card-expand-link"><h5>Locations within your search radius (${doctor.practicesTrueArr.length})<i class=" fa fa-caret-right"></i></h5></a>
        <span>${doctor.specialtiesName}</span>
      </li>
    `;
  }).join('\n');
}

function listenToCardLinks(doctorsArr) {
  $('.card-expand-link').on('click', function(e) {
    let doctorId = $(this).closest('li').prop('id');
    let doctor = doctorsArr.find(obj => obj.id == doctorId);
    renderModal(returnDoctorCardFull(doctor));
  });
}

function returnDoctorCardFull(doctor) {
  return `
      <li class="card doctor-card-full">
        <img class="avatar" src="${doctor.imgUrl}" alt="${doctor.slug}"></img>
        <h3>${doctor.nameTitle}</h3>
        <p>${doctor.specialtiesDesc}</p>
        <h5>Total practices for this professional (${doctor.practicesArr.length})</h5>
        <h5>Locations within your search radius (${doctor.practicesTrueArr.length})<i class=" fa fa-caret-down"></i></h5>
        ${doctor.practicesTrueStr}
        <span>${doctor.specialtiesName}</span>
      </li>`;
}


//Start Form Animation
// function listenToStartFormStepIntro() {

//   $('#start-form').on('click ', '#step-intro-btn', function(e) {

//       $('#step-intro').css({
//         transform: 'translateY(-150vh)'
//       });
//       $('#step-one').addClass('active-fieldset');
//       $('#step-one').removeAttr('disabled');

//       setTimeout(function() { $('#step-intro').addClass('done-fieldset')}, 300);

//       listenToStartFormStepOne();
//       getBetterDoctorInsuranceOptions();

//   });
// }

function listenToStartFormStepOne() {

  $('#start-form').on('click ', '#step-one-btn', function(e) {
    e.preventDefault();

    if ( $('#location').val().length === 0 || $('#location').val() === ' ') {
      renderModal(returnMessageString('You must enter an address, city & state, or zipcode.'));
    } else {
      $('#step-one').css({
        transform: 'translateY(-150vh)'
      });
      $('#step-two').addClass('active-fieldset');
      $('#step-two').removeAttr('disabled');

      setTimeout(function() { $('#step-one').addClass('done-fieldset')}, 300);

      listenToStartFormStepTwo();
    }
  });
}

// function listenToStartFormStepTwo() {
//   $('#start-form').on('click ', '#step-two-btn', function(e) {
//
//
//       $('#step-two').css({
//         transform: 'translateY(-150vh)'
//       });
//       $('#step-three').addClass('active-fieldset');
//       $('#step-three').removeAttr('disabled');
//
//       setTimeout(function() { $('#step-two').addClass('done-fieldset')}, 500);
//
//       listenToStartFormStepThree()
//   });
// }

function listenToStartFormStepTwo() {
  $('#start-form-submit-btn').on('click ', function(e) {
    e.preventDefault();
    if ( $('#search-term').val().length === 0 || $('#search-term').val() === ' ') {
      renderModal(returnMessageString(`You must enter a search term to find the right type of medical professional.`));
    } else {
      e.preventDefault();
      handleStartFormSubmit();
      $('#start-form').submit();
      $(this).blur();
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


//Map
function initMap() {
  // console.log('making map');
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
    return 10;
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

function renderYouMarker() {
  let you = makeYouMarker();

  you.setMap(map);
}

function listenToMarker(doctor, marker) {
  google.maps.event.addListener(marker, 'click', (function(marker) {
    return function() {
      // console.log(marker.title)
      renderModal(returnDoctorCardFull(doctor));
    }
  })(marker));

}


//App
function startApp() {
  // getBetterDoctorInsuranceOptions();
  //listenToStartFormStepIntro();
  listenToStartFormStepOne();
  handleChangeSortedBy();
}


startApp();
