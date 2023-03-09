//Declared the following as global variables/ objects
var map, infoWindow, locationButton, pos, destination, check1, check2, user;
//check2 represents if the user location has been obtained and check1 represents if destination has been inputted
var check1=false;
var check2=false;
var contacts = []
var fr = false

//Have to use callback instead of return as geocoder.geocode() is from the Google Maps API script which is linked asynchronously
function getCoordinates(address, callback) {  
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: address }, function(results, status) {
    if (status === "OK") {
      var latitude = results[0].geometry.location.lat();
      var longitude = results[0].geometry.location.lng();
      var coords = { lat: latitude, lng: longitude };
      callback(coords);
    } else {
      //This validates the input. If the user entered an invalid place neame, the following is returned
      callback("Geocode was not successful for the following reason: " + status);
    }
  });
};
//This function returns the specific country within UK that some coordinates falls within as crime data only spans Eng, Wales, NI
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
              alert("Location must be within the UK (excluding Scotland)")
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
          handleLocationError(true, infoWindow, map.getCenter());
        }
      );
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter());
    }
  });
}
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  //This handles the error that occurs in the event that the user's GPS couldn't be accessed so they input a starting point manually.
  fr=false
  container.innerHTML = `
    <h2 class="Manual" style="color: orange;">Geolocation Service Failed! :(</h2>
    <h3 class="Manual" style="color: white;">Enter your location here</h3>
    <div class="destination-input-group">
        <input type="text" id="location-input" style="border-radius: 20px;" placeholder=" e.g. GL51 0HG">
        <button id="location-button" onclick="ManLoc(document.getElementById('location-input').value.trim())" style="background-color: aquamarine; margin-top: 0.2cm; border-radius: 20px; padding: 1px 20px;">Enter</button>
  `;
  infoWindow.setPosition(pos);
  infoWindow.setContent('<div style="color:black"> Geolocation Service Failed</div>');
  //infoWindow.open(map);
  map.setZoom(6)
}
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
        alert("Starting point must be within the UK (excluding Scotland)");
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
  //document.getElementById("destination-input").value = "";
  getCoordinates(destinations, function(coords) {
    console.log("Destination:", coords.lat, coords.lng);
    //INPUT VALIDATION
    reverseGeocode(coords.lat, coords.lng, function(address) {
      //console.log(address);
      if (address != "England" && address != "Wales" && address != "Northern Ireland") {
        document.getElementById("destination-input").value = "";
        alert("Destination must be within the UK (excluding Scotland)");
      }
      else{
        check1=true;
        var minimap=document.getElementById("minimap");
        const url = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        minimap.innerHTML = `<iframe src="${url}" width="100%" height="400 vh" frameborder="0" scrolling="no"> </iframe>`;
        destination=coords;
        Router();
      };
    });    
  });  
}

function Router(){
  if (check1==true && check2==true) {
    //Show the safest route once this if statement runs.
    console.log("It's routing time!")
    container.innerHTML=`<div style="display: flex; align-items: left;">
      <button onclick="displaySafestRoute(pos, destination)" style="background-color: aquamarine; margin-top: 0.5cm; border-radius: 20px; padding: 10px 20px; margin: auto;"><strong>Calculate Safest Route</strong></button><br>
    </div><br>
    <div class="destination-input-group">
      <h2 class="Manual" style="color: orange;">Change Starting Point:</h2>
      <input type="text" id="location-input" style="border-radius: 20px;" placeholder=" e.g. GL51 0HG">
      <button id="location-button" onclick="ManLoc(document.getElementById('location-input').value.trim())" style="background-color: aquamarine; margin-top: 0.2cm; border-radius: 20px; padding: 1px 20px;">Enter</button>
    </div>
      `;
  };
};

