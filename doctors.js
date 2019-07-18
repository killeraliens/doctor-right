function Doctor(imgUrl, slug, nameTitle, practicesArr, practicesTrueArr, specialtiesArr) {
  this.imgUrl = imgUrl;
  this.slug = slug;
  this.nameTitle = nameTitle;
  this.practicesArr = practicesArr;
  this.practicesTrueArr = practicesTrueArr;
  this.specialtiesArr = specialtiesArr;

  this.practicesTrueStr = returnLocationsString(this.practicesTrueArr);
  this.specialtiesDesc = returnSpecialtiesDescriptionString(this.specialtiesArr);
  this.specialtiesName = returnSpecialtiesNameString(this.specialtiesArr)
  // this.practicesGeocodesArr = getGeodeOfPractices(this.practicesTrueArr);
}

// function generateDoctorsArr(responseJson) {
function returnListingsString(responseJson) {

  return responseJson.data.map(doctor => {
    console.log('making a NEW Doctor..')
    let imgUrl = doctor.profile.image_url;
    let slug = doctor.profile.slug;
    let nameTitle = doctor.profile.first_name + ' ' + doctor.profile.last_name + ' ' + doctor.profile.title;
    let practices = removeDuplicateLocations(doctor.practices);
    let practicesTrue = whereLocationTrue(practices);
    let specialtiesArr = doctor.specialties;
    // let practicesTrueStr = returnLocationsString(practicesTrue);
    // let specialtiesDescString = returnSpecialtiesDescriptionString(specialtiesArr);
    // let specialtiesNameString = returnSpecialtiesNameString(specialtiesArr);

    console.log(
    new Doctor(
      imgUrl,
      slug,
      nameTitle,
      practices,
      practicesTrue,
      specialtiesArr
    )
    );

  })
}

// function returnListingsString(responseJson) {
//    //console.log(`making li strings for each doctor`);
//   return responseJson.data.map(doctor => {
//     let fullNameTitle = doctor.profile.first_name + ' ' + doctor.profile.last_name + ' ' + doctor.profile.title;
//     let practices = removeDuplicateLocations(doctor.practices);
//     let specialtiesArr = doctor.specialties;
//     return `
//       <li class="doctor-card">
//         <img class="avatar" src="${doctor.profile.image_url}" alt="${doctor.profile.slug}"></img>
//         <h3>${fullNameTitle}</h3>
//         <p>${returnSpecialtiesDescriptionString(specialtiesArr)}</p>
//         <h5>Total practices for this professional (${practices.length})</h5>
//         <h5>Locations within your search radius (${whereLocationTrue(practices).length})</h5>
//         ${returnLocationsString(whereLocationTrue(practices))}
//         <span>${returnSpecialtiesNameString(specialtiesArr)}</span>
//       </li>
//     `;
//   }).join('\n');
// }

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
