# Crosser

A service for communicating between browser frames.  

## Life Cycle
- One of the frames starts a session which the other frame can subscribe to by name via a callback.  
- Once the subscriber's callback is called, its return value will be resolved within the initiator frame and the session will end.  
Although the session has ended, the subscriber will start next time when a new session with the same name will be initialized.

## Code Example

Frame 1
```javascript
var Crosser = require('crosser');

// Instantiation
var crosser = new Crosser(frame2.contentWindow, 'http://frame2.origin.com');

// Start a session
crosser.start('session-name', {message: 'message from frame1'})
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

## Installation

```
npm install crosser --save
```


## API Reference

####`constructor(otherFrameWindow, otherFrameOrigin)`
- arguments:
	- otherFrameWindow [`Object`]
	- otherFrameOrigin [`String`]
- Returns
	object [`Object`]

####`start (sessionName, payload)`
- arguments:
	- sessionName [`String`]
	- payload [`Object`]
- Returns
	promise [`Promise`]

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

The MIT License
===============

Copyright (c) 2014 Ramy Ben Aroya

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
