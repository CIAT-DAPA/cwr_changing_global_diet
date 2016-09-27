'use strict';

/**
 * @ngdoc function
 * @name globalDietApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the globalDietApp
 */
angular.module('globalDietApp')
  .controller('MainCtrl', ['$scope', '$window', function ($scope, $window) {
    var currentIndex;
    function updateSnapIndexFromHash() {
      var index = parseInt($window.location.hash.slice(1), 10);
      if (isNaN(index) || !angular.isNumber(index)) {
        return;
      }
      $scope.snapIndex = index;
    }
    $scope.beforeSnap = function (snapIndex) {
      $window.location.hash = currentIndex = snapIndex;
    }
    $scope.snapAnimation = false; // turn animation off for the initial snap on page load
    $scope.afterSnap = function (snapIndex) {
      $scope.snapAnimation = true; // // turn animation on after the initial snap
    };
    setInterval(updateSnapIndexFromHash, 250);
    updateSnapIndexFromHash();
    $scope.swipeUp = function () {
      $scope.snapIndex++;
    };
    $scope.swipeDown = function () {
      $scope.snapIndex--;
    };
  }]);