// function to display the safest walking route
function displaySafestRoute(pos, destination) {
  //Initialises the map again to remove any routes or markers if function had been used previously
  initMap();
  infoWindow.setPosition(pos);
  if (fr){
    infoWindow.setContent('<div style="color:black"> Location </div>');
    container.innerHTML = ``
    document.getElementById("intro").innerHTML = `<h1>Your Trusted Companion</h1>
    <h4>Walk with confidence knowing you are on the safest route to your destination.</h4><br>
    <label>RELAUNCH SAFERWALK TO CHANGE DESTINATION</label>
    `
  }
  else{
    infoWindow.setContent('<div style="color:black"> Origin </div>');
  };
  infoWindow.open(map);

  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true,
  });
  var riskScores=[];
  var crimes = [];

  // read the Crimes.js file
  var csv = Crimes;
  var rows = csv.split("\n");
  //Each crime object is appended to the crimes list
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
  // calculate walking directions from pos to destination
  const request = {
    origin: pos,
    destination: destination,
    travelMode: "WALKING",
    provideRouteAlternatives: true,
  };
  directionsService.route(request, (result, status) => {
    if (status == "OK") {
      // calculate the risk score for each route
      const routes = result.routes;
      console.log("Number of possible routes:", routes.length);
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
          const crime = crimes.find((c) => Math.abs(c.lat - lat) <= 0.001 && Math.abs(c.lng - lng) <= 0.001); //This will count a crime if it has occured within a 100m vicinity of this point on the route.
          //In this case c is just a parameter created that represents each crime object in the array (like i or j in a for loop.)
          if (crime) {
            riskScore++;
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
      };
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
      setTimeout(function(){
        if (fr){
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => { //Updates the pos object with the attributes lat and lng
                  pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  };
                  console.log("Refreshed");
                  console.log(Math.abs(destination.lat - pos.lat));
                  if (Math.abs(destination.lat - pos.lat) <= 0.0002) { //If location and destination are within 20m of each other
                    locationButton.textContent = "YOU HAVE REACHED YOUR DESTINATION!";
                    map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
                    document.getElementById("minimap").innerHTML=``;
                    
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
    }
  });
};

function Namer(User){
  user = User
  document.getElementById("lister").innerHTML = `<ul id="list">
    <h3>${User}'s contacts Alerted upon SOS button press:</h3>
  </ul>
  `
  const transform = document.getElementById("form")
  transform.innerHTML= `<h2>EMERGENCY CONTACTS</h2>
  <h3>Enter the details of an emergency contact here:</h3>
  <input type="text" id="name-input" style="border-radius: 20px;" placeholder=" Name">
  <input type="text" id="email-input" style="border-radius: 20px;" placeholder=" Email Address">
  <button id="add-button" onclick="Add(document.getElementById('name-input').value.trim(), document.getElementById('email-input').value.trim())" style="border: black; background-color:aquamarine; margin-top: 0.5cm; border-radius: 20px; padding: 10px 20px; margin: auto;">Add</button>
`
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
        document.getElementById("SOS").innerHTML = `<img src="SOS.png" onclick="SOS()" height="100 vh">`
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

function SOS(){
  for (let i = 0; i < contacts.length; i++) {
    if (fr){
      alert(`<SendTo: ${contacts[i].email}> || Dear ${contacts[i].name}, ${user} is in trouble at geocoordinates: ${pos.lat}, ${pos.lng}! Please contact them and make sure they're safe!`)
    }
    else{
      alert(`Dear ${contacts[i].name}, ${user} is in trouble on the streets! Please contact them and make sure they're safe!`)
    };
  };
};



//Need to add in some of my own validation and comment in some validation label comments where the API handles errors and validates inputs
//In the future add user settings like crime sensitivity which affects how much distance from your route a crime can affect the riskscore or certain types of crime have more risk points

/*ERRORS FIXED
Police data UK API not responding
JavaScript unable to read csv file
Geocoder.geocode method being asynchronous so needing to use callback instead of return like a normal function
Problem with using the same variable pos as global variable in Manloc function
Problem with getting all the routes or safest route to show up
Learnt that so many problems were solved by reading the Google Maps Platform documentation
Learnt JavaScript is heaviy object orientated
Getting polylines to disappear (solved by just resetting the map)
Using email addresses instead of phone numbers
Stopping user from changing destination or starting point if using real-time location to prevent double refreshing
*/