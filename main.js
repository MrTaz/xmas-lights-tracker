const { createClient } = window.supabase
const _supabase = createClient('https://pfcjzaxjqkvlpzhlubky.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmY2p6YXhqcWt2bHB6aGx1Ymt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk5NDkyNTQsImV4cCI6MTk4NTUyNTI1NH0.CGjEaSAeqRMf4tMorQwJx_YIBjmMYTwpIILs3IwbpG8')
let map; //: google.maps.Map;
let mapInitialized = false;
let newMapMarkerCounter = -1;
let newMapMarkers = [];
let userMarker; //: google.maps.Marker
let activeInfoWindow;
let followTheUser = true;
let ALL_LOADED_HOUSES = null;

async function signInWithEmail() {
  const { data, error } = await _supabase.auth.signInWithOtp(()=>{
    if(!localStorage.email){
      const loginModal = new bootstrap.Modal(document.getElementById("#loginModal"));
      loginModal.show();
      loginModal.addEventListener('hidden.bs.modal', event => {
        // error = "User did not provide email address for login."
      });
    }
    let email = localStorage.email;
    let options = {
      emailRedirectTo: 'https://mrtaz.github.io/xmas-lights-tracker/',
    };
    return {email, options};
  })
}

function showError(error) {
  switch(error.code) {
    case error.PERMISSION_DENIED:
      console.error("User denied the request for Geolocation.");
      break;
    case error.POSITION_UNAVAILABLE:
      console.error("Location information is unavailable.");
      break;
    case error.TIMEOUT:
      console.error("The request to get user location timed out.");
      break;
    case error.UNKNOWN_ERROR:
      console.error("An unknown error occurred.");
      break;
  }
}
const preLoadAllHouses = async () => {
  let { data: selectHouses, error: selectError } = await _supabase.from('houses').select();
  if(selectError) console.warn("Error when selecting house:", selectError);
  console.log("select houses: ", selectHouses);
  ALL_LOADED_HOUSES = selectHouses;
}
async function loadData(){
  let { data: allHouses, error: selectError } = await _supabase.from('houses').select();
  if(selectError) console.warn("Error when selecting house:", selectError);
  // let allHouses = ALL_LOADED_HOUSES;
  allHouses.forEach(async (house, index)=>{
    console.log("House", house, index);

    if(!house.latlng){
      getlatLngFromAddress(house.full_address).then((latLng)=>{
        house.position = latLng;
        storeData(house);
        createMarker(latLng, house);
      }).catch((error)=>{
        console.warn("Failed to load latLng:", error);
      });
    }else{
      createMarker(house.latlng, house);
    }
  })
}

