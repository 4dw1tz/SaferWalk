//Declared the following as global variables/ objects
var map, infoWindow, pos, destination, check1, check2;
//check2 represents if the user location has been obtained and check1 represents if destination has been inputted
var check1=false;
var check2=false;

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
  const locationButton = document.createElement("button");
  locationButton.textContent = "Get Current Location";
  locationButton.classList.add("custom-map-control-button");
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(
    locationButton
  );
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
          infoWindow.setContent('<div style="color:black"> Origin </div>');
          console.log("Location:", pos.lat, pos.lng);
          //Makes sure the user is in one of the areas SaferWalk works in
          reverseGeocode(pos.lat, pos.lng, function(address) {
            //console.log(address);
            if (address != "England" && address != "Wales" && address != "Northern Ireland") {
              alert("Location must be within the UK (excluding Scotland)")
            }
            else{
              check2=true;
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
    //Show the safest route once this if statement is true to run.
    console.log("It's routing time!")
    //ATTEMPT TO PUT CALC BUTTON ON MAP BUT IT IS SEEMS TO BE CLICKED WHEN ROUTER() IS RUN EVEN IF IT HASN'T
    /*const CalcButton = document.createElement("calc-button");
    CalcButton.innerHTML = "<strong>Calculate Safest Route</strong>";
    CalcButton.style.cssText = "color: black; fontSize: 24px; background-color: aquamarine; margin-top: 0.5cm; border-radius: 20px; padding: 10px 20px; margin: auto;";
    CalcButton.onclick = displaySafestRoute(pos, destination);
    map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(CalcButton);*/
    container.innerHTML=`<button onclick="displaySafestRoute(pos, destination)" style="background-color: aquamarine; margin-top: 0.5cm; border-radius: 20px; padding: 10px 20px; margin: auto;"><strong>Calculate Safest Route</strong></button><br>
    <div class="destination-input-group">
      <h2 class="Manual" style="color: orange;">Change Starting Point:</h2>
      <input type="text" id="location-input" style="border-radius: 20px;" placeholder=" e.g. GL51 0HG">
      <button id="location-button" onclick="ManLoc(document.getElementById('location-input').value.trim())" style="background-color: aquamarine; margin-top: 0.2cm; border-radius: 20px; padding: 1px 20px;">Enter</button>
    </div>
      `;
  };
};

// function to display the safest walking route
var once=true
function displaySafestRoute(pos, destination) {
  //Initialises the map again to remove any routes or markers if function had been used previously
  initMap()
  infoWindow.setPosition(pos);
  infoWindow.setContent('<div style="color:black"> Origin </div>');
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
      //Puts a marker at the destination location as well
      var destMarker= new google.maps.InfoWindow();
      destMarker.setPosition(destination);
      destMarker.setContent('<div style="color:black"> Destination </div>');
      destMarker.open(map);
    } else {
      alert("Directions request failed due to " + status);
    }
  });
};

//Need to add in some of my own validation and comment in some validation label comments where the API handles errors and validates inputs
//Need to get the user to enter their emergency contacts after they click get route to make it appear concurrent.
//A key to say that the blue line is the shortest route and the green line is the safest
//Display the risk score of the shortest route and the safest route in the key below as well
//Make the location InfoWindow change position as every 10 seconds as you move
//Display the time it will take to get to the destination for the shortest route and the safest route
//Make sure there's always an option at the bottom to enter a new location starting point.
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
*/