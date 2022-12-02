// interface PinnerConfig {
//   refs: PinnerRefs;
//   imgSrc: string;
//   props: Partial<PinnerProps>;
// }

// interface PinnerRefs {
//   containerRef: HTMLElement;
//   pinRef: HTMLElement;
//   imgRef: HTMLImageElement;
//   inputXRef: HTMLElement;
//   inputYRef: HTMLElement;
// }

// interface PinnerProps {
//   clientX: number;
//   clientY: number;
//   cTop: number;
//   cLeft: number;
//   cWidth: number;
//   cHeight: number;
//   diWidth: number;
//   diHeight: number;
//   nRatio: number;
//   cRatio: number;
//   x_lb: number;
//   x_ub: number;
//   y_lb: number;
//   y_ub: number;
//   cX: number;
//   cY: number;
//   adjX: number;
//   adjY: number;
//   diX: number;
//   diY: number;
//   dropLocation: PinnerDropLocation;
// }

// type PinnerDropLocation = [number, number];

// class Pinner {
//   constructor(config: Partial<PinnerConfig>) {
//     console.log('Initializing...');
//     this.initRefs(config.refs);
//     this.initImgSrc(config.imgSrc);
//     this.initListeners();
//     this.initProps(config.props);
//   }
  
//   initRefs(refs: Partial<PinnerRefs>) {
//     this.containerRef = refs.containerRef;
//     this.pinRef = refs.pinRef; //this.containerRef.querySelector("#pin");
//     this.imgRef = refs.imgRef; //this.containerRef.querySelector("#img");
//     this.inputXRef = refs.inputXRef; //document.querySelector("#inputX");
//     this.inputYRef = refs.inputYRef; //document.querySelector("#inputY");
//     this.pinItButtonRef = refs.pinItButtonRef;
//   }
  
//   initImgSrc(src: string) {
//     this.imgRef.src = src;
//     //this.imgRef.src = "https://storage.googleapis.com/ifca-assets/london.png"; // normal
//     //img.src = 'https://storage.googleapis.com/ifca-assets/long.png' // long
//     //img.src = 'https://storage.googleapis.com/ifca-assets/tall.png' // tall
//   }
  
//   initListeners() {
//     this.containerRef.addEventListener('click', this.onClick.bind(this));
//     this.pinItButtonRef.addEventListener('click', this.pinIt.bind(this));
//   }
  
//   initProps(props: Partial<PinnerProps>) {
//     // read this.onClick for the better explanations behind these props
    
//     this.clientX = props.clientX || 0.00; // where the mouse clicks relative to the viewport
//     this.clientY = props.clientY || 0.00; // these just need a value to instantiate it as a float for v8 to be more efficient
    
//     this.cTop = props.cTop || 0.00; // where the container is relative to the viewport
//     this.cLeft = props.cLeft || 0.00;
//     this.cWidth = props.cWidth || 0.00;
//     this.cHeight = props.cHeight || 0.00;
    
//     this.nRatio = props.nRatio || 0.00;
//     this.cRatio = props.cRatio || 0.00;
    
//     this.diWidth = props.diWidth || 0.00; // di = Displayed Image (pixels as dispayed)
//     this.diHeight = props.diHeight || 0.0;
    
//     this.x_lb = props.x_lb || 0.0;
//     this.x_ub = props.x_ub || 0.0;
    
//     this.y_lb = props.y_lb || 0.0;
//     this.y_ub = props.y_ub || 0.0;
    
//     this.cX = props.cX || 0.00; //clientX - cLeft; // where the pin is relative to its container
//     this.cY = props.cY || 0.00; //clientY - cTop; // where the pin is relative to its container
    
//     this.adjX = props.adjX || 0.00;
//     this.adjY = props.adjY || 0.00;
    
//     this.diX = props.diX || 0.00;
//     this.diY = props.diY || 0.00;
    
//     this.dropLocation = props.dropLocation || [0.00, 0.00];
//   }
  
//   log() {
//     const result = {
//       clientX: this.clientX,
//       clientY: this.clientY,
//       cTop: this.cTop,
//       cLeft: this.cLeft,
//       cWidth: this.cWidth,
//       cHeight: this.cHeight,
//       diWidth: this.diWidth,
//       diHeight: this.diHeight,
//       nRatio: this.nRatio,
//       cRatio: this.cRatio,
//       x_lb: this.x_lb,
//       x_ub: this.x_ub,
//       y_lb: this.y_lb,
//       y_ub: this.y_ub,
//       cX: this.cX,
//       cY: this.cY,
//       adjX: this.adjX, // adj = adjusted
//       adjY: this.adjY,
//       diX: this.diX,
//       diY: this.diY,
//       dropLocation: this.dropLocation,
//     };

