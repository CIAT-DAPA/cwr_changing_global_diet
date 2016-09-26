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

    dataFactory.list = function () {
      var items = $http.get(config.global_diet_tsv).success(function (data) {
        return data;
      });
      return items;
    }
    return dataFactory;
  });
