'use strict';

/**
 * @ngdoc function
 * @name globalDietApp.controller:CountryExplorationCtrl
 * @description
 * # CountryExplorationCtrl
 * Controller of the globalDietApp
 */
angular.module('globalDietApp')
  .controller('CountryExplorationCtrl', function ($scope, GlobalDietFactory, CountryFactory) {
    $scope.init = true;
    $scope.graphic = new Flowing();
    $scope.graphic.setHeader('#charts_header_country');
    $scope.graphic.setContainer('#charts_country');
    $scope.graphic.setColorByGroup(true);

    // List the countries available
    $scope.countries_list = [];
    $scope.selectedCountry = 'albania';
    CountryFactory.list().then(function (data) {
      $scope.countries_list = data;
    });

    // List the measures available
    $scope.measures = GlobalDietFactory.getMeasures();
    $scope.selectedMeasure = $scope.measures[0];
    $scope.changeMeasure = function (item) {
      $scope.selectedMeasure = item.item;
      updateData();
    }

    function filterData() {
      $scope.selectedData = $scope.data.map(function (obj) {
        var row = {};
        var keys = Object.keys(obj);
        row["year"] = obj.year;

        keys.forEach(function (d) {
          if (d !== 'year')
            row[d] = parseFloat(obj[d]);
        });
        
        return row;
      });
    }

    function draw() {
      $('#charts_country').html('');
      $('#charts_header_country').html('');
      $scope.graphic.data.source = $scope.selectedData;
      $scope.graphic.render();
    }

    function updateData() {
      GlobalDietFactory.listByCountry($scope.selectedMeasure.file, $scope.selectedCountry).then(function (data) {
        $scope.data = data;
        filterData();
        draw();
      });
    }

    updateData();

  });