async function storeData(dataIn){
  console.log("Store this data:", dataIn);
  let data = newMapMarkers[dataIn.currentMarkerId] || dataIn;
  // let data = newMapMarkers.find(marker => {
  //   return marker.id === dataIn.currentMarkerId;
  // });
  console.log("Data in marker array:", data);

  if(data.house_number && data.street && data.city_town && data.state){
    //if loaded data and using dataIn, then we need to create the address object
    data.address = {
      house_number: data.house_number,
      street: data.street,
      city: data.city_town,
      state: data.state
    };
  }
  if(data.address.house_number && data.address.street && data.address.city && data.address.state){
    let st_address, city_town, state, full_address, house_num, street;
    house_num = data.address.house_number;
    street = data.address.street;
    st_address = `${data.address.house_number} ${data.address.street}`;
    city_town = data.address.city;
    switch(data.address.state){
      case "New Hampshire":
        state = "NH";
        break;
      case "Massachusetts":
        state = "MA";
        break;
      case "Maine":
        state = "ME";
        break;
    };
    full_address = `${st_address}, ${city_town} ${state}`;
    console.debug("looking for full address:", full_address);
    let { data: allHouses, error: selectError } = await _supabase.from('houses').select();
    if(selectError) console.warn("Error when selecting house:", selectError);
    console.log("select houses: ", allHouses);
    // let allHouses = ALL_LOADED_HOUSES;
    let foundFullAddress = allHouses.filter(obj => {
      return obj.full_address === full_address;
    });
    console.debug("If house found, foundFullAddress is ", foundFullAddress[0]);

    let title = (data.lightTitle)?data.lightTitle:(foundFullAddress[0] && foundFullAddress[0].title)?foundFullAddress[0].title:"";
    data.lightTitle = title;
    let type = (data.lightType)?data.lightType:(foundFullAddress[0] && foundFullAddress[0].type)?foundFullAddress[0].type:"Unknown";
    data.lightType = type;
    let radio = (data.lightRadio)?data.lightRadio:(foundFullAddress[0] && foundFullAddress[0].radio)?foundFullAddress[0].radio:"";
    data.lightRadio = radio;
    let liveDateUnformatted = new Date();
    let live_date = (data.liveDate)?data.liveDate:(foundFullAddress[0] && foundFullAddress[0].live_date)?foundFullAddress[0].live_date:liveDateUnformatted.toISOString().split('T')[0];
    data.lightRadio = radio;
    let latlng = (data.position)?data.position:await getlatLngFromAddress(house.full_address);
    let dataToInsert = { 
      street,
      house_num,
      full_address, 
      st_address,
      city_town,
      state,
      latlng,
      title,
      type,
      radio,
      live_date,
      updated_at: new Date()
    };

    if(foundFullAddress.length > 0){
      console.log("Data being updated: ", dataToInsert);
      const { data: updateData, error: updateError } = await _supabase.from('houses').update(dataToInsert).eq('id', foundFullAddress[0].id).select();
      if(updateError) console.warn("Error when Updating house:", updateError);
      console.log("updated house:", updateData);
      data.houseId = updateData[0].id;
    }else{
      console.log("Data being inserted: ", dataToInsert);
      const { data: insertData, error: insertError } = await _supabase.from('houses').insert([dataToInsert]).select();
      if(insertError) console.warn("Error when inserting house:", insertError);
      console.log("inserted house: ", insertData);
      data.houseId = insertData[0].id;
    }
  }
}
async function storeStarRating(houseId, dataIn){
  if(!houseId){
    return new Error("Invalid house id passed to star rating storage");
  }
  console.debug("Do we have a star rating?", dataIn.starRating);
  if(dataIn.starRating){
    console.debug("attempting to update star rating", dataIn.starRating);
    let startRatingDataToInsert = { }
    console.debug("Found a house to insert star rating", houseId);
    startRatingDataToInsert = {
      rating: dataIn.starRating,
      house_id: houseId
    }
    const { data: insertStarData, error: insertStarError } = await _supabase.from('ratings').insert([startRatingDataToInsert]).select();
    if(insertStarError) console.error("Error when inserting star data house:", insertStarError);
    console.log("Inserted rating: ", insertStarData);
  }else{
    return new Error("Invalid rating passed to star rating storage");
  }
}
async function loadAvgStarRating(houseId){
  if(!houseId){
    return new Error("Invalid house id passed to star rating storage");
  }
  let avgStarRating = 0;
  try{
    let { data: selectStarRatings, error: selectStarRatingsError } = await _supabase.from('ratings').select("rating").eq("house_id",houseId);
    if(selectStarRatingsError) throw new Error("Error when selecting star ratings:", selectStarRatingsError);
    console.log("Ratings found:", selectStarRatings);
    avgStarRating = Math.round(selectStarRatings.reduce((r, c) => r + c.rating, 0) / selectStarRatings.length);
  } catch (error){
    console.warn("Error when selecting star ratings:", error);
  }
  return avgStarRating;
}


//This function is inokved asynchronously by the HTML5 geolocation API.
function displayLocation(position) {
  // preLoadAllHouses().then(()=>{
    //The latitude and longitude values obtained from HTML 5 API.
    let latitude = position.coords.latitude;
    let longitude = position.coords.longitude;
    //console.log("Coords", longitude, latitude)
    //Creating a new object for using latitude and longitude values with Google map.
    let latLng = new google.maps.LatLng(latitude, longitude);
    //Also setting the latitude and longitude values in another div.
    let div = document.getElementById('location');
    div.innerHTML = 'You are at Latitude: ' + latitude + ', Longitude: ' + longitude;
    if(!mapInitialized){
      initMap(latLng);
      createMarker(latLng, "", true);
    }else{
      updateMarkerLocation(latLng);
    }
  // });
}