//     console.log(JSON.stringify(result, null, 2));
//   }
  
//   setPinLocation(dropLocation: PinnerDropLocation) {
//     // first we calculate x_lb
//     this.adjX = dropLocation[0] + this.x_lb;
//     this.adjY = dropLocation[1] + this.y_lb;
    
//   }
  
//   // this.setPinLocation([0.90, 0.98])
  
//   renderPin() {
//     this.pinRef.style.left = this.adjX + 'px';
//     this.pinRef.style.top = this.adjY + 'px';
//   }
  
//   pinIt() {
//     console.log('pinning...');
//     this.adjX = (this.inputXRef.value * this.diWidth) + this.x_lb;
//     this.adjY = (this.inputYRef.value * this.diHeight) + this.y_lb;
//     this.renderPin();
//   }
  
//   onClick(e) {
//     this.clientX = e.clientX;
//     this.clientY = e.clientY;
    
//     const {
//       top: cTop,
//       left: cLeft,
//       width: cWidth,
//       height: cHeight
//     } = this.containerRef.getBoundingClientRect();

//     this.cTop = cTop;
//     this.cLeft = cLeft;
//     this.cWidth = cWidth;
//     this.cHeight = cHeight;

//     this.cX = this.clientX - cLeft; // where the pin is relative to its container
//     this.cY = this.clientY - cTop;

//     // gotta calculate x_lb, x_ub
//     // but first we have to calculate their ratios

//     this.nRatio = this.imgRef.naturalWidth / this.imgRef.naturalHeight;
//     this.cRatio = this.cWidth / this.cHeight;

//     // depending on nRatio, we have to either match width or height
//     // and use ratios to figure out the corresponding height or width
//     // if nRatio is < 1, we match width and if nRatio > 1, we match height
//     // if nRatio is 1, we can pick any, so we'll pick width.

//     if (this.nRatio < 1) {
//       // meaning nWidth < nHeight

//       this.diHeight = this.cWidth / this.nRatio;
//       this.diWidth = this.nRatio * this.diHeight;
//     } else {
//       //for nWidth > nHeight and nRatio == 1

//       this.diWidth = this.nRatio * this.cHeight;
//       this.diHeight = this.diWidth / this.nRatio;
//     }

//     this.x_lb = (this.cWidth - this.diWidth) / 2; // calculating margin
//     this.x_ub = this.x_lb + this.diWidth;

//     this.y_lb = (this.cHeight - this.diHeight) / 2;
//     this.y_ub = this.y_lb + this.diHeight;

//     this.adjX = (() => {
//       // x_lb = x_lower_bound
//       // x_ub = x_upper_bound
//       if (this.cX < this.x_lb) return this.x_lb;
//       if (this.cX > this.x_ub) return this.x_ub;
//       return this.cX;
//     })();

//     this.adjY = (() => {
//       // likewise
//       if (this.cY < this.y_lb) return this.y_lb;
//       if (this.cY > this.y_ub) return this.y_ub;
//       return this.cY;
//     })();

//     this.renderPin()
    
//     this.diX = this.adjX - this.x_lb;
//     this.diY = this.adjY - this.y_lb;
    
//     this.dropLocation = [this.diX / this.diWidth, this.diY / this.diHeight];

//     this.log();
//   }

// }
/* 
window.pinner = new Pinner({
  refs: {
    containerRef: document.querySelector('#container'),
    pinRef: document.querySelector('#pin'),
    imgRef: document.querySelector('#img'),
    inputXRef: document.querySelector('#inputX'),
    inputYRef: document.querySelector('#inputY'),
    pinItButtonRef: document.querySelector('#pinIt'),
  },
  imgSrc: 'http://www.lonelyplanet.com/maps/north-america/usa/new-york-city/map_of_new-york-city.jpg',
  //imgSrc: 'https://storage.googleapis.com/ifca-assets/london.png', // normal
  //imgSrc: 'https://storage.googleapis.com/ifca-assets/long.png', // long
  //imgSrc: 'https://storage.googleapis.com/ifca-assets/tall.png', // tall
  props: {}
}); */


const { createClient } = window.supabase
// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
const _supabase = createClient('https://pfcjzaxjqkvlpzhlubky.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmY2p6YXhqcWt2bHB6aGx1Ymt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2Njk5NDkyNTQsImV4cCI6MTk4NTUyNTI1NH0.CGjEaSAeqRMf4tMorQwJx_YIBjmMYTwpIILs3IwbpG8')
let map; //: google.maps.Map;
let mapInitialized = false;
let newMapMarkerCounter = -1;
let newMapMarkers = [];
let userMarker; //: google.maps.Marker

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

