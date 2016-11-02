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
    var source = 'food_group';
    var measure = 'calories';

    $scope.countries = [];

    GlobalDietFactory.list(source, measure).then(function (data) {

      $scope.countries = GlobalDietFactory.getCountries(data);

      var graphic = D3Graphics.Flowing;
      graphic.configuration.container = '#charts';
      graphic.configuration.container_header = '#charts_header';
      graphic.data.source = data;
      graphic.render();
    });


  });