function getMyLocation() {
  if (navigator.geolocation) {
		//console.log("Getting your location...");
    //navigator.geolocation.getCurrentPosition(displayLocation, showError);
		navigator.geolocation.watchPosition(displayLocation, showError);
  } else {
    console.error('Oops, no geolocation support');
  }
}
function createFollowMeButton(map) {
  const controlButton = document.createElement("button");
  // Set CSS for the control.
  controlButton.style.backgroundColor = "green";
  controlButton.style.border = "0px solid #fff";
  controlButton.style.borderRadius = "25px";
  controlButton.style.boxShadow = "0 2px 6px rgba(0,0,0,.3)";
  controlButton.style.color = "white";
  controlButton.style.cursor = "pointer";
  controlButton.style.fontFamily = "Roboto,Arial,sans-serif";
  controlButton.style.fontSize = "16px";
  controlButton.style.lineHeight = "38px";
  controlButton.style.margin = "8px 0 22px";
  controlButton.style.padding = "0 5px";
  controlButton.style.textAlign = "center";
  controlButton.textContent = "Stop Following Santa";
  controlButton.title = "Click to stop following Santa";
  controlButton.type = "button";
  // Setup the click event listeners: simply set the map to Chicago.
  controlButton.addEventListener("click", () => {
    // map.setCenter(chicago);
    if(followTheUser){
      controlButton.textContent = "Follow Santa";
      controlButton.title = "Click to start following Santa";
      controlButton.style.backgroundColor = "red";
      followTheUser = false;
    }else{
      getMyLocation();
      controlButton.textContent = "Stop Following";
      controlButton.title = "Click to stop following Santa";
      controlButton.style.backgroundColor = "green";
      followTheUser = true;
    }
  });
  return controlButton;
}
function initMap(center) {
  map = new google.maps.Map(document.getElementById("map-canvas"), {
    center,
    zoom: 16
  });
  loadData();
  // Create the DIV to hold the control.
  const centerControlDiv = document.createElement("div");
  // Create the control.
  const centerControl = createFollowMeButton(map);
  // Append the control to the DIV.
  centerControlDiv.appendChild(centerControl);
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);
  mapInitialized = true;
	map.addListener("click", (mapsMouseEvent) => {
		createMarker(mapsMouseEvent.latLng);
	});
}
function updateMarkerLocation(latLng) {
  userMarker.setPosition(latLng);
  if(followTheUser){
    console.debug("Moving santa...", latLng);
    followUserMarkerLocation(latLng);
  }
}
function followUserMarkerLocation(latLng){
  // map.panTo(latLng);
  map.setCenter(latLng);
}


