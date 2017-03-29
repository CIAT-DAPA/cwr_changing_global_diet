'use strict';

/**
 * @ngdoc function
 * @name globalDietApp.controller:CountryComparisonCtrl
 * @description
 * # CountryComparisonCtrl
 * Controller of the globalDietApp
 */
angular.module('globalDietApp')
  .controller('HomeCtrl', function ($scope, GlobalDietFactory) {
    $scope.init = true;
    $scope.graphic = new Flowing();
    $scope.graphic.setHeader('#charts_header_home');
    $scope.graphic.setContainer('#charts_home');

    $scope.sources = GlobalDietFactory.getSources();
    $scope.selectedSource = $scope.sources[1];

    $scope.measures = GlobalDietFactory.getMeasures();
    $scope.selectedMeasure = $scope.measures[1];
    
    $scope.selectedCountries = ["brazil","china","india","kenya","usa","vietnam"];

    function updateData() {
      GlobalDietFactory.list($scope.selectedSource.folder, $scope.selectedMeasure.file).then(function (data) {       
        $scope.data = data;
        filterData();
        draw();
      });
    }

    function filterData() {
      $scope.selectedData = $scope.data.map(function (obj) {
        var row = {};
        var keys = Object.keys(obj);
        row["year"] = obj.year;
        $scope.selectedCountries.forEach(function (item) {
          keys.forEach(function (d) {
            if (d.startsWith(item + "_"))
              row[d] = obj[d];
          });
        });
        return row;
      });
    }

    function draw() {
      $('#charts_home').html('');
      $('#charts_header_home').html('');
      $scope.graphic.data.source = $scope.selectedData;
      $scope.graphic.render();
    }

    updateData();


  });

