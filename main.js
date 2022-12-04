const { createClient } = window.supabase
const _supabase = createClient('https://pfcjzaxjqkvlpzhlubky.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmY2p6YXhqcWt2bHB6aGx1Ymt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk5NDkyNTQsImV4cCI6MTk4NTUyNTI1NH0.CGjEaSAeqRMf4tMorQwJx_YIBjmMYTwpIILs3IwbpG8')
let map; //: google.maps.Map;
let mapInitialized = false;
let newMapMarkerCounter = -1;
let newMapMarkers = [];
let userMarker; //: google.maps.Marker
let activeInfoWindow; 

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

async function storeData(dataIn){
  console.log("Store this data:", dataIn);
  let data = newMapMarkers[dataIn.currentMarkerId];
  console.log("Data in marker array:", data);
  if(data.address.house_num && data.address.street && data.address.city && data.address.state){
    let st_address, city_town, state, full_address;
    st_address = `${data.address.house_num} ${data.address.street}`;
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

    let { data: selectHouses, error: selectError } = await _supabase.from('houses').select();
    if(selectError) console.warn("Error when selecting house:", selectError);
    console.log("select houses: ", selectHouses);
    let foundFullAddress = selectHouses.filter(obj => {
      return obj.full_address === full_address;
    });
    console.log("If house found, foundFullAddress is ", foundFullAddress[0]);

    let title = (data.lightTitle)?data.lightTitle:(foundFullAddress[0] && foundFullAddress[0].title)?foundFullAddress[0].title:"";
    newMapMarkers[dataIn.currentMarkerId].lightTitle = title;
    let type = (data.lightType)?data.lightType:(foundFullAddress[0] && foundFullAddress[0].type)?foundFullAddress[0].type:"Unknown";
    newMapMarkers[dataIn.currentMarkerId].lightType = type;
    let radio = (data.lightRadio)?data.lightRadio:(foundFullAddress[0] && foundFullAddress[0].radio)?foundFullAddress[0].radio:"";
    newMapMarkers[dataIn.currentMarkerId].lightRadio = radio;
    let dataToInsert = { 
      full_address, 
      st_address,
      city_town,
      state,
      title,
      type,
      radio
    };

    if(foundFullAddress.length > 0){
      console.log("Data being updated: ", dataToInsert);
      const { data: updateData, error: updateError } = await _supabase.from('houses').update(dataToInsert).eq('id', foundFullAddress[0].id).select();
      if(updateError) console.warn("Error when Updating house:", updateError);
      console.log("updated house:", updateData);
      newMapMarkers[dataIn.currentMarkerId].houseId = updateData[0].id;
    }else{
      console.log("Data being inserted: ", dataToInsert);
      const { data: insertData, error: insertError } = await _supabase.from('houses').insert([dataToInsert]).select();
      if(insertError) console.warn("Error when inserting house:", insertError);
      console.log("inserted house: ", insertData);
      newMapMarkers[dataIn.currentMarkerId].houseId = insertData[0].id;
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
  let { data: selectStarRatings, error: selectStarRatingsError } = await _supabase.from('ratings').select("rating").eq("house_id",houseId);
  if(selectStarRatingsError) console.warn("Error when selecting star ratings:", selectStarRatingsError);
  console.log("Ratings found:", selectStarRatings);
  const avgStarRating = Math.round(selectStarRatings.reduce((r, c) => r + c.rating, 0) / selectStarRatings.length);
  return avgStarRating;
}


//This function is inokved asynchronously by the HTML5 geolocation API.
function displayLocation(position) {
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

function initMap(center) {
  map = new google.maps.Map(document.getElementById("map-canvas"), {
    center,
    zoom: 16
  });
  mapInitialized = true;
	map.addListener("click", (mapsMouseEvent) => {
		createMarker(mapsMouseEvent.latLng);
	});
}
function updateMarkerLocation(latLng) {
  userMarker.setPosition(latLng)
}
function createMarker(latLng, placeResult, isUserMarker) {
	newMapMarkerCounter++;
  if (isUserMarker && !userMarker) {
    userMarker = new google.maps.Marker({
      position: latLng,
      map: map,
      animation: google.maps.Animation.DROP,
      clickable: false,
      icon: "https://icons.iconarchive.com/icons/iconka/santa-stickers/32/santa-reindeer-icon.png",
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
    if (placeResult) {
      let content = placeResult.name+'<br/>'+placeResult.vicinity+'<br/>'+placeResult.types;
      addInfoWindow(marker, latLng, content);
      newMapMarkers.push(marker);
    } else { 
      // console.log(`Receieved latLng:`, latLng.lat(), latLng.lng());
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latLng.lat()}&lon=${latLng.lng()}&namedetails=1`)
        .then((response) => response.json())
        .then(async (data) => {
          // console.log(`Found address info:`, data);
          let address = {
            house_num: data.address.house_number,
            street: data.address.road,
            city: data.address.village,
            state: data.address.state
          };
          marker.address = address;
          newMapMarkers.push(marker);
          //this will populate the marker with the attributes from the db
          await storeData({...address,"currentMarkerId":newMapMarkerCounter});

          let avgStarRating = await loadAvgStarRating(newMapMarkers[newMapMarkerCounter].houseId) || 0;
          let removeMakerLink = `<a href="#" onclick='removeMarker(${newMapMarkerCounter});'>Remove marker</a>`;

          let content = `Adding location: <br/>
            ${address.house_num} ${address.street}, <br/>
            ${address.city}, ${address.state} <br/>
            <p>${removeMakerLink}</p>
            ${getStarComponent(newMapMarkerCounter, avgStarRating)}
            ${inputForm(newMapMarkerCounter)}`;
          
          addInfoWindow(marker, latLng, content);
        }); 
    }
  }
}
function inputForm(markerId){
  const loadedHouse = newMapMarkers[markerId];
	let inputFormHtml = `<form id="entry-form-${markerId}" action="">
      <div class="form-group">
        <input type="text" class="form-control form-control-xs" value="${loadedHouse.lightTitle}" placeholder="Enter Title  or none" id="title-${markerId}" />
      </div>
      <div class="form-group">
        <input type="text" class="form-control form-control-xs" value="${loadedHouse.lightRadio}" placeholder="Enter Radio  Station" id="radio-${markerId}" />
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

function removeMarker(markerId){
  console.log("attempting to remove marker", markerId);
	let marker = newMapMarkers[markerId];
	marker.infoWindow.close();
	marker.infoWindow = null; 
  google.maps.event.clearListeners(marker, 'click');
  marker.setMap(null);
}
function addInfoWindow(marker, latLng, content) {
  let infoWindowOptions = {
    content: content,
    position: latLng
  };
	
  marker.infoWindow = new google.maps.InfoWindow(infoWindowOptions);

  if (activeInfoWindow) { activeInfoWindow.close();}
  marker.infoWindow.open(map);
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