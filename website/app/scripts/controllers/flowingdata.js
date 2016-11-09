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
    $scope.init = true;

    $scope.sources = GlobalDietFactory.getSources();
    $scope.selectedSource = $scope.sources[0];
    $scope.changeSource = function (item) {
      $scope.selectedSource = item.item;
      updateData();
    }

    $scope.measures = GlobalDietFactory.getMeasures();
    $scope.selectedMeasure = $scope.measures[0];
    $scope.changeMeasure = function (item) {
      $scope.selectedMeasure = item.item;
      updateData();
    }

    $scope.countries = [];
    $scope.selectedCountries = [];



    function updateData() {
      GlobalDietFactory.list($scope.selectedSource.folder, $scope.selectedMeasure.file).then(function (data) {
        $scope.countries = GlobalDietFactory.getCountries(data);
        $scope.data = data;
        $scope.selectedCountries = $scope.countries.slice(0, 6).map(function(c){ return c.value;});
        filterData();
        draw();
        $scope.init = true;
        $("#countries").SumoSelect({ okCancelInMulti: true, placeholder: 'Select countries' });
        $scope.countries.forEach(function (item, i) {
          $('#countries')[0].sumo.add(item.value,item.text);
          if (i < 6)
            $('#countries')[0].sumo.selectItem(item.value);
        });
        $scope.init = false;

      });
    }

    $('#countries').change(function () {
      if (!$scope.init) {
        $scope.selectedCountries = $(this).val();
        filterData();
        draw();
      }
    });

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
      $('#charts').html('');
      $('#charts_header').html('');
      var graphic = D3Graphics.Flowing;
      graphic.configuration.container = '#charts';
      graphic.configuration.container_header = '#charts_header';
      graphic.configuration.container_year = '#yearvalue';
      graphic.controls.speed = 750;
      graphic.data.source = $scope.selectedData;
      graphic.render();
    }

    updateData();


  });

String.prototype.startsWith = function (str) {
  return !this.indexOf(str);
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};