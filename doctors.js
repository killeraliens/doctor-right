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
  this.specialtiesName = returnSpecialtiesNameString(this.specialtiesArr)
  this.makeMarkers = makeMarkers(this.practicesTrueArr);
}

function generateDoctorsArr(responseJson) {

  return responseJson.data.map((doctor, i) => {
    // console.log('making a NEW Doctor..');
    let imgUrl = doctor.profile.image_url;
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
  //console.log(practicesTrueArr);
  return practicesTrueArr.map(practice => {

    return new google.maps.Marker({
      position: {lat: practice.lat, lng: practice.lon},
      title: practice.name,
      // draggable: true,
      animation: google.maps.Animation.DROP
    });
    //console.log({position: practice.lat+ ',' + practice.lon, title: practice.name})

  })

}



