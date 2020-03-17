function Doctor(id, imgUrl, slug, nameTitle, practicesArr, practicesTrueArr, specialtiesArr) {
  this.id = id;
  this.imgUrl = imgUrl;
  this.slug = slug;
  this.nameTitle = nameTitle;
  this.practicesArr = practicesArr;
  this.practicesTrueArr = practicesTrueArr;
  this.specialtiesArr = specialtiesArr;

  this.practicesTrueStr = returnLocationsString(this.practicesTrueArr);
  this.specialtiesDesc = returnSpecialtiesDescriptionString(this.specialtiesArr);
  this.specialtiesName = returnSpecialtiesNameString(this.specialtiesArr);
  this.makeMarkers = makeMarkers(this.practicesTrueArr);
}

function generateDoctorsArr(responseJson) {

  return responseJson.data.map((doctor, i) => {
    let regexBlankImgMan = new RegExp('general_doctor_male')
    let regexBlankImgFem = new RegExp('general_doctor_female')
    let patt = new RegExp(`${doctor.profile.image_url}`, "g");
    let imgUrl = !!regexBlankImgMan.test(patt)
      ? './assets/blank_male.png'
      : !!regexBlankImgFem.test(patt)
      ? './assets/blank_female.png'
      : doctor.profile.image_url;
    let slug = doctor.profile.slug;
    let nameTitle = doctor.profile.first_name + ' ' + doctor.profile.last_name + ' ' + doctor.profile.title;
    let practices = removeDuplicateLocations(doctor.practices);
    let practicesTrue = whereLocationTrue(practices);
    let specialtiesArr = doctor.specialties;

    return new Doctor(
      i,
      imgUrl,
      slug,
      nameTitle,
      practices,
      practicesTrue,
      specialtiesArr
    );

  })
}




// Doctor Helpers
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

function makeMarkers(practicesTrueArr) {
  //console.log('calling each doctor to make their practice markers'); //should log 30 times
  return practicesTrueArr.map(practice => {

    return new google.maps.Marker({
      position: {lat: practice.lat, lng: practice.lon},
      title: practice.name,
      icon: './assets/dnm-logo-sm-1.png',
      animation: google.maps.Animation.DROP
    });

  })

}

function makeYouMarker() {
  return new google.maps.Marker({
      position: {lat: paramsObj.lat, lng: paramsObj.lng},
      title: 'You',
      icon: './assets/dnm-logo-you-1.png',
      animation: google.maps.Animation.DROP
    });
}



