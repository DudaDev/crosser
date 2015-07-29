/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
		value: true
	});
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	var _modulesPromiseNativePromise = __webpack_require__(1);
	
	var _modulesPromiseNativePromise2 = _interopRequireDefault(_modulesPromiseNativePromise);
	
	var _modulesCrosserGetCrosserClass = __webpack_require__(2);
	
	var _modulesCrosserGetCrosserClass2 = _interopRequireDefault(_modulesCrosserGetCrosserClass);
	
	var Crosser = (0, _modulesCrosserGetCrosserClass2['default'])({
		Promise: _modulesPromiseNativePromise2['default']
	});
	
	if (window) {
		window.Crosser = Crosser;
	}
	
	exports['default'] = Crosser;
	module.exports = exports['default'];

/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports["default"] = Promise;
	module.exports = exports["default"];

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
		value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	exports['default'] = function (options) {
		var Promise = options.Promise;
	
		function generateId() {
			return new Date().getTime().toString();
		}
	
		var Crosser = (function () {
			function Crosser(otherFrameWindow, origin) {
				_classCallCheck(this, Crosser);
	
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
	
			_createClass(Crosser, [{
				key: 'receiveMessage',
				value: function receiveMessage(event) {
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
						if (message.sessionName && this._sessionHandlers[message.sessionName] && message.creator === this._id) {
	
							this.endSession(event);
						} else if (message.sessionName && message.creator !== this._id) {
	
							this.throwBackSession(event);
						}
					}
				}
			}, {
				key: 'doesOriginMatch',
				value: function doesOriginMatch(eventOrigin) {
					var ret = eventOrigin === this._otherOrigin || this._otherOrigin === '*' && window.location.origin === eventOrigin;
					return ret;
				}
			}, {
				key: 'endSession',
				value: function endSession(event) {
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
			}, {
				key: 'throwBackSession',
				value: function throwBackSession(event) {
					var message = event.data,
					    sessionName = message.sessionName;
	
					Object.keys(this._listeners[sessionName] || {}).forEach(function (subscriberId) {
						var callbackResult = this._listeners[sessionName][subscriberId](message.payload);
						if (callbackResult && callbackResult.then) {
							callbackResult.then((function (resolvedPayload) {
								this.postMessage({
									sessionName: sessionName,
									payload: resolvedPayload,
									creator: message.creator
								});
							}).bind(this));
						} else {
							this.postMessage({
								sessionName: sessionName,
								payload: callbackResult,
								creator: message.creator
							});
						}
					}, this);
				}
			}, {
				key: 'postMessage',
				value: function postMessage(message) {
					this._otherFrameWindow.postMessage(message, this._otherOrigin);
				}
			}, {
				key: 'deleteSession',
				value: function deleteSession(sessionName) {
					this._sessionHandlers[sessionName].resolve = null;
					delete this._sessionHandlers[sessionName].resolve;
					this._sessionHandlers[sessionName].reject = null;
					delete this._sessionHandlers[sessionName].reject;
					this._sessionHandlers[sessionName] = null;
					delete this._sessionHandlers[sessionName];
				}
			}, {
				key: 'destroy',
				value: function destroy() {
					Object.keys(this._listeners || {}).forEach(this.unsubscribe, this);
					Object.keys(this._sessionHandlers || {}).forEach(this.deleteSession, this);
					this._otherFrameWindow = null;
					this._otherOrigin = null;
					this._id = null;
				}
			}, {
				key: 'trigger',
				value: function trigger(sessionName, payload) {
					var promise;
	
					if (this._sessionHandlers[sessionName]) {
						throw new Error('A session with the name ' + sessionName + ' is still alive');
					}
	
					promise = new Promise((function (resolve, reject) {
						this._sessionHandlers[sessionName] = {
							resolve: resolve,
							reject: reject
						};
					}).bind(this));
	
					this.postMessage({
						sessionName: sessionName,
						payload: payload,
						creator: this._id
					});
	
					return promise;
				}
			}, {
				key: 'abort',
				value: function abort(sessionName) {
					this.deleteSession(sessionName);
				}
			}, {
				key: 'subscribe',
				value: function subscribe(sessionName, callback) {
					var subscriberId = generateId();
	
					this._listeners[sessionName] = this._listeners[sessionName] || {};
					if (Object.keys(this._listeners[sessionName] || {}).length > 0) {
						throw new Error('A session ( ' + sessionName + ' ) can have only one subscriber');
					}
	
					this._listeners[sessionName][subscriberId] = callback;
					return subscriberId;
				}
			}, {
				key: 'unsubscribe',
				value: function unsubscribe(sessionName, subscriberId) {
					if (!subscriberId) {
						Object.keys(this._listeners[sessionName] || {}).forEach(this.unsubscribe.bind(this, sessionName));
					} else {
						this._listeners[sessionName][subscriberId] = null;
						delete this._listeners[sessionName][subscriberId];
					}
				}
			}, {
				key: 'fireEvent',
				value: function fireEvent(event) {
					var message = event.data;
	
					this._events[message.eventName].forEach(function (callback) {
						callback(message.payload);
					});
				}
			}, {
				key: 'subscribeEvent',
				value: function subscribeEvent(eventName, callback) {
					this._events[eventName] = this._events[eventName] || [];
					this._events[eventName].push(callback);
				}
			}, {
				key: 'unsubscribeEvent',
				value: function unsubscribeEvent(eventName) {
					this._events[eventName] = null;
					delete this._events[eventName];
				}
			}, {
				key: 'triggerEvent',
				value: function triggerEvent(eventName, payload) {
					this.postMessage({
						eventName: eventName,
						type: 'event',
						payload: payload,
						creator: this._id
					});
				}
			}]);
	
			return Crosser;
		})();
	
		return Crosser;
	};
	
	module.exports = exports['default'];

/***/ }
/******/ ]);
//# sourceMappingURL=crosser.js.map