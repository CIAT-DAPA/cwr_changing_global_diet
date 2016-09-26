'use strict';

/**
 * @ngdoc overview
 * @name globalDietApp
 * @description
 * # globalDietApp
 *
 * Main module of the application.
 */
angular
  .module('globalDietApp', [
    'ngCookies',
    'ngRoute'
  ])
  .value('config',{
      global_diet_tsv: 'data/global_diet_tsv.tsv'
  })
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/flowingdata', {
        templateUrl: 'views/flowingdata.html',
        controller: 'FlowingdataCtrl',
        controllerAs: 'cflowingdata'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
