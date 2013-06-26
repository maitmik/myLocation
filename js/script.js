var map,
	mapDiv,
    pouchdb,
    aLatitude,
    aLongitude,
    geolocation,
    markersArray=[],
    mainMarker,
    firstTimeDone=true;

(function() {
	pouchdb = Pouch('location');
	mapDiv = document.getElementById('mapContainer');
	setGeolocation();
})();

function setGeolocation () {
	if (navigator.geolocation) { 
		findMapCenter();
		findCoords();
	}else{
		mapDiv.innerHTML = "<p>Geolocation is not supported by your browser</p>";
    	return;
	}
}

window.setTimeout( function () {
	workWithCoords(aLatitude, aLongitude);
    window.navigator.geolocation.clearWatch( geolocation ) 
    }, 
    5000 //stop checking after 5 seconds
);

window.setInterval( function () {
    setGeolocation();
    showMarkersFromLocalDatabase();
	}, 
	60000 //check every minute
);

function createmap (mapDiv, lat, lng) {
	map = new google.maps.Map(mapDiv, {
	  center: new google.maps.LatLng(lat, lng),
	  zoom: 18,
	  mapTypeId: google.maps.MapTypeId.ROADMAP
	});
}

function findMapCenter () {
	if(firstTimeDone){
			navigator.geolocation.getCurrentPosition( 
		        function (position) {  
		            createmap(mapDiv, position.coords.latitude, position.coords.longitude);
		            showMarkersFromLocalDatabase();
		        }, 
		        function (error){
		        	createmap(mapDiv, 59.44, 24.7);
		        	showMarkersFromLocalDatabase();
		        });
	}else{
		removeMarkersFromMap();
	}
}

function findCoords () {
	geolocation = window.navigator.geolocation.watchPosition( 
        function ( position ) {
            aLatitude = position.coords.latitude;
            aLongitude = position.coords.longitude;
        },
        function (error) { 
        	switch(error.code){
	                case error.TIMEOUT:
	                    alert('Request timedout, try again.');
	                    break;
	                case error.POSITION_UNAVAILABLE:
	                    alert('Position is unavailable.');
	                    break;
	                case error.PERMISSION_DENIED:
	                    alert('Permission Denied.');
	                    break;
	                case error.UNKNOWN_ERROR:
	                    alert('Could not retrive location, try again.');
	                    break;
	                default: break;
	        }
        }, {
            maximumAge: 250, 
            enableHighAccuracy: true
        }
    );
}

function workWithCoords (lat, lng) {
	addToLocalDatabase(lat, lng);
}

function createMarker (lat, lng) {
    var latLng = new google.maps.LatLng(lat, lng);
    mainMarker = new google.maps.Marker({
      position: latLng,
      icon: "blue.png",
      map: map
    });
    firstTimeDone=false;
}

function addToLocalDatabase (newLat, newLng) {
	pouchdb.post({ lat: newLat, lng: newLng }, function(err, response) {
		if (response.ok==true) {
			if (firstTimeDone==false) {
				mainMarker.setMap(null);
			};
			createMarker(newLat, newLng);
		};
	});
}

function showMarkersFromLocalDatabase () {
	pouchdb.allDocs({include_docs: true}, function(err, docs) {
		  for (var i = 0; i < docs.rows.length; i++) {
		  	var marker = new google.maps.Marker({
		      map: map,
		      position:  new google.maps.LatLng(docs.rows[i].doc.lat, docs.rows[i].doc.lng)
		    });
		    markersArray.push(marker);
		  };
	});
}

function removeMarkersFromMap () {
	for (var i = 0; i < markersArray.length; i++) {
       markersArray[i].setMap(null);
    }
  	markersArray = [];
}