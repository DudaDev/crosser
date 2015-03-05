var assign = require('object-assign');
var RSVP = require('rsvp');

var _sessionHandlers = {};
var _listeners = {};
var _otherFrameWindow;
var _otherOrigin;
var _id;

var privateAPI = {};
assign(privateAPI, {

	generateId: function() {
		return new Date().getTime().toString();
	},

	receive: function(event) {
		var message = event.data;

		if (event.origin === _otherOrigin &&
			message &&
			message.sessionId &&
			message.sessionName &&
			_sessionHandlers[message.sessionId] &&
			message.creator === _id) {

			privateAPI.endSession(event);

		} else if (
			event.origin === _otherOrigin &&
			message &&
			message.sessionId &&
			message.sessionName &&
			message.creator !== _id) {

			privateAPI.throwBackSession(event);
		}
	},

	endSession: function(event) {
		var message = event.data;
		var resolve = _sessionHandlers[message.sessionId].resolve;
		var reject = _sessionHandlers[message.sessionId].reject;

		privateAPI.deleteSession(message.sessionId);

		if (message.error) {
			reject(message.error);
		} else {
			resolve(message.payload);
		}
	},

	throwBackSession: function(event) {
		var message = event.data,
			sessionName = message.sessionName;

		Object.keys(_listeners[message.sessionName]).forEach(function(handlerId) {
			var callbackResult = _listeners[sessionName][handlerId](message.payload);
			if (callbackResult && callbackResult.then) {
				callbackResult.then(function(resolvedPayload) {
					privateAPI.send({
						sessionId: message.sessionId,
						sessionName: sessionName,
						payload: resolvedPayload,
						creator: message.creator
					});
				})
			} else {
				privateAPI.send({
					sessionId: message.sessionId,
					sessionName: sessionName,
					payload: callbackResult,
					creator: message.creator
				});
			}
		});

	},

	send: function(message) {
		_otherFrameWindow.postMessage(message, _otherOrigin);
	},

	deleteSession: function(sessionId) {
		delete _sessionHandlers[sessionId].resolve;
		_sessionHandlers[sessionId].resolve = null;
		delete _sessionHandlers[sessionId].reject;
		_sessionHandlers[sessionId].reject = null;
		delete _sessionHandlers[sessionId];
		_sessionHandlers[sessionId] = null;
	}
});


var API = {};

assign(API, {

	start: function(otherFrameWindow, origin) {
		_otherFrameWindow = otherFrameWindow;
		_otherOrigin = origin || '*';
		_id = privateAPI.generateId()

		if (!_otherFrameWindow || !_otherFrameWindow.postMessage) {
			throw new Error('Missing frame to communicate with');
		}

		window.addEventListener("message", privateAPI.receive, false);
	},

	stop: function() {
		Object.keys(_listeners).forEach(API.removeAllListeners);
		Object.keys(_sessionHandlers).forEach(API.deleteSession);
		_otherFrameWindow = null;
		_otherOrigin = null;
		_id = null;
	},

	create: function(sessionName, payload) {
		var sessionId = privateAPI.generateId(),
			promise = new RSVP.Promise(function(resolve, reject) {
				_sessionHandlers[sessionId] = {
					resolve: resolve,
					reject: reject
				};
			});

		privateAPI.send({
			sessionId: sessionId,
			sessionName: sessionName,
			payload: payload,
			creator: _id
		});

		return promise;
	},

	abort: function(sessionId) {
		privateAPI.deleteSession(sessionId);
	},

	engageSession: function(sessionName, callback) {
		var handlerId = privateAPI.generateId()

		_listeners[sessionName] = _listeners[sessionName] || {};
		_listeners[sessionName][handlerId] = callback;

		return handlerId;
	},

	removeListener: function(sessionName, handlerId) {
		delete _listeners[sessionName][handlerId];
		_listeners[sessionName][handlerId] = null;
	},

	removeAllListeners: function(sessionName) {
		Object.keys(_listeners[sessionName]).forEach(function(handlerId) {
			API.removeListener(sessionName, handlerId);
		});
		delete _listeners[sessionName];
		_listeners[sessionName] = null;
	}

});

module.exports = API;