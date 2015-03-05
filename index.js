var assign = require('object-assign');
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
	var message = event.data;

	if (event.origin === this._otherOrigin &&
		message &&
		message.sessionId &&
		message.sessionName &&
		this._sessionHandlers[message.sessionId] &&
		message.creator === this._id) {

		this._endSession(event);

	} else if (
		event.origin === this._otherOrigin &&
		message &&
		message.sessionId &&
		message.sessionName &&
		message.creator !== this._id) {

		this._throwBackSession(event);
	}
};

Crosser.prototype._endSession = function(event) {
	var message = event.data;
	var resolve = this._sessionHandlers[message.sessionId].resolve;
	var reject = this._sessionHandlers[message.sessionId].reject;

	this._deleteSession(message.sessionId);

	if (message.error) {
		reject(message.error);
	} else {
		resolve(message.payload);
	}
};

Crosser.prototype._throwBackSession = function(event) {
	var message = event.data,
		sessionName = message.sessionName;

	Object.keys(this._listeners[message.sessionName]).forEach(function(subscriberId) {
		var callbackResult = this._listeners[sessionName][subscriberId](message.payload);
		if (callbackResult && callbackResult.then) {
			callbackResult.then(function(resolvedPayload) {
				this._postMessage({
					sessionId: message.sessionId,
					sessionName: sessionName,
					payload: resolvedPayload,
					creator: message.creator
				});
			}.bind(this))
		} else {
			this._postMessage({
				sessionId: message.sessionId,
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

Crosser.prototype._deleteSession = function(sessionId) {
	delete this._sessionHandlers[sessionId].resolve;
	this._sessionHandlers[sessionId].resolve = null;
	delete this._sessionHandlers[sessionId].reject;
	this._sessionHandlers[sessionId].reject = null;
	delete this._sessionHandlers[sessionId];
	this._sessionHandlers[sessionId] = null;
};



Crosser.prototype.destroy = function() {
	Object.keys(this._listeners).forEach(this.unsubscribeSession, this);
	Object.keys(this._sessionHandlers).forEach(this._deleteSession, this);
	this._otherFrameWindow = null;
	this._otherOrigin = null;
	this._id = null;
};

Crosser.prototype.startSession = function(sessionName, payload) {
	var sessionId = generateId(),
		promise = new RSVP.Promise(function(resolve, reject) {
			this._sessionHandlers[sessionId] = {
				resolve: resolve,
				reject: reject
			};
		});

	this._postMessage({
		sessionId: sessionId,
		sessionName: sessionName,
		payload: payload,
		creator: this._id
	});

	return promise;
};

Crosser.prototype.abortSession = function(sessionId) {
	this._deleteSession(sessionId);
};

Crosser.prototype.subscribeSession = function(sessionName, callback) {
	var subscriberId = generateId()

	this._listeners[sessionName] = this._listeners[sessionName] || {};
	if (Object.keys(this._listeners[sessionName]).length > 0) {
		throw new Error('A session ( ' + sessionName + ' ) can have only one subscriber');
	}

	this._listeners[sessionName][subscriberId] = callback;
	return subscriberId;
};

Crosser.prototype.removeSubscriber = function(sessionName, subscriberId) {
	delete this._listeners[sessionName][subscriberId];
	this._listeners[sessionName][subscriberId] = null;
}

module.exports = Crosser;