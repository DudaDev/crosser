export default function(options){
	var Promise = options.Promise;

	function generateId() {
		return new Date().getTime().toString();
	}

	class Crosser {

		constructor(otherFrameWindow, origin) {
			/* private */
			this._sessionHandlers = {};
			this._listeners = {};
			this._otherFrameWindow = otherFrameWindow;
			this._otherOrigin = origin || '*';
			this._id = generateId();
			this._events = {};

			if (!this._otherFrameWindow || !this._otherFrameWindow.postMessage) {
				throw new Error('Missing frame to communicate with');
			}

			window.addEventListener("message", this.receiveMessage.bind(this), false);
		}

		receiveMessage(event) {
			var message = event.data,
				doesOriginMatch = this.doesOriginMatch(event.origin);

			if (!doesOriginMatch || !message) {
				return;
			}

			if (message.type === 'event') {
				if (message.eventName && this._events[message.eventName]) {
					this.fireEvent(event);
				}
			} else {
				if (message.sessionName &&
					this._sessionHandlers[message.sessionName] &&
					message.creator === this._id) {

					this.endSession(event);
				} else if (
					message.sessionName &&
					message.creator !== this._id) {

					this.throwBackSession(event);
				}
			}
		}

		doesOriginMatch(eventOrigin) {
			var ret =
				(
					eventOrigin === this._otherOrigin ||
					(
						this._otherOrigin === '*' &&
						window.location.origin === eventOrigin
					)
				);
			return ret;
		}

		endSession(event) {
			var message = event.data;
			var resolve = this._sessionHandlers[message.sessionName].resolve;
			var reject = this._sessionHandlers[message.sessionName].reject;

			this.deleteSession(message.sessionName);

			if (message.error) {
				reject(message.error);
			} else {
				resolve(message.payload);
			}
		}

		throwBackSession(event) {
			var message = event.data,
				sessionName = message.sessionName;

			Object.keys(this._listeners[sessionName] || {}).forEach(function(subscriberId) {
				var callbackResult = this._listeners[sessionName][subscriberId](message.payload);
				if (callbackResult && callbackResult.then) {
					callbackResult.then(function(resolvedPayload) {
						this.postMessage({
							sessionName: sessionName,
							payload: resolvedPayload,
							creator: message.creator
						});
					}.bind(this));
				} else {
					this.postMessage({
						sessionName: sessionName,
						payload: callbackResult,
						creator: message.creator
					});
				}
			}, this);

		}

		postMessage(message) {
			this._otherFrameWindow.postMessage(message, this._otherOrigin);
		}

		deleteSession(sessionName) {
			this._sessionHandlers[sessionName].resolve = null;
			delete this._sessionHandlers[sessionName].resolve;
			this._sessionHandlers[sessionName].reject = null;
			delete this._sessionHandlers[sessionName].reject;
			this._sessionHandlers[sessionName] = null;
			delete this._sessionHandlers[sessionName];
		}

		destroy() {
			Object.keys(this._listeners || {}).forEach(this.unsubscribe, this);
			Object.keys(this._sessionHandlers || {}).forEach(this.deleteSession, this);
			this._otherFrameWindow = null;
			this._otherOrigin = null;
			this._id = null;
		}

		trigger(sessionName, payload) {
			var promise;

			if (this._sessionHandlers[sessionName]) {
				throw new Error('A session with the name ' + sessionName + ' is still alive');
			}

			promise = new Promise(function(resolve, reject) {
				this._sessionHandlers[sessionName] = {
					resolve: resolve,
					reject: reject
				};
			}.bind(this));

			this.postMessage({
				sessionName: sessionName,
				payload: payload,
				creator: this._id
			});

			return promise;
		}

		abort(sessionName) {
			this.deleteSession(sessionName);
		}

		subscribe(sessionName, callback) {
			var subscriberId = generateId();

			this._listeners[sessionName] = this._listeners[sessionName] || {};
			if (Object.keys(this._listeners[sessionName] || {}).length > 0) {
				throw new Error('A session ( ' + sessionName + ' ) can have only one subscriber');
			}

			this._listeners[sessionName][subscriberId] = callback;
			return subscriberId;
		}

		unsubscribe(sessionName, subscriberId) {
			if (!subscriberId) {
				Object.keys(this._listeners[sessionName] || {}).forEach(this.unsubscribe.bind(this, sessionName));
			} else {
				this._listeners[sessionName][subscriberId] = null;
				delete this._listeners[sessionName][subscriberId];
			}
		}

		fireEvent(event) {
			var message = event.data;

			this._events[message.eventName].forEach(function(callback) {
				callback(message.payload);
			});
		}

		subscribeEvent(eventName, callback) {
			this._events[eventName] = this._events[eventName] || [];
			this._events[eventName].push(callback);
		}

		unsubscribeEvent(eventName) {
			this._events[eventName] = null;
			delete this._events[eventName];
		}

		triggerEvent(eventName, payload) {
			this.postMessage({
				eventName: eventName,
				type: 'event',
				payload: payload,
				creator: this._id
			});
		}
	}

	return Crosser;

}
