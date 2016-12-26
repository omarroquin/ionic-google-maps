// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'ngCordova'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
 
  $stateProvider
  .state('map', {
    url: '/',
    templateUrl: 'templates/map.html',
    controller: 'MapCtrl'
  });
 
  $urlRouterProvider.otherwise("/");
 
})

.controller('MapCtrl', function($scope, $state, $cordovaGeolocation, $interval) {
  $scope.tolls = [];
  $scope.markers = [];
  $scope.endDistance = 0;
  $scope.btn = "Iniciar";
  $scope.watchPosition = true;
  $scope.inToll = false;
  $scope.paidTolls = [];
  $scope.addressTolls = [
      {
          address: 'a 250-190, Bogotá ‎-La Caro #250104, Chía, Cundinamarca',
          sentido: 'NS'
      },
      {
          address: 'Funza-Bogotá, Mosquera, Funza, Cundinamarca, Colombia',
          sentido: ''
      }
  ];

  $scope.directionsService = [];
  $scope.directionsDisplay = [];

  $scope.directionsService[0] = new google.maps.DirectionsService();
  $scope.directionsDisplay[0] = new google.maps.DirectionsRenderer({
    polylineOptions: {
      strokeOpacity: 0
    }
  });

  $scope.directionsService[1] = new google.maps.DirectionsService();
  $scope.directionsDisplay[1] = new google.maps.DirectionsRenderer({
    suppressMarkers: true,
    preserveViewport: true,
    polylineOptions: {
      strokeColor: 'blue',
      strokeOpacity: 1,
      strokeWeight: 7
    }
  });

  ionic.Platform.ready(function(){
    // will execute when device is ready, or immediately if the device is already ready.
    var options = {timeout: 10000, enableHighAccuracy: true};
    $cordovaGeolocation.getCurrentPosition(options).then(function(position){
        var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        var mapOptions = {
            center: latLng,
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);
        placeMarker(latLng);
        GetLocationTolls();
        new google.maps.Circle();
        $scope.destino = true;
        google.maps.event.addListener($scope.map, 'click', function(event) {
            if ($scope.destino) {
              $scope.destino = false;
                var posicion = event.latLng;
                placeMarker(posicion);
                var request = {
                    origin: $scope.markers[0],
                    destination: $scope.markers[1],
                    travelMode: google.maps.TravelMode.DRIVING,
                    drivingOptions: {
                        departureTime: new Date(Date.now()),
                        trafficModel: google.maps.TrafficModel.OPTIMISTIC
                    },
                    region: 'CO',
                };
                $scope.directionsService[0].route(request, function (response, status) {
                    if (status === google.maps.DirectionsStatus.OK) {
                        $scope.initDistance = response.routes[0].legs[0].distance.value;
                        $scope.directionsDisplay[0].setDirections(response);
                        $scope.directionsDisplay[0].setMap($scope.map);
                    } else {
                    }
                });
                $scope.directionsService[1].route(request, function (response, status) {
                    if (status === google.maps.DirectionsStatus.OK) {
                        $scope.remainingDistance = response.routes[0].legs[0].distance.value;
                        $scope.directionsDisplay[1].setDirections(response);
                        $scope.directionsDisplay[1].setMap($scope.map);
                    } else {
                    }
                });
            }
        });
    }, function(error){
        console.log("Could not get location");
    }); 
  });

  $scope.initRoute = function () {
    if ($scope.watchPosition) {
      $scope.btn = "detener";
      $scope.interval = $interval(function(){
        var options = {timeout: 10000, enableHighAccuracy: true};
        $cordovaGeolocation.getCurrentPosition(options).then(function(position){
          var posicion = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          if ($scope.markers.length < 3) {
            $scope.mensajero = new google.maps.Marker({
              position: posicion,
              map: $scope.map
            });
          } else {
            $scope.mensajero.setPosition(posicion);
          }
          if (!pointInCircle($scope.markers[$scope.markers.length - 1], 10, posicion)) {
            placeMarker(posicion);
            if ($scope.markers.length > 3) {
                var routeTraveled = [];
                for (var i = 2; i < $scope.markers.length; i++) {
                  routeTraveled.push({lat: $scope.markers[i].lat(), lng: $scope.markers[i].lng()});
                }
                var flightPath = new google.maps.Polyline({
                  path: routeTraveled,
                  geodesic: true,
                  strokeColor: 'green',
                  strokeOpacity: 1.0,
                  strokeWeight: 7
                });
                flightPath.setMap($scope.map);
                $scope.endDistance = google.maps.geometry.spherical.computeLength(flightPath.getPath());
                alert($scope.endDistance);
                // var directionsNum = $scope.directionsService.length;
                // $scope.directionsService[directionsNum] = new google.maps.DirectionsService();
                // $scope.directionsDisplay[directionsNum] = new google.maps.DirectionsRenderer({
                //   suppressMarkers: true,
                //   preserveViewport: true,
                //   polylineOptions: {
                //     strokeColor: 'green',
                //     strokeOpacity: 1,
                //     strokeWeight: 7
                //   }
                // });
                // var request = {
                //     origin: $scope.markers[$scope.markers.length - 2],
                //     destination: $scope.markers[$scope.markers.length - 1],
                //     travelMode: google.maps.TravelMode.DRIVING,
                //     drivingOptions: {
                //         departureTime: new Date(Date.now()),
                //         trafficModel: google.maps.TrafficModel.OPTIMISTIC
                //     },
                //     region: 'CO',
                // };
                // $scope.directionsService[directionsNum].route(request, function (response, status) {
                //     if (status === google.maps.DirectionsStatus.OK) {
                //         $scope.endDistance += response.routes[0].legs[0].distance.value;
                //         alert($scope.endDistance);
                //         $scope.directionsDisplay[directionsNum].setDirections(response);
                //         $scope.directionsDisplay[directionsNum].setMap($scope.map);
                //     } else {
                //     }
                // });
                var request = {
                    origin: $scope.markers[$scope.markers.length - 1],
                    destination: $scope.markers[1],
                    travelMode: google.maps.TravelMode.DRIVING,
                    drivingOptions: {
                        departureTime: new Date(Date.now()),
                        trafficModel: google.maps.TrafficModel.OPTIMISTIC
                    },
                    region: 'CO',
                };
                $scope.directionsService[1].route(request, function (response, status) {
                    if (status === google.maps.DirectionsStatus.OK) {
                        $scope.remainingDistance = response.routes[0].legs[0].distance.value;
                        $scope.directionsDisplay[1].setDirections(response);
                        $scope.directionsDisplay[1].setMap($scope.map);
                    } else {
                    }
                });
            }
            if (!$scope.inToll) {
                for (var i = 0; i < $scope.tolls.length; i++) {
                    var respuesta = pointInCircle($scope.tolls[i], 40, posicion);
                    if (respuesta) {
                        $scope.tollValor = i;
                        $scope.inToll = true;
                        $scope.paidToll = i;
                        if ( ($scope.addressTolls[i].sentido == 'NS')
                          || ($scope.addressTolls[i].sentido == 'SN') 
                          || ($scope.addressTolls[i].sentido == 'WE') 
                          || ($scope.addressTolls[i].sentido == 'EW') ) {
                            $scope.initPos = posicion;
                        }
                    }
                }
            } else {
                respuesta = pointInCircle($scope.tolls[$scope.tollValor], 40, posicion);
                if (!respuesta) {
                  $scope.inToll = false;
                  if ( ($scope.addressTolls[$scope.paidToll].sentido == 'NS') 
                    || ($scope.addressTolls[$scope.paidToll].sentido == 'SN') 
                    || ($scope.addressTolls[$scope.paidToll].sentido == 'WE') 
                    || ($scope.addressTolls[$scope.paidToll].sentido == 'EW') ) {
                      $scope.finalPos = posicion;
                  }
                  switch ($scope.addressTolls[$scope.paidToll].sentido) {
                      case 'NS':
                        if ($scope.initPos.lat() > $scope.finalPos.lat()) {
                            console.log('NS');
                        }
                        break;
                      case 'SN':
                        if ($scope.initPos.lat() < $scope.finalPos.lat()) {
                            console.log('SN');
                        }
                        break;
                      case 'EW':
                        if ($scope.initPos.lng() > $scope.finalPos.lng()) {
                            console.log('EW');
                        }
                        break;
                      case 'WE':
                        if ($scope.initPos.lng() < $scope.finalPos.lng()) {
                            console.log('WE');
                        }
                        break;
                      default: 
                        console.log('Doble');
                        break;
                  }
                }
            }
          }
          
        });
      }, 5000);
      $scope.watchPosition = false;
    } else {
      $scope.btn = "Reanudar";
      alert('La distancia inicial es: ' + $scope.initDistance + '\nLa distancia recorrida es: ' + $scope.endDistance + '\nLa distancia restante es: ' + $scope.remainingDistance);
      $interval.cancel($scope.interval);
      $scope.watchPosition = true;
    }
      
  }
  // Obtiene las coordenadas LatLng de los peajes dentro de la zona de cobertura
  function GetLocationTolls() {
      var geocoder = new google.maps.Geocoder();
      for (var i = 0; i < $scope.addressTolls.length; i++) {
          geocoder.geocode({'address': $scope.addressTolls[i].address, 'componentRestrictions': {'country': 'CO'}}, function (results, status) {
              if (status == google.maps.GeocoderStatus.OK) {
                  var locationToll = results[0].geometry.location;
                  var marker = new google.maps.Marker({
                      position: locationToll,
                      map: $scope.map
                  });
                  $scope.tolls.push(locationToll);
              } else {
                  alert("Request failed. peaje No. "+i);
              }
          });
      }
  };

  // Establece en true si point se encuentra dentro del circulo con radio=radius y centro=center
  function pointInCircle(point, radius, center) {
      return (google.maps.geometry.spherical.computeDistanceBetween(point, center) <= radius);
  }

  function placeMarker(location) {
      var marker = new google.maps.Marker({
          position: location,
          map: $scope.map,
          visible: false
      });
      $scope.markers.push(marker.getPosition());
  };
});
