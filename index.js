var RSVP = require('rsvp');

var generateId = function() {
	return new Date().getTime().toString();
};

function Crosser(otherFrameWindow, origin) {

	/* private */
	this._sessionHandlers = {};
	this._listeners = {};
	this._otherFrameWindow = otherFrameWindow;
	this._otherOrigin = origin || '*';
	this._id = generateId();

	if (!this._otherFrameWindow || !this._otherFrameWindow.postMessage) {
		throw new Error('Missing frame to communicate with');
	}

	window.addEventListener("message", this._receiveMessage.bind(this), false);
};



Crosser.prototype._receiveMessage = function(event) {
	var message = event.data,
		doesOriginMatch = this._doesOriginMatch(event.origin);

	if (doesOriginMatch &&
		message &&
		message.sessionName &&
		this._sessionHandlers[message.sessionName] &&
		message.creator === this._id) {

		this._endSession(event);

	} else if (
		doesOriginMatch &&
		message &&
		message.sessionName &&
		message.creator !== this._id) {

		this._throwBackSession(event);
	}
};

Crosser.prototype._doesOriginMatch = function(eventOrigin) {
	var ret =
		(
			eventOrigin === this._otherOrigin ||
			(
				this._otherOrigin === '*' &&
				window.location.origin === eventOrigin
			)
		);
	return ret;
};

Crosser.prototype._endSession = function(event) {
	var message = event.data;
	var resolve = this._sessionHandlers[message.sessionName].resolve;
	var reject = this._sessionHandlers[message.sessionName].reject;

	this._deleteSession(message.sessionName);

	if (message.error) {
		reject(message.error);
	} else {
		resolve(message.payload);
	}
};

Crosser.prototype._throwBackSession = function(event) {
	var message = event.data,
		sessionName = message.sessionName;

	Object.keys(this._listeners[sessionName] || {}).forEach(function(subscriberId) {
		var callbackResult = this._listeners[sessionName][subscriberId](message.payload);
		if (callbackResult && callbackResult.then) {
			callbackResult.then(function(resolvedPayload) {
				this._postMessage({
					sessionName: sessionName,
					payload: resolvedPayload,
					creator: message.creator
				});
			}.bind(this))
		} else {
			this._postMessage({
				sessionName: sessionName,
				payload: callbackResult,
				creator: message.creator
			});
		}
	}, this);

};

Crosser.prototype._postMessage = function(message) {
	this._otherFrameWindow.postMessage(message, this._otherOrigin);
};

Crosser.prototype._deleteSession = function(sessionName) {
	this._sessionHandlers[sessionName].resolve = null;
	delete this._sessionHandlers[sessionName].resolve;
	this._sessionHandlers[sessionName].reject = null;
	delete this._sessionHandlers[sessionName].reject;
	this._sessionHandlers[sessionName] = null;
	delete this._sessionHandlers[sessionName];
};



Crosser.prototype.destroy = function() {
	Object.keys(this._listeners || {}).forEach(this.unsubscribe, this);
	Object.keys(this._sessionHandlers || {}).forEach(this._deleteSession, this);
	this._otherFrameWindow = null;
	this._otherOrigin = null;
	this._id = null;
};

Crosser.prototype.trigger = function(sessionName, payload) {
	var promise;

	if (this._sessionHandlers[sessionName]) {
		throw new Error('A session with the name ' + sessionName + ' is still alive');
	}

	promise = new RSVP.Promise(function(resolve, reject) {
		this._sessionHandlers[sessionName] = {
			resolve: resolve,
			reject: reject
		};
	}.bind(this));

	this._postMessage({
		sessionName: sessionName,
		payload: payload,
		creator: this._id
	});

	return promise;
};

Crosser.prototype.abort = function(sessionName) {
	this._deleteSession(sessionName);
};

Crosser.prototype.subscribe = function(sessionName, callback) {
	var subscriberId = generateId()

	this._listeners[sessionName] = this._listeners[sessionName] || {};
	if (Object.keys(this._listeners[sessionName] || {}).length > 0) {
		throw new Error('A session ( ' + sessionName + ' ) can have only one subscriber');
	}

	this._listeners[sessionName][subscriberId] = callback;
	return subscriberId;
};

Crosser.prototype.unsubscribe = function(sessionName, subscriberId) {
	if (!subscriberId) {
		Object.keys(this._listeners[sessionName] || {}).forEach(this.unsubscribe.bind(this, sessionName));
	} else {
		this._listeners[sessionName][subscriberId] = null;
		delete this._listeners[sessionName][subscriberId];
	}
};

module.exports = Crosser;