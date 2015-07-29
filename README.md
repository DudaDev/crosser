# Crosser 
[![npm version](https://badge.fury.io/js/crosser.svg)](http://badge.fury.io/js/crosser)
[![Build Status](https://travis-ci.org/DudaDev/crosser.svg?branch=master)](https://travis-ci.org/DudaDev/crosser)

A service for communicating between browser frames.  

## Life Cycle
- One of the frames triggers a session which the other frame can subscribe to by name via a callback.  
- Once the subscriber's callback is called, its return value will be resolved within the initiator frame and the session will end.  
Although the session has ended, the subscriber will be called next time when a new session with the same name will be initialized.

## Installation

```
npm install crosser --save
```
or
```
bower install crosser --save
```

## Code Example

Frame 1
```javascript
var Crosser = require('crosser');

// Instantiation
var crosser = new Crosser(frame2.contentWindow, 'http://frame2.origin.com');

// Start a session
crosser.trigger('session-name', {message: 'message from frame1'})
	.then(function(payloadFromFrame2){
		alert(payloadFromFrame2.message) // 'message from frame2'
	});
```

Frame 2
```javascript
var Crosser = require('crosser');

// Instantiation
var crosser = new Crosser(frame1.contentWindow, 'http://frame1.origin.com');

// Subscribe to a session
crosser.subscribe('session-name', function(payloadFromFrame1){
	alert(payloadFromFrame1.message); // 'message from frame1'
	return {message: 'message from frame2'}
});

```

## API Reference

####`constructor(otherFrameWindow, otherFrameOrigin)`
- arguments:
	- otherFrameWindow [`Object`]
	- otherFrameOrigin [`String`]
- Returns
	object [`Object`]

####`trigger (sessionName, payload)`
- arguments:
	- sessionName [`String`]
	- payload [`Object`]
- Returns
	promise [`Promise`]

####`triggerEvent (eventName, payload)`
- arguments:
	- eventName [`String`]
	- payload [`Object`]
- Returns
	`undefined`

####`abort (sessionName)`
- arguments:
	- sessionName [`String`]

####`subscribe (sessionName, callback)`
- arguments:
	- sessionName [`String`]
	- callback [`Function`]

####`unsubscribe (sessionName)`
- arguments:
	- sessionName [`String`]

####`subscribeEvent (eventName, callback)`
- arguments:
	- eventName [`String`]
	- callback [`Function`]

####`unsubscribe (eventName)`
- arguments:
	- eventName [`String`]

## License

[MIT](http://rem.mit-license.org)