app
    .factory('DATA', function() {
        var userLat;
        var userLon;
        var nearestStopsGroup = [{
            stopNo: 0,
            stopName: ""
        }, {
            stopNo: 0,
            stopName: ""
        }, {
            stopNo: 0,
            stopName: ""
        }];
        var availableRoutes = [];
        var selectedRouteNo;
        var selectedRouteHeading;
        var selectedStopNo;
        var selectedStopName;
        var ifStopChanged = false;
        var remains;
        var busLat;
        var busLon;

        return {
            setUserLocation: function(lat, lon) {
                userLat = lat;
                userLon = lon;
            },
            getUserLocation: function() {
                return {
                    lat: userLat,
                    lon: userLon
                };
            },

            getSelectedStopName:function(){
                return selectedStopName;
            },
            setSelectedStopName:function(a){
                selectedStopName = a;
            },

            getNearestStopsGroup: function() {
                return nearestStopsGroup;
            },
            setNearestStopsGroup: function(a, b, c) {
                nearestStopsGroup[a].stopNo = b;
                nearestStopsGroup[a].stopName = c;
            },
            getProperStopNo: function(a) {
                return nearestStopsGroup[a].stopNo;
            },

            getNearestStopName: function() {
                return nearestStopsGroup[0].stopName;
            },

            addToAvailableRoutes: function(a) {
                availableRoutes.push(a);
            },
            clearAvailableRoutes: function() {
                availableRoutes = [];
            },
            getAvailableRoutes: function() {
                return availableRoutes;
            },

            setSelectedStopNo:function(a){
                selectedStopNo = a;
            },
            getSelectedStopNo:function(){
                return selectedStopNo;
            },
            setSelected_RouteNoAndRouteHeadingAndStopNo: function(a, b, c) {
                selectedRouteNo = a;
                selectedRouteHeading = b;
                selectedStopNo = c;
            },
            getSelected_RouteNoAndRouteHeadingAndStopNo: function() {
                return {
                    selectedRouteNo: selectedRouteNo,
                    selectedRouteHeading: selectedRouteHeading,
                    selectedStopNo: selectedStopNo
                };
            },

            setIfStopChanged:function(a){
                ifStopChanged = a;
            },
            getIfStopChanged:function(){
                return ifStopChanged;
            },

            setRmains: function(a) {
                remains = a;
            },
            getRemains: function() {
                return remains;
            },

            setBusLocation: function(a, b) {
                busLat = a;
                busLon = b;
            },
            getBusLocation: function() {
                return {
                    lat: busLat,
                    lon: busLon
                };
            }
        };
    })

.factory('TIME', function() {
    return {
        getArrivalTime: function(amount) {
            var currentTime = new Date();
            var currentHrs = currentTime.getHours();
            var currentMins = currentTime.getMinutes();
            var newHrs;
            var newMins;
            var newTime;

            if (amount >= 60) {
                if (amount == 60) {
                    newHrs = currentHrs + 1;
                    newMins = currentMins;
                } else {
                    hrs = parseInt(amount / 60);
                    mins = amount - 60;
                    newHrs = currentHrs + hrs;
                    newMins = currentMins + mins;
                }
            } else {
                newMins = currentMins + amount;
                if (newMins >= 60) {
                    if (newMins == 60) {
                        newHrs = currentHrs + 1;
                        newMins = 0;
                    } else {
                        newHrs = currentHrs + 1;
                        newMins = newMins - 60;
                    }
                } else {
                    newHrs = currentHrs;
                }
            }
            return this.formatTime([newHrs, newMins]);
        },
        formatTime: function(array) {
            for (var i = 0; i < 2; i++) {
                if (array[i] < 10) {
                    array[i] = "0" + array[i];
                }
            }
            return array[0] + " : " + array[1];
        },
        formatRemains: function(remains) {
            if (remains < 10) {
                remains = "0" + remains;
            }
            return remains;
        }
    }
})

