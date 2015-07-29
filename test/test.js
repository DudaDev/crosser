function K() {
	return this
}

GLOBAL.window = {
	postMessage: K,
	receiveMessage: K,
	addEventListener: K
};

require('babel/register');
require('./unit/crosser-test');