async function storeData(data){
  // const kvdmyid = "85Yy1wkuhcNGkUeytKifN3";
  // const kvdbStorage = KVdb.bucket(kvdmyid).localStorage();
  let st_address, city_town, state, full_address;
  if(data.address && data.address.house_num && data.address.street && data.address.city && data.address.state){
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
  }
  let { sbdata: houses, selectError } = await _supabase.from('houses').select('*');
  console.log("select houses: ", houses);
  let dataToInsert = { 
    full_address, 
    st_address,
    city_town,
    state,
    type: "Flat"
  };
  console.log("Data being inserted: ", dataToInsert);
  const { insertData, insertError } = await _supabase
  .from('houses')
  .insert([dataToInsert])
  console.log("insert houses: ", insertData);
  // const currentHouseObj = kvdbStorage.getItem(data.houseId);
  // if (currentHouseObj){
  //   console.log("updating house", data);
  // }else{
  //   console.log("creating house...", data);
  // }
  // ${address.house_num} ${address.street}, <br/>
  // ${address.city}, ${address.state} <br/>
  // kvdbStorage.setItem('address', 'my-value')
  //   .then(() => console.log('key saved')
  //   .then(() => kvdbStorage.getItem('my-key'))
  //   .then(value => console.log('get value', value))
  //   .catch(err => console.error(err)
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
        .then((data) => {
          // console.log(`Found address info:`, data);
          let address = {
            house_num: data.address.house_number,
            street: data.address.road,
            city: data.address.village,
            state: data.address.state
          };
          let removeMakerLink = `<a href="#" onclick='removeMarker(${newMapMarkerCounter});'>Remove marker</a>`;
          let content = `Adding location: <br/>
            ${address.house_num} ${address.street}, <br/>
            ${address.city}, ${address.state} <br/>
            <p>${removeMakerLink}</p>
            ${getStarComponent(newMapMarkerCounter)}
            ${inputForm(newMapMarkerCounter)}`;
          addInfoWindow(marker, latLng, content);
          newMapMarkers.push(marker);
          storeData({...address,"houseId":newMapMarkerCounter});
        }); 
    }
  }
}
function inputForm(markerId){
	let inputFormHtml = `<form id="entry-form-${markerId}" action="">
		<div class="form-group">
			<input type="text" class="form-control form-control-xs" placeholder="Enter Title  or none" id="title-${markerId}" />
		</div>
		<div class="form-group">
      <input type="text" class="form-control form-control-xs" placeholder="Enter Radio  Station" id="radio-${markerId}" />
    </div>
		<div class="light-types">
			<input id="type-flat-${markerId}" type="radio" name="type-${markerId}" value="flat" />
			<label class="light-type type-flat" for="type-flat-${markerId}"></label>
			<input id="type-musical-${markerId}" type="radio" name="type-${markerId}" value="musical" />
			<label class="light-type type-musical" for="type-musical-${markerId}"></label>
			<input id="type-commercial-${markerId}" type="radio" name="type-${markerId}" value="commercial" />
			<label class="light-type type-commercial" for="type-commercial-${markerId}"></label>
			<input id="type-animated-${markerId}" type="radio" name="type-${markerId}" value="animated" />
			<label class="light-type type-animated" for="type-animated-${markerId}"></label>
    </div>
		</form>`;
	return inputFormHtml;
}
function getFormSubmission(markerId){
  const entry_form = document.getElementById(`entry-form-${markerId}`);
  entry_form.addEventListener("change input", (event)=>{
    
  });
}
function getStarComponent(markerId){
	let starHtml = `<div id="rating-el-${markerId}">
		<div class="row">
			<div class="col-lg-12">
				<div class="star-rating text-center pt-2">
					<span class="bi bi-star" data-rating="1"></span>
					<span class="bi bi-star" data-rating="2"></span>
					<span class="bi bi-star" data-rating="3"></span>
					<span class="bi bi-star" data-rating="4"></span>
					<span class="bi bi-star" data-rating="5"></span>
					<input type="hidden" name="rating-value" class="rating-value" value="0">
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
    storeData({"starRating":rating,"houseId":markerId});
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
	star_rating.addEventListener("load", (event)=>{
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
  marker.infoWindow.open(map);
	
  google.maps.event.addListener(marker, 'click', function() {
    marker.infoWindow.open(map);
  });
	google.maps.event.addListener(marker.infoWindow, 'domready', function() {
		setRatingStar(marker.id);

	});
}