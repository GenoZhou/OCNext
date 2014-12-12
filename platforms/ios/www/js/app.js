// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('starter', ['ionic', 'uiGmapgoogle-maps']);

app
    .run(function($ionicPlatform) {
        $ionicPlatform.ready(function() {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
        });

        ionic.on("online", function() {
            alert("Welcome! You're online! In the first page, you can pull down to refresh, and tap the header to change the bus station.");
        }, document);

        ionic.on("offline", function() {
            alert("What? You're offline? Full functionality currently can only be supportted online.");
        }, document);
    })

.config(function($stateProvider, $urlRouterProvider, uiGmapGoogleMapApiProvider) {
    $stateProvider
        .state('index', {
            url: '/',
            templateUrl: 'home.html',
            controller: 'mainCtrl'
        })
        .state('detail', {
            url: '/detail',
            templateUrl: 'detail.html',
            controller: 'detailCtrl'
        });

    $urlRouterProvider.otherwise("/");

    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyB5dqkpbugxf52H_3aNZSAmO1DG5L8J8uM',
        v: '3.17',
        libraries: 'weather,geometry,visualization'
    });
});
