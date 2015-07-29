import Promise from './modules/promise/rsvp-promise';
import getCrosserClass from './modules/crosser/get-crosser-class';

var Crosser = getCrosserClass({
	Promise: Promise
});

if (window) {
	window.Crosser = Crosser;
}

export default Crosser;
