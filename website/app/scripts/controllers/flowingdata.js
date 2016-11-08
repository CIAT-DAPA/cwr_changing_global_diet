'use strict';

/**
 * @ngdoc function
 * @name globalDietApp.controller:FlowingdataCtrl
 * @description
 * # FlowingdataCtrl
 * Controller of the globalDietApp
 */
angular.module('globalDietApp')
  .controller('FlowingdataCtrl', function ($scope, GlobalDietFactory) {
    $scope.measure = 'calories';
    $scope.source = 'food_group';
    $scope.countries = [];

    GlobalDietFactory.list($scope.source, $scope.measure).then(function (data) {

      $scope.countries = GlobalDietFactory.getCountries(data);

      var graphic = D3Graphics.Flowing;
      graphic.configuration.container = '#charts';
      graphic.configuration.container_header = '#charts_header';
      graphic.data.source = data;
      graphic.render();
    });


  });
