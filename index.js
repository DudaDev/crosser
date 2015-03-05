var assign = require('object-assign');

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
			message.sessionType &&
			_sessionHandlers[message.sessionId] &&
			message.creator === _id) {

			privateAPI.endSession(event);

		} else if (
			event.origin === _otherOrigin &&
			message &&
			message.sessionId &&
			message.sessionType &&
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
			sessionType = message.sessionType;

		Object.keys(_listeners[message.sessionType]).forEach(function(handlerId) {
			var callbackResult = _listeners[sessionType][handlerId](message.payload);
			if (callbackResult && callbackResult.then) {
				callbackResult.then(function(resolvedPayload) {
					privateAPI.send({
						sessionId: message.sessionId,
						sessionType: sessionType,
						payload: resolvedPayload,
						creator: message.creator
					});
				})
			} else {
				privateAPI.send({
					sessionId: message.sessionId,
					sessionType: sessionType,
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

	create: function(options) {
		_otherFrameWindow = options.communicateWith.frameWindow;
		_otherOrigin = options.communicateWith.origin;
		_id = privateAPI.generateId()

		if (!_otherFrameWindow || !_otherFrameWindow.postMessage) {
			throw new Error('Missing frame to communicate with');
		}

		if (!_otherOrigin) {
			throw new Error('No origin has need specified');
		}

		window.addEventListener("message", privateAPI.receive, false);
	},

	destroy: function() {
		Object.keys(_listeners).forEach(API.removeListeners);
		Object.keys(_sessionHandlers).forEach(API.deleteSession);
		_otherFrameWindow = null;
		_otherOrigin = null;
		_id = null;
	},

	create: function(sessionType, payload) {
		var sessionId = privateAPI.generateId(),
			promise = new Promise(function(resolve, reject) {
				_sessionHandlers[sessionId] = {
					resolve: resolve,
					reject: reject
				};
			});

		privateAPI.send({
			sessionId: sessionId,
			sessionType: sessionType,
			payload: payload,
			creator: _id
		});

		return promise;
	},

	abort: function(sessionId) {
		privateAPI.deleteSession(sessionId);
	},

	addListener: function(sessionType, callback) {
		var handlerId = privateAPI.generateId()

		_listeners[sessionType] = _listeners[sessionType] || {};
		_listeners[sessionType][handlerId] = callback;

		return handlerId;
	},

	removeListener: function(sessionType, handlerId) {
		delete _listeners[sessionType][handlerId];
		_listeners[sessionType][handlerId] = null;
	},

	removeListeners: function(sessionType) {
		Object.keys(_listeners[sessionType]).forEach(function(handlerId) {
			API.removeListener(sessionType, handlerId);
		});
		delete _listeners[sessionType];
		_listeners[sessionType] = null;
	}

});

module.exports = API;