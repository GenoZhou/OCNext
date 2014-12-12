app

    .controller('mainCtrl', ['$scope', '$location', '$interval', '$ionicPopover', '$ionicPopup', '$ionicLoading', 'BUS', 'GEO', 'DATA', function($scope, $location, $interval, $ionicPopover, $ionicPopup, $ionicLoading, BUS, GEO, DATA) {
    $ionicLoading.show({
        template: 'Loading...'
    });
    $scope.selectedStopNo = 0;

    if ($interval) {
        $interval.cancel();
    };

    $scope.goDetails = function(selectedRouteNo, selectedRouteHeading, selectedStopNo) {
        console.log(selectedStopNo);
        DATA.setSelected_RouteNoAndRouteHeadingAndStopNo(selectedRouteNo, selectedRouteHeading, selectedStopNo);
        $location.path('/detail');
    };

    // $scope.startTrack = function() {
    //     $interval(function() {
    //         GEO.trackUserLocationByDistance($rootScope.userLat,$rootScope.userLon).then(function(response) {
    //             if (response) {
    //                 $interval.cancel();
    //                 //show popup to ask user to refresh
    //                 var confirmPopup = $ionicPopup.confirm({
    //                     title: 'Do you need refresh?',
    //                     template: 'Seem you are >50m away from you origin...'
    //                 });
    //                 confirmPopup.then(function(res) {
    //                     if (res) {
    //                         $scope.doRefresh();
    //                     }
    //                 });
    //             }
    //         });
    //     }, 2000);
    // }

    $scope.doRefresh = function(ifStopChanged) {
        var promise;
        if (ifStopChanged) {
            promise = BUS.getAvailableRoutes(true, DATA.getSelectedStopNo());
            promise
                .then(function(response) {
                    console.log(response);
                    $scope.selectedStopNo = DATA.getSelectedStopNo();
                    $scope.title = DATA.getSelectedStopName();
                    $scope.availableRoutes = DATA.getAvailableRoutes();
                    //$scope.startTrack();
                }, function(reason) {
                    alert("Error: " + reason + "Please restart the app");
                })
                .finally(function() {
                    $ionicLoading.hide();
                    $scope.$broadcast('scroll.refreshComplete');
                });
        } else {
            promise = BUS.getAvailableRoutes(false);
            promise
                .then(function(response) {
                    console.log(response);
                    $scope.selectedStopNo = DATA.getProperStopNo(0);
                    console.log($scope.selectedStopNo);
                    $scope.title = DATA.getNearestStopName();
                    DATA.setSelectedStopName($scope.title);
                    $scope.availableRoutes = DATA.getAvailableRoutes();
                    //$scope.startTrack();
                }, function(reason) {
                    alert("Error: " + reason + "Please restart the app");
                })
                .finally(function() {
                    $ionicLoading.hide();
                    $scope.$broadcast('scroll.refreshComplete');
                });
        }

    };

    $scope.doRefresh(DATA.getIfStopChanged());

    $ionicPopover.fromTemplateUrl('popover.html', {
        scope: $scope,
    }).then(function(popover) {
        $scope.popover = popover;
    });
    $scope.openPopover = function($event) {
        $scope.popover.show($event);
        $scope.stops = DATA.getNearestStopsGroup();
    };
    $scope.closePopover = function() {
        $scope.popover.hide();
    };
    //Cleanup the popover when we're done with it!
    $scope.$on('$destroy', function() {
        $scope.popover.remove();
    });

    $scope.changeStop = function(index, stopName) {
        $ionicLoading.show({
            template: 'Loading...'
        });
        $scope.selectedStopNo = DATA.getProperStopNo(index);
        DATA.setSelectedStopNo($scope.selectedStopNo);
        DATA.setIfStopChanged(true);
        $scope.title = stopName;
        DATA.setSelectedStopName($scope.title);
        BUS.getAvailableRoutes(true, $scope.selectedStopNo)
            .then(function(response) {
                console.log(response);
                $scope.availableRoutes = DATA.getAvailableRoutes();
                //$scope.startTrack();
            }, function(reason) {
                alert("Error: " + reason + "Please restart the app");
            })
            .finally(function() {
                $scope.closePopover();
                $ionicLoading.hide();
            });
    };

}])

.controller('detailCtrl', ['$scope', 'uiGmapGoogleMapApi', '$interval', '$ionicLoading', 'BUS', 'DATA', function($scope, uiGmapGoogleMapApi, $interval, $ionicLoading, BUS, DATA) {
    $ionicLoading.show({
        template: 'Loading...'
    });
    $scope.ifLoadingDismissed = false;

    $scope.ifRefreshing = false;
    $scope.ifSoon = false;
    $scope.ifBusLocationNotAvailable = false;

    //for Google Map:
    $scope.icon = "../img/ocBus.png";
    var data = DATA.getSelected_RouteNoAndRouteHeadingAndStopNo();
    console.log(data.selectedStopNo);
    $scope.routeNo = data.selectedRouteNo;
    $scope.routeHeading = data.selectedRouteHeading;
    var userLocation = DATA.getUserLocation();
    $scope.map = {
        center: {
            latitude: userLocation.lat,
            longitude: userLocation.lon
        },
        zoom: 14
    };
    $scope.markers = [];

    $interval(function() {
        //hide refreshing icon when bus coming soon
        if ($scope.ifSoon) {
            $scope.ifRefreshing = false;
        } else {
            $scope.ifRefreshing = true;
        }

        var promise = BUS.getMap(data.selectedRouteNo, data.selectedRouteHeading, data.selectedStopNo);
        promise.then(function(response) {
            console.log(response);
            $scope.remains = DATA.getRemains();
            //replace remains time by text
            if (parseInt($scope.remains) == 1) {
                $scope.ifSoon = true;
            } else {
                $scope.ifSoon = false;
            }
            var busLocation = DATA.getBusLocation();
            if (busLocation.lat.length > 0 || busLocation.lon.length > 0) {
                $scope.ifBusLocationNotAvailable = false;
                $scope.markers = [{
                    id: 0,
                    latitude: busLocation.lat,
                    longitude: busLocation.lon,
                    icon: 'http://xxmagi.com/ocBus.png'
                }, {
                    id: 1,
                    latitude: userLocation.lat,
                    longitude: userLocation.lon,
                    icon: 'http://xxmagi.com/user.png'
                }];
            } else {
                $scope.ifBusLocationNotAvailable = true;
            }


            if (!$scope.ifLoadingDismissed) {
                $ionicLoading.hide();
                $scope.ifLoadingDismissed = true;
            }
            $scope.ifRefreshing = false;
        }, function(reason) {
            alert("Error: " + reason + "Please restart the app");
        });
    }, 10000);

}]);
