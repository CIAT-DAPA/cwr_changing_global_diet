'use strict';

/**
 * @ngdoc service
 * @name globalDietApp.GlobalDietFactory
 * @description
 * # GlobalDietFactory
 * Factory in the globalDietApp.
 */
angular.module('globalDietApp')
  .factory('CSV2Json', function () {
    // Service logic
    // ...

    var dataFactory = {};

    dataFactory.parse = function (csv) {
      var lines = csv.split("\n");
      var result = [];
      var headers = lines[0].split(",");
      for (var i = 1; i < lines.length; i++) {
        var obj = {};
        var currentline = lines[i].split(",");
        for (var j = 0; j < headers.length; j++) {
          obj[headers[j]] = currentline[j];
        }
        result.push(obj);
      }
      return result;
      //return JSON.parse(JSON.stringify(result)) ; //JSON
    }

    return dataFactory;
  })
  .factory('GlobalDietFactory', function ($http, CSV2Json) {
    var dataFactory = {};

    /** Get the url of the file that have all data information */
    function getDataSource(source, measure) {
      var data_folder = 'data/';
      return data_folder + source + '/' + measure;
    }


    /** Get data for the graphic flowing data */
    dataFactory.list = function (source, measure) {
      var items = $http.get(getDataSource(source, measure)).then(function (response) {
        return CSV2Json.parse(response.data);
      });
      return items;
    }

    /** Get the list countries from data  */
    dataFactory.getCountries = function (data) {
      var keys=Object.keys(data[0]).filter(function (key) { return key !== "year"; });      
      var countries = [];
      keys.forEach(function(c){
        var words = c.split("_");
        if(countries.indexOf(words[0]) < 0 && words[0] !== "")
          countries.push(words[0]);
      });
      return countries.map(function(c){
        var title = c.charAt(0).toUpperCase() + c.slice(1);  
        return {text:c.replaceAll('-',' '),value:c}; 
      });
    }

    dataFactory.getSources = function () {
      var sources=[];
      sources.push({title:'Food weight',folder:'food_group'});
      sources.push({title:'Crop',folder:'crop'});
      return sources;
    }

    dataFactory.getMeasures = function () {
      var measures=[];
      measures.push({title:'Calories (kcal/capita/day)',file:'calories.csv'});
      measures.push({title:'Fat (g/capita/day)',file:'fat.csv'});
      measures.push({title:'Food quantity (g/capita/day)',file:'food_quantity.csv'});
      measures.push({title:'Protein (g/capita/day)',file:'protein.csv'});
      return measures;
    }

    return dataFactory;
  });
