'use strict';

/**
 * @ngdoc overview
 * @name globalDietApp
 * @description
 * # globalDietApp
 *
 * Main module of the application.
 */
angular.module('globalDietApp', []);

String.prototype.startsWith = function (str) {
  return !this.indexOf(str);
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};