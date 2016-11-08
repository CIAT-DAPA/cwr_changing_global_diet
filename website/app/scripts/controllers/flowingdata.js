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
    $scope.sources = GlobalDietFactory.getSources();
    $scope.selectedSource = $scope.sources[0];
    $scope.changeSource = function (item) {
      $scope.selectedSource = item.item;
      update();
    }

    $scope.measures = GlobalDietFactory.getMeasures();
    $scope.selectedMeasure = $scope.measures[0];
    $scope.changeMeasure = function (item) {
      $scope.selectedMeasure = item.item;
      update();
    }

    $scope.countries = [];

    function update() {
      GlobalDietFactory.list($scope.selectedSource.folder, $scope.selectedMeasure.file).then(function (data) {

        $scope.countries = GlobalDietFactory.getCountries(data);

        var graphic = D3Graphics.Flowing;
        graphic.configuration.container = '#charts';
        graphic.configuration.container_header = '#charts_header';
        graphic.data.source = data;
        graphic.render();
      });
    }

    update();


  });
