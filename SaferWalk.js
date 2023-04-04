//Declared the following as global variables/ objects
var map, infoWindow, locationButton, pos, destination, check1, check2, user;
//check2 represents if the user location has been obtained and check1 represents if destination has been inputted
var check1=false;
var check2=false;
var contacts = []
var timeoutID = null;
var fr = false

//Have to use callback instead of return as geocoder.geocode() is linked asynchronously
function getCoordinates(address, callback) {  
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: address }, function(results, status) {
    if (status === "OK") {
      var latitude = results[0].geometry.location.lat();
      var longitude = results[0].geometry.location.lng();
      var coords = { lat: latitude, lng: longitude };
      callback(coords);
    } else {
        callback("Geocode was not successful for the following reason: " + status);
    };
  });
};

//This function returns the specific country within UK that coordinates fall within as crime data only spans
//Eng, Wales, NI
function reverseGeocode(latitude, longitude, callback) {
  const geocoder = new google.maps.Geocoder();
  const latlng = new google.maps.LatLng(latitude, longitude);
  geocoder.geocode({ 'location': latlng }, function(results, status) {
    if (status === 'OK') {
      if (results[0]) {
        const country = results[0].address_components.find(component => component.types.includes('country'));
        if (country.short_name === 'GB') {
          const adminArea1 = results[0].address_components.find(component => component.types.includes('administrative_area_level_1'));
          callback(adminArea1.long_name);
        } else {
          callback(country.long_name);
        }
      } else {
        callback('No results found');
      }
    } else {
      callback('Geocoder failed due to: ' + status);
    }
  });
};


const container = document.getElementById("container");
function initMap() { //Instantiates a map object from the Google Maps API map class
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 52.397, lng: 0 },
    zoom: 6,
  });
  //Instantiates an InfoWindow object from the Maps API InfoWindow class
  infoWindow = new google.maps.InfoWindow();

  //Adds the button the user can click to retrieve their current location using geolocation service
  locationButton = document.createElement("button");
  locationButton.textContent = "Get Current Location";
  locationButton.classList.add("custom-map-control-button");
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);

  //EventListener used here to respond to click instead of onclick property Defines the function straight away.
  locationButton.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => { //Creates a pos object with the attributes lat and lng
          pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          infoWindow.setPosition(pos);
          infoWindow.setContent('<div style="color:black"> Location </div>');
          console.log("Location:", pos.lat, pos.lng);
          //Makes sure the user is in one of the areas SaferWalk works in
          reverseGeocode(pos.lat, pos.lng, function(address) {
            //console.log(address);
            if (address != "England" && address != "Wales" && address != "Northern Ireland") {
              alert("Invalid Location! Make sure it's within the UK (excluding Scotland)")
            }
            else{
              check2=true;
              fr=true
              infoWindow.open(map);
              map.setCenter(pos);
              map.setZoom(15);
              container.innerHTML = '';
              Router();
            };
          });
        },
        () => {
          //Browser supports geolocation however an error occurred retrieving location coordinates from the GPS (exception statement to prevent crash) 
          handleLocationError(infoWindow);
        }
      );
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(infoWindow);
    }
  });
}
function handleLocationError(infoWindow) {
  //Both error cases result in the same handling. The div beneath the map presents a "geolocation service failed" message and the user is prompted to input their location manually
  alert("We can't access your location at the moment, please input your location manually");
  fr=false;
  container.innerHTML = `
    <h2 class="Manual" style="color: orange;">Geolocation Service Failed! :(</h2>
    <h3 class="Manual" style="color: white;">Enter your location here</h3>
    <div class="destination-input-group">
        <input type="text" id="location-input" style="border-radius: 20px;" placeholder=" e.g. Big Ben | GL51 0HG">
        <button id="location-button" onclick="ManLoc(document.getElementById('location-input').value.trim())" style="background-color: aquamarine; margin-top: 0.2cm; border-radius: 20px; padding: 1px 20px;">Enter</button>
  `;

  //This will get rid of the infoWindow had one already been openned showing a location in a previous iteration of the program
  infoWindow.close();
};

document.addEventListener('DOMContentLoaded', function() {
  initMap();
}, false);
window.initMap = initMap;
//pos = user location as an object with attributes lat and lng storing coordinate values.


