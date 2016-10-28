'use strict';

/**
 * @ngdoc service
 * @name globalDietApp.GlobalDietFactory
 * @description
 * # GlobalDietFactory
 * Factory in the globalDietApp.
 */
angular.module('globalDietApp')
  .factory('GlobalDietFactory', function (config) {
    var dataFactory = {};

    
    /** Get the url of the file that have all data information */
    function getDataSource(source, measure){
      var data_folder = 'data/';
      return data_folder + source + '/' + measure + '.tsv';
    }

    /** Get data for the graphic flowing data */
    dataFactory.list = function (source, measure) {
      var items = $http.get().success(function (data) {
        return data;
      });
      return items;
    }
    
    return dataFactory;
  });
