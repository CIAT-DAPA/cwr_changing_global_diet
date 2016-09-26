'use strict';

describe('Service: GlobalDietFactory', function () {

  // load the service's module
  beforeEach(module('globalDietApp'));

  // instantiate service
  var GlobalDietFactory;
  beforeEach(inject(function (_GlobalDietFactory_) {
    GlobalDietFactory = _GlobalDietFactory_;
  }));

  it('should do something', function () {
    expect(!!GlobalDietFactory).toBe(true);
  });

});