//Gets user location manually by allowing user to enter it manually.
function ManLoc(poss) {
  getCoordinates(poss, function(coords) {
    console.log("Starting:", coords.lat, coords.lng);
    //INPUT VALIDATION
    reverseGeocode(coords.lat, coords.lng, function(address) {
      //console.log(address);
      if (address != "England" && address != "Wales" && address != "Northern Ireland") {
        document.getElementById("location-input").value = "";
        alert("Invalid Location! Make sure it's within the UK (excluding Scotland)");
      }
      else {
        check2=true;
        fr=false;
        map.setCenter(coords);
        map.setZoom(15);
        infoWindow.setPosition(coords);
        infoWindow.setContent('<div style="color:black"> Origin </div>');
        infoWindow.open(map)
        pos=coords;
        Router();
      };
    });
  });  
};

function Entered(destinations) {
  getCoordinates(destinations, function(coords) {
    console.log("Destination:", coords.lat, coords.lng);
    //INPUT VALIDATION
    reverseGeocode(coords.lat, coords.lng, function(address) {
      if (address != "England" && address != "Wales" && address != "Northern Ireland") {
        document.getElementById("destination-input").value = "";
        alert("Invalid Location! Make sure it's within the UK (excluding Scotland)");
      }
      else{
        check1=true;
        var minimap=document.getElementById("minimap");
        const url = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        minimap.innerHTML = `<iframe src="${url}" width="100%" height="400 vh" frameborder="0" scrolling="no"> </iframe>`;
        destination=coords;
        clearTimeout(timeoutID);
        Router();
      };
    });    
  });
};

function Router(){
  if (check1==true && check2==true) {
    if (pos.lat != destination.lat && pos.lng != destination.lng) {
    //Show the "calculate safest route" button once this if statement runs.
    console.log("It's routing time!")
    container.innerHTML=`<div style="display: flex; align-items: left;">
      <button onclick="displaySafestRoute(pos, destination)" style="font-size: 2vh; background-color: aquamarine; margin-top: 0.5cm; border-radius: 20px; padding: 10px 20px; margin: auto;"><strong>Calculate Safest Route</strong></button><br>
    </div><br>
    <div class="destination-input-group">
      <h2 class="Manual" style="color: orange;">Change Starting Point:</h2>
      <input type="text" id="location-input" style="border-radius: 20px;" placeholder=" e.g. Big Ben | GL51 0HG">
      <button id="location-button" onclick="ManLoc(document.getElementById('location-input').value.trim())" style="background-color: aquamarine; margin-top: 0.2cm; border-radius: 20px; padding: 1px 20px;">Enter</button>
    </div>
      `;
    } else {
      alert("Please enter a different destination to your location/ starting point!");
      //This innerHTML is the original state of the div and it is reverted back to this state if the validation criteria aren't both met again
      container.innerHTML = `<h2 class="Manual" style="color: orange;">Or...</h2>
      <h3 class="Manual" style="color: white;">Enter a starting point here</h3>
      <div class="destination-input-group">
          <input type="text" id="location-input" style="border-radius: 20px;" placeholder=" e.g. Big Ben | GL51 0HG">
          <button id="location-button" onclick="ManLoc(document.getElementById('location-input').value.trim())" style="background-color: aquamarine; margin-top: 0.2cm; border-radius: 20px; padding: 1px 20px;">Enter</button>
      `;
    };
  };
};

var crimes = [];
// read the Crimes.js file
var db = Crimes;
var rows = db.split("\n");
// Parse the crime data and store each crime record as an object in the crimes array
for (let i = 1; i < rows.length; i++) {
  var cols = rows[i].split(",");
  //Each crime record is converted to an object with the columns as attributes
  var crime = {
    month: cols[0],
    fallsWithin: cols[1],
    lng: parseFloat(cols[2]),
    lat: parseFloat(cols[3]),
    crimeType: cols[4],
  };
  crimes.push(crime);
};

