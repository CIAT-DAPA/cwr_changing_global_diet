'use strict';

/**
 * @ngdoc function
 * @name globalDietApp.controller:CountryComparisonCtrl
 * @description
 * # CountryComparisonCtrl
 * Controller of the globalDietApp
 */
angular.module('globalDietApp')
  .controller('CountryComparisonCtrl', function ($scope, GlobalDietFactory) {
    $scope.init = true;
    $scope.graphic = new Flowing();
    $("#countries").SumoSelect({ okCancelInMulti: true, placeholder: 'Select here', search: true, searchText: 'Enter here.',
                              captionFormatAllSelected:'{0} selected',captionFormat:'{0} selected' });

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

    function toTitleCase(str)
    {
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    function updateData() {
      GlobalDietFactory.list($scope.selectedSource.folder, $scope.selectedMeasure.file).then(function (data) {
        clearCountries();
        $scope.countries = GlobalDietFactory.getCountries(data);
        $scope.data = data;
        $scope.selectedCountries = $scope.countries.slice(0, 6).map(function(c){ return c.value;});        
        $scope.init = true;       
        
        $scope.countries.forEach(function (item, i) {
          var title = toTitleCase(item.text.replaceAll('-', ' ')); 
          title = title.replace(' And ', ' and ').replace(' Of ',' of ');
            title = title.length > 3 ? title : title.toUpperCase();            
            title = title.toUpperCase() === 'USSR' ? 'USSR' : title;

          $('#countries')[0].sumo.add(item.value,title.replaceAll('-', ' '));
          if (i < 6)
            $('#countries')[0].sumo.selectItem(item.value);
        });
        $scope.init = false;
        filterData();
        draw();
      });
    }

    function clearCountries(){
      $scope.init = true;
      $scope.countries.forEach(function (item, i) {
            $('#countries')[0].sumo.remove(0);
        });
      $scope.init = false;
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
      $scope.graphic.data.source = $scope.selectedData;
      $scope.graphic.render();
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