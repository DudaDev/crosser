(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/*! Native Promise Only
    v0.8.0-a (c) Kyle Simpson
    MIT License: http://getify.mit-license.org
*/
!function(t,n,e){n[t]=n[t]||e(),"undefined"!=typeof module&&module.exports?module.exports=n[t]:"function"==typeof define&&define.amd&&define(function(){return n[t]})}("Promise","undefined"!=typeof global?global:this,function(){"use strict";function t(t,n){l.add(t,n),h||(h=y(l.drain))}function n(t){var n,e=typeof t;return null==t||"object"!=e&&"function"!=e||(n=t.then),"function"==typeof n?n:!1}function e(){for(var t=0;t<this.chain.length;t++)o(this,1===this.state?this.chain[t].success:this.chain[t].failure,this.chain[t]);this.chain.length=0}function o(t,e,o){var r,i;try{e===!1?o.reject(t.msg):(r=e===!0?t.msg:e.call(void 0,t.msg),r===o.promise?o.reject(TypeError("Promise-chain cycle")):(i=n(r))?i.call(r,o.resolve,o.reject):o.resolve(r))}catch(c){o.reject(c)}}function r(o){var c,u=this;if(!u.triggered){u.triggered=!0,u.def&&(u=u.def);try{(c=n(o))?t(function(){var t=new f(u);try{c.call(o,function(){r.apply(t,arguments)},function(){i.apply(t,arguments)})}catch(n){i.call(t,n)}}):(u.msg=o,u.state=1,u.chain.length>0&&t(e,u))}catch(a){i.call(new f(u),a)}}}function i(n){var o=this;o.triggered||(o.triggered=!0,o.def&&(o=o.def),o.msg=n,o.state=2,o.chain.length>0&&t(e,o))}function c(t,n,e,o){for(var r=0;r<n.length;r++)!function(r){t.resolve(n[r]).then(function(t){e(r,t)},o)}(r)}function f(t){this.def=t,this.triggered=!1}function u(t){this.promise=t,this.state=0,this.triggered=!1,this.chain=[],this.msg=void 0}function a(n){if("function"!=typeof n)throw TypeError("Not a function");if(0!==this.__NPO__)throw TypeError("Not a promise");this.__NPO__=1;var o=new u(this);this.then=function(n,r){var i={success:"function"==typeof n?n:!0,failure:"function"==typeof r?r:!1};return i.promise=new this.constructor(function(t,n){if("function"!=typeof t||"function"!=typeof n)throw TypeError("Not a function");i.resolve=t,i.reject=n}),o.chain.push(i),0!==o.state&&t(e,o),i.promise},this["catch"]=function(t){return this.then(void 0,t)};try{n.call(void 0,function(t){r.call(o,t)},function(t){i.call(o,t)})}catch(c){i.call(o,c)}}var s,h,l,p=Object.prototype.toString,y="undefined"!=typeof setImmediate?function(t){return setImmediate(t)}:setTimeout;try{Object.defineProperty({},"x",{}),s=function(t,n,e,o){return Object.defineProperty(t,n,{value:e,writable:!0,configurable:o!==!1})}}catch(d){s=function(t,n,e){return t[n]=e,t}}l=function(){function t(t,n){this.fn=t,this.self=n,this.next=void 0}var n,e,o;return{add:function(r,i){o=new t(r,i),e?e.next=o:n=o,e=o,o=void 0},drain:function(){var t=n;for(n=e=h=void 0;t;)t.fn.call(t.self),t=t.next}}}();var g=s({},"constructor",a,!1);return a.prototype=g,s(g,"__NPO__",0,!1),s(a,"resolve",function(t){var n=this;return t&&"object"==typeof t&&1===t.__NPO__?t:new n(function(n,e){if("function"!=typeof n||"function"!=typeof e)throw TypeError("Not a function");n(t)})}),s(a,"reject",function(t){return new this(function(n,e){if("function"!=typeof n||"function"!=typeof e)throw TypeError("Not a function");e(t)})}),s(a,"all",function(t){var n=this;return"[object Array]"!=p.call(t)?n.reject(TypeError("Not an array")):0===t.length?n.resolve([]):new n(function(e,o){if("function"!=typeof e||"function"!=typeof o)throw TypeError("Not a function");var r=t.length,i=Array(r),f=0;c(n,t,function(t,n){i[t]=n,++f===r&&e(i)},o)})}),s(a,"race",function(t){var n=this;return"[object Array]"!=p.call(t)?n.reject(TypeError("Not an array")):new n(function(e,o){if("function"!=typeof e||"function"!=typeof o)throw TypeError("Not a function");c(n,t,function(t,n){e(n)},o)})}),a});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
var npo = require('native-promise-only');

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
	this._events = {};

	if (!this._otherFrameWindow || !this._otherFrameWindow.postMessage) {
		throw new Error('Missing frame to communicate with');
	}

	window.addEventListener("message", this._receiveMessage.bind(this), false);
};

Crosser.prototype._receiveMessage = function(event) {
	var message = event.data,
		doesOriginMatch = this._doesOriginMatch(event.origin);

	if (!doesOriginMatch || !message) {
		return;
	}

	if (message.type === 'event') {
		if (message.eventName && this._events[message.eventName]) {
			this._fireEvent(event);
		}
	} else {
		if (message.sessionName &&
			this._sessionHandlers[message.sessionName] &&
			message.creator === this._id) {

			this._endSession(event);
		} else if (
			message.sessionName &&
			message.creator !== this._id) {

			this._throwBackSession(event);
		}
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

	promise = new Promise(function(resolve, reject) {
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

Crosser.prototype._fireEvent = function(event) {
	var message = event.data;

	this._events[message.eventName].forEach(function (callback) {
		callback(message.payload);
	});
};

Crosser.prototype.subscribeEvent = function(eventName, callback) {
	this._events[eventName] = this._events[eventName] || [];
	this._events[eventName].push(callback);
};

Crosser.prototype.unsubscribeEvent = function(eventName) {
	this._events[eventName] = null;
	delete this._events[eventName];
};

Crosser.prototype.triggerEvent = function(eventName, payload) {
	this._postMessage({
		eventName: eventName,
		type: 'event',
		payload: payload,
		creator: this._id
	});
};

window.Crosser = Crosser;
module.exports = Crosser;

},{"native-promise-only":1}]},{},[2]);