// function to display the safest walking route
function displaySafestRoute(pos, destination) {
  //Initialises the map again to remove any routes or markers if function had been used previously
  initMap();
  infoWindow.setPosition(pos);
  if (fr){
    infoWindow.setContent('<div style="color:black"> Location </div>');
  }
  else{
    infoWindow.setContent('<div style="color:black"> Origin </div>');
  };
  infoWindow.open(map);

  // Initialize the Google Maps Directions Service to calculate routes
  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true,
  });
  // Array to store the risk scores for each calculated route
  var riskScores=[];
 
  // calculate walking directions from pos to destination
  const request = {
    origin: pos,
    destination: destination,
    travelMode: "WALKING",
    provideRouteAlternatives: true,
  };

  // Request walking routes from the Directions Service and process the results to calculate risk scores and display the safest and shortest routes
  directionsService.route(request, (result, status) => {
    if (status == "OK") {
      // calculate the risk score for each route
      const routes = result.routes;
      console.log("Number of possible routes:", routes.length);
      // Iterate through all routes to calculate their risk scores based on the number of crimes near each point along the route
      for (let i = 0; i < routes.length; i++) {
        const path = routes[i].overview_path;
        let riskScore = 0;
        var line = new google.maps.Polyline({
          path: routes[i].overview_path,
          strokeColor: "#ff0000",
          strokeOpacity: 0.3,
          strokeWeight: 2,
        });
        line.setMap(map);
        for (let j = 0; j < path.length; j++) {
          const lat = path[j].lat();
          const lng = path[j].lng();
          // search the crimes array for any crime at the current position
          for (let k=0; k < crimes.length; k++){
            if (Math.abs(crimes[k].lat - lat) <= 0.001 && Math.abs(crimes[k].lng - lng) <= 0.001) {//Increments the riskScore for every crime that's occurred within 100m of this point onroute
              riskScore++;
            };
          };
        };
        riskScores.push(riskScore);
        console.log("Riskscore", i, "is", riskScore);
      }
      // get the index of the route with the lowest risk score
      const minIndex = riskScores.indexOf(Math.min(...riskScores));
      console.log("Safest route:", minIndex);
      // display the safest route on the map
      var safest = new google.maps.Polyline({
          path: routes[minIndex].overview_path,
          strokeColor: "green",
          strokeOpacity: 1,
          strokeWeight: 5,
      });
      safest.setMap(map);
      //display shortest route in blue as well
      directionsRenderer.setDirections(result);
      //Displays the ETA and riskscore per route
      const shortETA = routes[0].legs[0].duration.text;
      const shortRisk = riskScores[0];
      const safeETA = routes[minIndex].legs[0].duration.text;
      const safeRisk = riskScores[minIndex];

      const info = document.getElementById("times");
      if (minIndex != 0){
      info.innerHTML = `<h3> SAFEST ROUTE --> <span style="color: green;"> Green Path </span> </h3>
      <ul>
        <li> Risk Score: ${safeRisk} </li>
        <li> Travel Time: ${safeETA} </li>
      </ul><br>
      <h3> SHORTEST ROUTE --> <span style="color: blue;">Blue Path </span></h3>
      <ul>
        <li> Risk Score: ${shortRisk} </li>
        <li> Travel Time: ${shortETA} </li>
      </ul><br>
      `
      }
      else{
        info.innerHTML = `<h3> ROUTE DETAILS <h3>
        <ul>
          <li> Risk Score: ${safeRisk} </li>
          <li> Travel Time: ${safeETA} </li>
        </ul><br>
        `
        // Display a notice if there's another route available
        if (riskScores.length == 2) {
          const notice = document.createElement("notice");
          notice.innerHTML = `<p><strong>(Other routes --></strong><span style="color: red;"> thin red path</span><strong>)</strong> </p>`;
          info.appendChild(notice);
        };
      };

      // Display a notice if there are more than two alternative routes available
      if (riskScores.length > 2) {
      const notice = document.createElement("notice");
      notice.innerHTML = `<p><strong>(Other routes --></strong><span style="color: red;"> thin red path</span><strong>)</strong> </p>`;
      info.appendChild(notice);
      };
      //Puts a marker at the destination location as well
      var destMarker= new google.maps.InfoWindow();
      destMarker.setPosition(destination);
      destMarker.setContent('<div style="color:black"> Destination </div>');
      destMarker.open(map);

      //If following the map using location, route updates every 15 seconds to refresh your location using recursion
      timeoutID=setTimeout(function(){
        if (fr){
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => { //Updates the pos object with the attributes lat and lng
                  pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  };
                  console.log("Refreshed");
                  if (Math.abs(destination.lat - pos.lat) <= 0.0002 && Math.abs(destination.lng - pos.lng) <= 0.0002) {//If location and destination are within 20m of each other
                    locationButton.textContent = "YOU HAVE REACHED YOUR DESTINATION!";
                    map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
                    document.getElementById("minimap").innerHTML=``;
                    document.getElementById("times").innerHTML = `<h2><strong>Thank You for Travelling Safely with Saferwalk!</strong><h2>`;
                    fr=false;
                  }
                  else{
                    displaySafestRoute(pos, destination);
                  };
                });
            } else{ alert("Geolocation no longer works"); fr=false;};
        };
      }, 15000);

    } else {
      alert("Directions request failed due to " + status);
    };
  });
};

