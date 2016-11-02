'use strict';

/**
 * @ngdoc function
 * @name globalDietApp.controller:FlowingdataCtrl
 * @description
 * # FlowingdataCtrl
 * Controller of the globalDietApp
 */
angular.module('globalDietApp')
  .controller('FlowingdataCtrl', function (GlobalDietFactory,CSV2Json) {
    var source = 'food_group';
    var measure = 'calories';
    GlobalDietFactory.list(source,measure).then(function(data){
      var graphic = D3Graphics.Flowing;
      graphic.configuration.container = '#charts';
      graphic.data.source = CSV2Json.parse(data.data);
      graphic.render();
    });
    
  });