function createMarker(latLng, house, isUserMarker) {
	newMapMarkerCounter++;
  if (isUserMarker && !userMarker) {
    userMarker = new google.maps.Marker({
      position: latLng,
      map: map,
      animation: google.maps.Animation.DROP,
      clickable: false,
      icon: "./assets/santa-reindeer-icon.png",
      title: "You",
      id: newMapMarkerCounter
    });
    newMapMarkers.push(userMarker);
  } else {
    let markerOptions = {
      position: latLng,
      map: map,
      animation: google.maps.Animation.DROP,
      clickable: true,
      // draggable: true,
      id: newMapMarkerCounter
    };
    //Setting up the marker object to mark the location on the map canvas.
    let marker = new google.maps.Marker(markerOptions);
    if (house) {
      // marker.id = house.id;
      marker.houseId = house.id;
      marker.lightRadio = house.radio;
      marker.lightTitle = house.title;
      marker.title = house.title;
      marker.lightType = house.type;
      marker.hours = house.hours;
      marker.weblink = house.web_link;
      marker.address =  {
        city: house.city_town,
        house_num: house.house_num,
        state: house.state,
        street: house.street
      };

      // let content = placeResult.name+'<br/>'+placeResult.vicinity+'<br/>'+placeResult.types;
      // addInfoWindow(marker, latLng, content);
      // newMapMarkers.push(marker);

      loadAvgStarRating(marker.houseId).then((avgStarRating)=>{
        avgStarRating = (avgStarRating)?avgStarRating:0;
        let removeMakerLink = `<a href="#" onclick='removeMarker(${newMapMarkerCounter});'>Remove marker</a>`;

        let content = `Loaded location: <br/>
          ${marker.address.house_num} ${marker.address.street}, <br/>
          ${marker.address.city}, ${marker.address.state} <br/>
          <p>${removeMakerLink}</p>
          ${getStarComponent(newMapMarkerCounter, avgStarRating)}
          ${inputForm(newMapMarkerCounter)}`;
      
        newMapMarkers.push(marker);
        addInfoWindow(marker, latLng, content, true);
      });
    } else { 
      // console.log(`Receieved latLng:`, latLng.lat(), latLng.lng());
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latLng.lat()}&lon=${latLng.lng()}&namedetails=1`)
        .then((response) => response.json())
        .then(async (data) => {
          marker.address = {
            house_num: data.address.house_number,
            street: data.address.road,
            city: data.address.village,
            state: data.address.state
          };
          newMapMarkers.push(marker);
          //this will populate the marker with the attributes from the db
          await storeData({...data.address,"currentMarkerId":newMapMarkerCounter});

          let avgStarRating = await loadAvgStarRating(newMapMarkers[newMapMarkerCounter].houseId) || 0;
          let removeMakerLink = `<a href="#" onclick='removeMarker(${newMapMarkerCounter});'>Remove marker</a>`;

          let content = `Adding location: <br/>
            ${marker.address.house_num} ${marker.address.street}, <br/>
            ${marker.address.city}, ${marker.address.state} <br/>
            <p>${removeMakerLink}</p>
            ${getStarComponent(newMapMarkerCounter, avgStarRating)}
            ${inputForm(newMapMarkerCounter)}`;
          
          addInfoWindow(marker, latLng, content);
        }); 
    }
  }
}
async function getlatLngFromAddress(address){
  return fetch('https://nominatim.openstreetmap.org/search?format=json&q='+address)
  .then((response)=>response.json())
  .then(async (data) => {
    console.debug("Retrieved lat lng: ", data);
    let latLng = null;
    if(data[0]){
      latLng = new google.maps.LatLng(data[0].lat, data[0].lon);
    }
    return latLng;
  }).catch((error)=>{
    console.warn("Error looking up latLng:", error);
  });
}
function inputForm(markerId){
  const loadedHouse = newMapMarkers.find(marker => {
    return marker.id === markerId;
  });
	let inputFormHtml = `<form id="entry-form-${markerId}" action="">
      <div class="form-group">
        <input type="text" class="form-control form-control-xs" value="${(loadedHouse.lightTitle)?loadedHouse.lightTitle:""}" placeholder="Enter Title  or none" id="title-${markerId}" />
      </div>
      <div class="form-group">
        <input type="text" class="form-control form-control-xs" value="${(loadedHouse.lightRadio)?loadedHouse.lightRadio:""}" placeholder="Enter Radio  Station" id="radio-${markerId}" />
      </div>
      <div class="light-types pt-0 pb-1">
        <div class="row">
          <div class="col-12"><small>Selected type:<span id="selected-type-${markerId}">${loadedHouse.lightType}</span></small></div>
        </div>
        <div class="row">
          <div class="col">
            <input id="type-flat-${markerId}" type="radio" name="type-${markerId}" value="Flat" ${loadedHouse.lightType==="Flat"?"Checked":""}/>
            <label class="light-type type-flat" for="type-flat-${markerId}"></label>
          </div>
          <div class="col">
            <input id="type-musical-${markerId}" type="radio" name="type-${markerId}" value="Musical" ${loadedHouse.lightType==="Musical"?"Checked":""}/>
            <label class="light-type type-musical" for="type-musical-${markerId}"></label>
          </div>
          <div class="col">
            <input id="type-commercial-${markerId}" type="radio" name="type-${markerId}" value="Commercial" ${loadedHouse.lightType==="Commercial"?"Checked":""}/>
            <label class="light-type type-commercial" for="type-commercial-${markerId}"></label>
          </div>
          <div class="col">
            <input id="type-animated-${markerId}" type="radio" name="type-${markerId}" value="Animated" ${loadedHouse.lightType==="Animated"?"Checked":""}/>
            <label class="light-type type-animated" for="type-animated-${markerId}"></label>
          </div>
        </div>
      </div>
      <div class="optional-types pt-0 pb-1">
        <dir class="row align-items-center row-cols-4 mb-0">
          <div class="col my-auto">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" id="opt-gb-${markerId}">
              <label class="form-check-label" for="opt-gb-${markerId}">Gingerbread</label>
            </div>
          </div>
          <div class="col my-auto">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" id="opt-bm-${markerId}">
              <label class="form-check-label" for="opt-bm-${markerId}">Blow Models</label>
            </div>
          </div>
          <div class="col my-auto">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" id="opt-if-${markerId}">
              <label class="form-check-label" for="opt-if-${markerId}">Inflatables</label>
            </div>
          </div>
          <div class="col my-auto">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" id="opt-p-${markerId}">
              <label class="form-check-label" for="opt-p-${markerId}">Projection</label>
            </div>
          </div>
          <div class="col my-auto">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" id="opt-m-${markerId}">
              <label class="form-check-label" for="opt-m-${markerId}">Movie</label>
            </div>
          </div>
          <div class="col my-auto">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" id="opt-ia-${markerId}">
              <label class="form-check-label" for="opt-ia-${markerId}">Interactive</label>
            </div>
          </div>
          <div class="col my-auto">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value="" id="opt-l-${markerId}">
              <label class="form-check-label" for="opt-l-${markerId}">Lasers</label>
            </div>
          </div>
        </div>
      </div>
      <div class="form-group">
        <input type="text" class="form-control form-control-xs" value="${(loadedHouse.weblink)?loadedHouse.weblink:""}" placeholder="Enter Web Link" id="web-link-${markerId}" />
      </div>
      <div class="form-group">
        <input type="text" class="form-control form-control-xs" value="${(loadedHouse.hours)?loadedHouse.hours:""}" placeholder="Enter Hours" id="hours-${markerId}" />
      </div>
      <div class="form-group">
        <label for="notes-${markerId}">Notes/Charity Details</label>
        <textarea class="form-control" id="notes-${markerId}" rows="3"></textarea>
      </div>
		</form>`;
	return inputFormHtml;
}
function getFormSubmission(markerId){
  console.log("adding form submission listeners...");
  const entry_form = document.getElementById(`entry-form-${markerId}`);
  entry_form.addEventListener("input", (event)=>{
    console.log("Input event recieved", event);
    // newMapMarkers[markerId].title = e.target.value;
    // storeData({"currentMarkerId":markerId});
  });
  const form_title = document.getElementById(`title-${markerId}`);
  form_title.addEventListener("input", (event)=>{
    newMapMarkers[markerId].lightTitle = event.target.value;
    storeData({"currentMarkerId":markerId});
  });
  const form_radio = document.getElementById(`radio-${markerId}`);
  form_radio.addEventListener("input", (event)=>{
    newMapMarkers[markerId].lightRadio = event.target.value;
    storeData({"currentMarkerId":markerId});
  });
  document.querySelectorAll(`input[name='type-${markerId}']`).forEach((input) => {
    input.addEventListener("change", (event)=>{
      document.getElementById(`selected-type-${markerId}`).innerText = event.target.value;
      newMapMarkers[markerId].lightType = event.target.value;
      storeData({"currentMarkerId":markerId});
    });
  });
}
function getStarComponent(markerId, avgStarRating){
	let starHtml = `<div id="rating-el-${markerId}">
		<div class="row">
			<div class="col-lg-12">
				<div class="star-rating text-center pt-2">
					<span class="bi bi-${(avgStarRating<=1)?"star":"star-fill"}" data-rating="1"></span>
					<span class="bi bi-${(avgStarRating<=2)?"star":"star-fill"}" data-rating="2"></span>
					<span class="bi bi-${(avgStarRating<=3)?"star":"star-fill"}" data-rating="3"></span>
					<span class="bi bi-${(avgStarRating<=4)?"star":"star-fill"}" data-rating="4"></span>
					<span class="bi bi-${(avgStarRating<=5)?"star":"star-fill"}" data-rating="5"></span>
					<input type="hidden" name="rating-value" class="rating-value" value="${avgStarRating}">
				</div>
			</div>
		</div>
	</div>`;
	return starHtml;
}
function setRatingStar(markerId){
	const star_rating = document.getElementById(`rating-el-${markerId}`);
	const starComponent = star_rating.querySelector(".star-rating");
	const starRatingInput = star_rating.querySelector(".rating-value");
	let rating = starRatingInput.value;

	const resetTabIndex = () => {
		starComponent.childNodes.forEach((star) => {
      star.tabIndex = -1;
    });
  }
	const activate = (element) => {
    resetTabIndex();
    element.tabIndex = 0;
    element.focus();
  }
	const changeRating = (newRating) => {
    rating = newRating;
		starRatingInput.value = rating;
    newMapMarkers[markerId].starRating = rating;
    storeStarRating(newMapMarkers[markerId].houseId, {"starRating":rating,"currentMarkerId":markerId});
  }
	const getRating = () => {
    return rating;
  }
	const renderRating = (rating) => {
		for (let index = 0; index < rating; index++) {
			starComponent.children[index].classList.add("bi-star-fill");
			starComponent.children[index].classList.remove("bi-star");
		}
		for (let index = rating; index < 5; index++) {
			starComponent.children[index].classList.remove("bi-star-fill");
			starComponent.children[index].classList.add("bi-star");
		}
	}
	
	star_rating.addEventListener("click", (event)=>{
		let star = event.target ?? event;
    let isStar = star.classList.contains("bi");
    if (isStar) { 
      activate(star);
      let { rating } = star.dataset;
      if(event.key!=='Tab' && rating === getRating()){
        rating = 0;
        resetTabIndex();
        starComponent.firstElementChild.tabIndex = 0; 
      }
      changeRating(rating);
      renderRating(rating);
    }
	});
	star_rating.addEventListener("mouseover", (event)=>{
		let isStar = event.target.classList.contains("bi");
    if (isStar) {
      const { rating } = event.target.dataset;
      renderRating(rating);
    }
	});
	star_rating.addEventListener("mouseout", (event)=>{
    renderRating(rating);
	});
	star_rating.addEventListener("load", async (event)=>{
    renderRating(rating);
	});
};

async function removeMarker(markerId){
  console.log("attempting to remove marker", markerId);
  // let foundMarker = newMapMarkers[markerId];
  // foundMarker.lightType = "CANCELLED";
  newMapMarkers[markerId].lightType = "CANCELLED";
	newMapMarkers[markerId].infoWindow.close();
	newMapMarkers[markerId].infoWindow = null; 
  google.maps.event.clearListeners(newMapMarkers[markerId], 'click');
  newMapMarkers[markerId].setMap(null);
  await storeData({"currentMarkerId":markerId});
}

function addInfoWindow(marker, latLng, content, doNotOpenWindow) {
  let infoWindowOptions = {
    content: content,
    position: latLng
  };
	
  marker.infoWindow = new google.maps.InfoWindow(infoWindowOptions);

  if (activeInfoWindow) { activeInfoWindow.close();}
  if(!doNotOpenWindow){
    marker.infoWindow.open(map);
  }
  activeInfoWindow = marker.infoWindow;
	
  google.maps.event.addListener(marker, 'click', function() {
    if (activeInfoWindow) { activeInfoWindow.close();}
    marker.infoWindow.open(map);
    activeInfoWindow = marker.infoWindow;
  });
	google.maps.event.addListener(marker.infoWindow, 'domready', function() {
		setRatingStar(marker.id);
    getFormSubmission(marker.id);
	});
}