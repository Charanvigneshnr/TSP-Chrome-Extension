// Define global variables
let map, service, directionsRenderer;

// Initialize the map on popup load
document.addEventListener("DOMContentLoaded", () => {
  initMap();
});

function initMap() {
  // Get the user's location
  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;
    const center = new google.maps.LatLng(latitude, longitude);

    // Create the map centered on the user's location
    map = new google.maps.Map(document.getElementById("map"), {
      zoom: 12,
      center: center,
    });

    // Create a DirectionsRenderer object to display the directions
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    directionsRenderer.setPanel(document.getElementById("directions"));

    // Create a PlacesService object to search for nearby places
    service = new google.maps.places.PlacesService(map);

    // Add a click listener to the search button
    const searchButton = document.getElementById("searchButton");
    searchButton.addEventListener("click", handleSearchClick);
  });
}

function handleSearchClick() {
  // Get the user's input values
  const searchInput = document.getElementById("searchInput");
  const query = searchInput.value;
  const numShopsInput = document.getElementById("numShopsInput");
  const numShops = numShopsInput.value;

  // Call the PlacesService nearbySearch method to find nearby places
  service.nearbySearch(
    {
      location: map.getCenter(),
      radius: 10000,
      type: "store",
      keyword: query,
    },
    (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        // Sort the results by distance from the center of the map
        results.sort((a, b) => {
          const distA = google.maps.geometry.spherical.computeDistanceBetween(
            map.getCenter(),
            a.geometry.location
          );
          const distB = google.maps.geometry.spherical.computeDistanceBetween(
            map.getCenter(),
            b.geometry.location
          );
          return distA - distB;
        });

        // Limit the number of results to the user's input value
        const limitedResults = results.slice(0, numShops);

        // Create an array of LatLng objects representing the locations of the places
        const locations = limitedResults.map((result) => result.geometry.location);

        // Use the Traveling Salesman Problem algorithm to find the shortest route between the locations
        const tsp = new TravelingSalesmanProblem();
        const solution = tsp.solve(locations);

        // Create a DirectionsRequest object to get directions between the locations
        const waypoints = solution.map((location) => {
          return {
            location: location,
            stopover: true,
          };
        });

        const origin = waypoints.shift().location;
        const destination = waypoints.pop().location;

        const request = {
          origin: origin,
          destination: destination,
          waypoints: waypoints,
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING,
        };

        // Call the DirectionsService route method to get the directions
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
          }
        });
      }
    }
  );
}