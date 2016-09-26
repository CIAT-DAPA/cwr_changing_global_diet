'use strict';

describe('Controller: FlowingdataCtrl', function () {

  // load the controller's module
  beforeEach(module('globalDietApp'));

  var FlowingdataCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    FlowingdataCtrl = $controller('FlowingdataCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(FlowingdataCtrl.awesomeThings.length).toBe(3);
  });
});
