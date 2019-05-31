![Event Layer](https://raw.githubusercontent.com/kidGodzilla/event-layer/master/event-layer-logo.png)

-----

[![npm version](https://badge.fury.io/js/event-layer.svg)](https://www.npmjs.com/package/event-layer)
[![License](https://img.shields.io/badge/license-MIT%20License-blue.svg)](https://opensource.org/licenses/MIT)
![Contains](https://img.shields.io/badge/contains-badges-orange.svg)

A very very simple abstraction layer for analytics code. Write your events once, then send them where ever you want.

Demo: https://kidgodzilla.github.io/event-layer/

## Stats

**Number of integrations:** 30

**Number of tested integrations fully tested / considered stable & production-ready:** 14

__Would you like to request an integration?__ Our current turn-around time is 72 hours (Add another week for testing). <a href="mailto:james@gumshoe.io">Email me</a> for more details. 

If the docs are publicly available or it's supported by Analytics.js, I can turn around an implementation in 72 hours. 
All I ask is that you make yourself available for testing / verification (this usually takes about a week).

## Installation via NPM

```
npm install event-layer
```

Once installed, you'll need to include `event-layer.js` in your project, and then (optionally) instantiate a new object (aliasing it to a new global, if you prefer). Continue reading to see how that might work.

## Installation via CDN

Include one of the following scripts in your project:

`https://unpkg.com/event-layer@latest/event-layer.js`

or alternatively:

`https://cdn.jsdelivr.net/npm/event-layer@latest/event-layer.js`

Then follow the instructions below.

## What is it?

**“Event Layer”** is an extensible abstraction layer for working with common third-party Analytics libraries.

Since more or less all analytics libraries work the same way (allowing you to identify and describe users, and track the events which they perform), 
**“Event Layer”** creates an abstraction layer and a set of adapters that allow you to write generic Analytics Tracking code once, and update your
configuration later to send your data anywhere you need.


## How does it work?

1. Install your third-party analytics libraries in your application or website (you don't need to do anything special)
2. Install `event-layer.js` in your website or app.
3. Instantiate a new instance of **EventLayer:** (e.g. `var Analytics = new EventLayer();`).
4. Instead of filling your app or website with service-specific tracking code, write generic code using the **“Event Layer” Javascript API** (described below).
5. **“Event Layer”** will detect the third-party Analytics services you have installed on your website or app, and use it's own, community-maintained adapters to propagate your events, in an identical format, to each third-party service, using the latest version(s) of their APIs.
6. **(Optional):** You can extend **“Event Layer”** by writing your own custom adapters for third-party services not yet supported. Each adapter only requires about 12 lines of Javascript, and the community is available to help you ship your first PR to **“Event Layer”**.


## Integrations / Services Currently Supported

- Segment.com
- Mixpanel
- Google Analytics
- Facebook Tracking Pixel
- Google Tag Manager
- Heap
- Intercom
- Amplitude
- Keen.io
- Helpscout
- Fullstory
- Olark
- Calq
- Sentry
- Castle
- Rollbar
- Talkus
- Crazy Egg
- Elev.io
- Drift
- Drip
- Lucky Orange
- BugHerd
- Bugsnag
- Chameleon
- Hello Bar
- Improvely
- Inspectlet
- Qualaroo
- Customer.io
- Crisp.chat (New!)


## Creating a new instance of EventLayer
We realize that not everyone wants to litter their code with calls to a global named **“Event Layer”**. So you'll probably want to start off by instantiating a new instance of **“Event Layer”**.

```
var Analytics = new EventLayer();
```

You can name it whatever you like, but the examples given below will need to be modified appropriately.

## EventLayer.identify(userId, userProperties)

This method allows you to identify the current visitor, and (optionally) describe the user.

_Only identify the user, do not describe any user properties:_

```
Analytics.identify('<unique-user-id>');
```


_Identify the user and describe user properties:_

```
Analytics.identify('<unique-user-id>', {
    name: 'John Doe',
    subscribedToNewsletter: false
});
```

This is similar to the `Identify` method found in Mixpanel, Heap, and Analytics.js.


## EventLayer.track(eventName, eventProperties)

This method allows you to identify the current visitor, and (optionally) describe the user.

_Track a simple event, with no event properties:_

```
Analytics.track('click_signup_button');
```

_Track a more complex event, with event properties:_

```
Analytics.track('purchase', {
    amount: 32.00,
    itemCount: 4,
    shippingSpeed: 'next-day'
});
```

This is similar to the `Track` method found in Mixpanel, Heap, and Analytics.js.

## EventLayer.page(category, name, properties)

_This method has been implemented identially to Analytics.js. See documentation for more details. Feel free to open an issue if you have any questions!_

## EventLayer.alias(userId, previousId)

_This method has been implemented identially to Analytics.js. See documentation for more details. Feel free to open an issue if you have any questions!_

## EventLayer.group(groupId, traits)

_This method has been implemented identially to Analytics.js. See documentation for more details. Feel free to open an issue if you have any questions!_

## EventLayer.fbTrack(eventName, eventProperties)

_Send track events to the facebook tracking pixel_

This method implements a copy of the track() method above, but it supports events specific to the Facebook Tracking Pixel as well. 

See documentation https://developers.facebook.com/docs/facebook-pixel/api-reference for more details on implementing the Facebook tracking pixel on your website.



## Writing an Adapter

Below is an example of a blank adapter.

```
'blank-adapter-template': { // Do not modify this template
    enabled: false, // Change to true once you're completed testing
    test: function () {},
    identify: function (userId, userProperties) {},
    track: function (eventName, eventProperties) {}
}
```

It has three main components:

### 1. Test:
This function, once evaluated, should provide an answer to the question “has a specific third-party analytics library been installed on this page? Is it active? Should we try to send events to this service?” 

This can be as simple as sniffing the window object for a global variables, and a commonly-used (and not likely to disappear) method or property:

```
test: function () {
    return window.ga && window.ga.loaded;
}
```

(A simple example taken from the Google Analytics adapter)

### 2. identify:
This function takes data from our generic `identify` method, and passes it along to a third-party library, via an adapter.

This should contain a minimal number of integrity checks and transforms, as well as a lightweight wrapper for the library's identify and/or describe functionality.

```
identify: function (userId, userProperties) {
    // Send the identify call to Mixpanel's JS library
    if (window.mixpanel && userId) 
        mixpanel.identify(userId);

    // Set people properties on our identified user
    if (window.mixpanel && userProperties) 
        mixpanel.people.set(userProperties);
}
```

(A simple example taken from the Mixpanel adapter)

### 3. track:
This function takes data from our generic `track` method, and passes it along to a third-party library, via an adapter.

This should contain a minimal number of integrity checks and transforms, as well as a lightweight wrapper for the library's event tracking functionality.

```
track: function (eventName, eventProperties) {
    // Send the tracked event to Heap's JS library
    if (window.heap && eventName) 
    heap.track(eventName, eventProperties);
}
```

(A simple example taken from the Heap Analytics adapter)


## Pull Requests

**Yes, Please & Thank you!**

To keep things organized, please open an issue for discussion before putting too much work into a pull request. I would feel really bad if you put a lot of work into something, only for it to not make sense to include it or merge the Pull Request.

Also, to help keep things organized, try to submit individual pull requests for each issue, and keep the scope of each issue relatively small.

For example, if you wanted to add a couple of new adapters, split them into multiple pull requests so we can review them individually.


## Issues

Something feel broken? Open an issue!
Something you feel is missing? Open an issue (Although we may not be able to get to everything, pull requests are most welcome!)


## Thanks!
