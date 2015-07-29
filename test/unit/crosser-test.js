import module1 from '../../lib/modules/module-1';

var assert = require("assert")
describe('Module 1', function() {

	it('it works', function() {
		assert.equal(module1, 'module-1');
	});

});