.service('GEO', ['$q', 'DATA', function($q, DATA) {

    this.fetchCurrentLocation = function() {
        var deferred = $q.defer();

        if (navigator.geolocation) {
            var params = {
                enableHighAccuracy: true
            };

            function gpsSuccess(position) {
                DATA.setUserLocation(position.coords.latitude, position.coords.longitude);
                deferred.resolve("fetchCurrentLocation Completed");
            };

            function gpsError(error) {
                var errors = {
                    1: 'Permission denied',
                    2: 'Position unavailable',
                    3: 'Request timeout'
                };
                deferred.reject(errors[error.code]);
            };
            navigator.geolocation.getCurrentPosition(gpsSuccess, gpsError, params);
        } else {
            deferred.reject("Can't Get Current GPS Location");
        }

        return deferred.promise;
    };

    // this.trackUserLocationByDistance = function() {
    //     var deferred = $q.defer();

    //     var oldLocation = DATA.getUserLocation();

    //     this.fetchCurrentLocation().then(function(response) {

    //         Number.prototype.toRad = function() {
    //             return this * Math.PI / 180;
    //         }

    //         var R = 6371; // km
    //         var φ1 = oldLocation.lat.toRad();
    //         var φ2 = response.lat.toRad();
    //         var Δφ = (response.lat - oldLocation.lat).toRad();
    //         var Δλ = (response.lon - oldLocation.lon).toRad();
    //         var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    //             Math.cos(φ1) * Math.cos(φ2) *
    //             Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    //         var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    //         var distance = R * c;

    //         if (distance >= 0.05) {
    //             //user leaves more than 50m
    //             deferred.resolve(true);
    //         } else {
    //             //user still within 50m
    //             return deferred.resolve(false);
    //         }

    //     });

    //     return deferred.promise;
    // };
}])

