'use strict';

/**
 * @ngdoc service
 * @name globalDietApp.GlobalDietFactory
 * @description
 * # GlobalDietFactory
 * Factory in the globalDietApp.
 */
angular.module('globalDietApp')
  .factory('CSV2Json',function () {
    // Service logic
    // ...

    var dataFactory = {};

    dataFactory.parse = function (csv) {
      var lines=csv.split("\n");
      var result = [];
      var headers=lines[0].split(",");      
      for(var i=1;i<lines.length;i++){
        var obj = {};
        var currentline=lines[i].split(",");
        for(var j=0;j<headers.length;j++){
          obj[headers[j]] = currentline[j];
        }
        result.push(obj);
      }
      return result; 
      //return JSON.parse(JSON.stringify(result)) ; //JSON
    }

    return dataFactory;
  })
  .factory('GlobalDietFactory', function ($http,CSV2Json) {
    var dataFactory = {};
    
    /** Get the url of the file that have all data information */
    function getDataSource(source, measure) {
      var data_folder = 'data/';
      return data_folder + source + '/' + measure + '.csv';
    }


    /** Get data for the graphic flowing data */
    dataFactory.list = function (source, measure) {
      var items = $http.get(getDataSource(source, measure)).success(function (data) {
        return data;
      });
      return items;
    }

    return dataFactory;
  });
