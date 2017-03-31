'use strict';

describe('Service: CountryExploration', function () {

  // load the service's module
  beforeEach(module('globalDietApp'));

  // instantiate service
  var CountryExploration;
  beforeEach(inject(function (_CountryExploration_) {
    CountryExploration = _CountryExploration_;
  }));

  it('should do something', function () {
    expect(!!CountryExploration).toBe(true);
  });

});