function Namer(User){
  if (User != ""){
    user = User
    document.getElementById("lister").innerHTML = `<ul id="list">
      <h3>${User}'s contacts Alerted upon SOS button press:</h3>
    </ul>
    `
    document.getElementById("lister").style = "border: 1px solid black; padding: 2%; padding-top: 0.1%;";
    const transform = document.getElementById("form")
    transform.innerHTML= `<h2>EMERGENCY CONTACTS</h2>
    <h3>Enter the details of an emergency contact here:</h3>
    <input type="text" id="name-input" maxlength="20" style="border-radius: 20px;" placeholder=" Name">
    <input type="text" id="email-input" maxlength="20" style="border-radius: 20px;" placeholder=" Email Address">
    <button id="add-button" onclick="Add(document.getElementById('name-input').value.trim(), document.getElementById('email-input').value.trim())" style="border: black; background-color:aquamarine; margin-top: 0.5cm; border-radius: 20px; padding: 10px 20px; margin: auto;">Add</button>
  `
  }
  else{
    alert("Please make sure you've entered a value!");
  };
};

var first = true
function Add(names, emails) {
  if (names == "" || emails == ""){
    alert("You MUST enter values for name AND email!")
  }
  else{
    if (emails.includes("@") && emails.includes(".")){
      contacts.push({
        name: names,
        email: emails,
      });
      if (first){
        document.getElementById("SOS").innerHTML = `<img id="SOS-but" src="SOS.png" onclick="SOS()" height="100 vh">`
        first=false
      };
      const addition = document.createElement("record");
      addition.innerHTML = `<li> ${names}  || ${emails} </li>`;
      document.getElementById("list").appendChild(addition);

      document.getElementById("name-input").value = ""
      document.getElementById("email-input").value = ""
    }
    else{
      alert("Please make sure you've entered a valid email address")
      document.getElementById("email-input").value = ""
    };
  };
};

const audio = new Audio("Ringtone.mp3");
function SOS(){
  const answer = document.createElement("answer");
  answer.innerHTML = `<img src="Call.png">`;
  answer.onclick = function(){
    audio.pause();
    document.getElementById("SOS").removeChild(answer);
    document.getElementById("SOS-but").style.display = "block";
  };
  document.getElementById("SOS").appendChild(answer);
  document.getElementById("SOS-but").style.display = "none";
  audio.currentTime = 0;
  audio.play();

  for (let i = 0; i < contacts.length; i++) {
    if (fr){
      alert(`<SendTo: ${contacts[i].email}> || Dear ${contacts[i].name}, ${user} is in trouble at geocoordinates: ${pos.lat}, ${pos.lng}! Please contact them and make sure they're safe!`)
    }
    else{
      alert(`<SendTo: ${contacts[i].email}> || Dear ${contacts[i].name}, ${user} is in trouble on the streets! Please contact them and make sure they're safe!`)
    };
  };
};


//The following function allows the HTML elememts to float in with the .fade-in-section CSS class.
document.addEventListener("DOMContentLoaded", function () {
  const fadeInSections = document.querySelectorAll(".fade-in-section");
  const fadeInObserver = new IntersectionObserver(
    function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
    }
  );
  fadeInSections.forEach(function (section) {
    fadeInObserver.observe(section);
  });
});
