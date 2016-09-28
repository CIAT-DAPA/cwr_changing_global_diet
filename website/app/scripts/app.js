'use strict';

/**
 * @ngdoc overview
 * @name globalDietApp
 * @description
 * # globalDietApp
 *
 * Main module of the application.
 */
angular.module('globalDietApp', ['swipe','snapscroll'])
  .value('config', {
    calories_tsv: 'data/calories.tsv'
  });