.service('BUS', ['$http', '$q', 'GEO', 'DATA', 'TIME', function($http, $q, GEO, DATA, TIME) {

    this.getNearestStopNo = function() {
        var deferred = $q.defer();

        GEO.fetchCurrentLocation().then(function(response) {
                console.log(response);

                var userLocation = DATA.getUserLocation();

                var stopDistance = 100;
                var stopDistanceClosest = 100;
                var stopDistanceSecondClosest = 101;
                var stopDistanceThirdClosest = 102;
                var lengthOfData = (stopData.stops.length);

                for (var i = 0; i < lengthOfData; i++) {
                    var unit = "K";
                    var lat2 = stopData.stops[i].stop_lat;
                    var lon2 = stopData.stops[i].stop_lon;
                    //User Location
                    var radlat1 = Math.PI * userLocation.lat / 180;
                    var radlon1 = Math.PI * userLocation.lon / 180;
                    //Compare to this Location 
                    var radlat2 = Math.PI * lat2 / 180;
                    var radlon2 = Math.PI * lon2 / 180;
                    var theta = userLocation.lon - lon2;
                    var radtheta = Math.PI * theta / 180;
                    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                    dist = Math.acos(dist);
                    dist = dist * 180 / Math.PI;
                    dist = dist * 60 * 1.1515;
                    dist = dist * 1.609344; // Calculates Distance in KM's
                    // if (dist < 0.009) //If bus stop is less than 10m then its the closest one - improve performance
                    // {
                    //     stopDistance = dist;
                    //     DATA.setNearestStopNo(stopData.stops[i].stop_code);
                    //     break;
                    // } else if (dist < stopDistance) { // if distance is less than 100km its the least - then every one less than that is set to be the closest 
                    //     stopDistance = dist;
                    //     DATA.setNearestStopNo(stopData.stops[i].stop_code);
                    // }
                    if (dist < stopDistanceThirdClosest) { // if the calculated distance is less than the third closest Bus Stop
                        if (dist < stopDistanceSecondClosest) { // if the calculated distance is less than the second closest bus stop
                            if (dist < stopDistanceClosest) { //if if distance is closest
                                stopDistanceClosest = dist; //This is the closest
                                DATA.setNearestStopsGroup(0, stopData.stops[i].stop_code, stopData.stops[i].stop_name);
                            } else { //Distance was closer than second but not closest
                                stopDistanceSecondClosest = dist; //This is the second closest
                                stopDistance = dist;
                                DATA.setNearestStopsGroup(1, stopData.stops[i].stop_code, stopData.stops[i].stop_name);
                            }
                        } else { // the distance is closer than third closest, but not the others so we set third closest to dist
                            stopDistanceThirdClosest = dist; //This is the third closest
                            DATA.setNearestStopsGroup(2, stopData.stops[i].stop_code, stopData.stops[i].stop_name);
                        }
                    }
                }

                if (DATA.getProperStopNo(0) != "null") {
                    deferred.resolve(DATA.getProperStopNo(0));
                } else {
                    deferred.reject("Can not get nearestStopNo");
                }
            },
            function(reason) {
                alert("Error: " + reason + "Plaease restart the app");
            });


        return deferred.promise;
    };

    this.getAvailableRoutes = function(hasNearestStop, stopNo) {
        var deferred = $q.defer();

        DATA.clearAvailableRoutes();

        function successCallback(stopNo) {

            var data = new FormData();
            data.append('appID', '3ed05f4e');
            data.append('apiKey', 'ac5d0c9d51367d8ddc710e2742ced3bc');
            data.append('stopNo', stopNo);
            //data.append('format', 'json'); 

            var request = new XMLHttpRequest();
            request.onload = function() {
                if (request.readyState == 4 && request.status == 200) {

                    // Parse the responseText as XML format
                    var responseXML = (new DOMParser()).parseFromString(this.responseText, "text/xml");

                    // Get the total buses available for the bus stop
                    var totalRoutes = responseXML.getElementsByTagName("Routes")[0].childNodes.length;

                    // Only get the bus routes if there is at least 1 route available at the bus stop
                    if (totalRoutes > 0) {

                        var availableRoute = {
                            routeNo: "",
                            gpsTime: "",
                            routeHeading: ""
                        };

                        // Loop through each bus routes
                        for (var i = 0; i < totalRoutes; i++) {
                            // Get each bus routes
                            var route = responseXML.getElementsByTagName("Route")[i];

                            availableRoute.routeNo = route.getElementsByTagName("RouteNo")[0].textContent;
                            availableRoute.routeHeading = route.getElementsByTagName("RouteHeading")[0].textContent;

                            // Get the total trips available for that bus route
                            var totalTrips = route.getElementsByTagName("Trips")[0].childNodes.length;

                            // Only get the bus schedules if there is at least 1 trip available for that bus route
                            if (totalTrips > 0) {

                                var firstTrip = route.getElementsByTagName("Trip")[0];

                                //Get the adjusted schedule time
                                var adjustedScheduleTime = parseInt(firstTrip.getElementsByTagName("AdjustedScheduleTime")[0].textContent);
                                availableRoute.gpsTime = TIME.getArrivalTime(adjustedScheduleTime);
                                DATA.addToAvailableRoutes(availableRoute);
                                deferred.resolve("Available Get Completed");
                            } else {
                                availableRoute.gpsTime = "--";
                                DATA.addToAvailableRoutes(availableRoute);
                                deferred.reject("Buses available but not trip right now");
                            }
                        }
                    } else {
                        deferred.reject("No buses available for this bus stop");
                    }
                } else {
                    deferred.reject("XMLHttpRequest for getAvailableRoutes crashed");
                }

            };

            request.open("POST", "http://api.octranspo1.com/v1.2/GetNextTripsForStopAllRoutes");
            request.setRequestHeader('Access-Control-Allow-Origin', '*');
            request.send(data);
        };

        if (hasNearestStop) {
            successCallback(stopNo);
        } else {
            this.getNearestStopNo().then(successCallback, function(reason) {
                alert("Error: " + reason + "Plaease restart the app");
            });
        };

        return deferred.promise;
    };

    this.getMap = function(routeNo, routeHeading, stopNo) {
        var deferred = $q.defer();

        var data = new FormData();
        data.append('appID', '3ed05f4e');
        data.append('apiKey', 'ac5d0c9d51367d8ddc710e2742ced3bc');
        data.append('routeNo', routeNo)
        data.append('stopNo', stopNo);

        var request = new XMLHttpRequest();
        request.onload = function() {
            if (request.readyState == 4 && request.status == 200) {
                // Parse the responseText as XML format
                var responseXML = (new DOMParser()).parseFromString(this.responseText, "text/xml");
                // Get the number of all directions available for this bus route
                var totalDirections = responseXML.getElementsByTagName("Route")[0].childNodes.length;
                // Only get the schedule if there is at least 1 direction
                if (totalDirections > 0) {
                    // Loop through each directions to find the correct route destination
                    for (var i = 0; i < totalDirections; i++) {
                        var routeDirection = responseXML.getElementsByTagName("RouteDirection")[i];
                        var routeLabel = routeDirection.getElementsByTagName("RouteLabel")[0].textContent;
                        // Check if the route label is the same with the selected route destination
                        if (routeLabel == routeHeading) {
                            // Get the number of all trips available for this destination
                            var totalTrips = routeDirection.getElementsByTagName("Trips")[0].childNodes.length;
                            // Only get the schedule if there is at least 1 trip
                            if (totalTrips > 0) {
                                var firstTrip = routeDirection.getElementsByTagName("Trip")[0];
                                var remains = firstTrip.getElementsByTagName("AdjustedScheduleTime")[0].textContent;
                                DATA.setRmains(TIME.formatRemains(remains));
                                DATA.setBusLocation(firstTrip.getElementsByTagName("Latitude")[0].textContent, firstTrip.getElementsByTagName("Longitude")[0].textContent);

                                deferred.resolve("getMap Success");
                            } else {
                                deferred.reject("No trips available");
                            }
                        }
                    }
                } else {
                    deferred.reject("No direction available for this bus");
                }
            } else {
                deferred.reject("XMLHttpRequest for getMap crashed");
            }
        };

        request.open("POST", "http://api.octranspo1.com/v1.2/GetNextTripsForStop");
        request.setRequestHeader('Access-Control-Allow-Origin', '*');
        request.send(data);

        return deferred.promise;
    };
}]);
