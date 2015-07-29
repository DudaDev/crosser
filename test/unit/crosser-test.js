import Crosser from '../../lib/crosser';

var assert = require("assert")
describe('Module 1', function() {

	it('it works', function() {
		var crosser = new Crosser(window);
		assert.ok(typeof crosser === 'object');
	});

});