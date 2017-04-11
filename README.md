# Electric Love
An analytics abstraction layer. Write your events once, then send them where ever you want.

## What is it?

**“Electric Love”** is an extensible abstraction layer for working with common third-party Analytics libraries.

Since more or less all analytics libraries work the same way (allowing you to identify and describe users, and track the events which they perform), 
**“Electric Love”** creates an abstraction layer and a set of adapters that allow you to write generic Analytics Tracking code once, and update your
configuration later to send your data anywhere you need.


## How does it work?

1. Install your third-party analytics libraries in your application or website (you don't need to do anything special)
2. Install `electric-love.js` in your website or app.
3. Instead of filling your app or website with service-specific tracking code, write generic code using the **“Electric Love” Javascript API** (described below).
4. **“Electric Love”** will detect the third-party Analytics services you have installed on your website or app, and use it's own, community-maintained adapters to propagate your events, in an identical format, to each third-party service, using the latest version(s) of their APIs.
5. **(Optional):** You can extend **“Electric Love”** by writing your own custom adapters for third-party services not yet supported. Each adapter only requires about 12 lines of Javascript, and the community is available to help you ship your first PR to **“Electric Love”**.


## ElectricLove.identify(userId, userProperties)

This method allows you to identify the current visitor, and (optionally) describe the user.

_Only identify the user, do not describe any user properties:_

```
ElectricLove.identify('<unique-user-id>');
```


_Identify the user and describe user properties:_

```
ElectricLove.identify('<unique-user-id>', {
    name: 'John Doe',
    subscribedToNewsletter: false
});
```

This is similar to the `Identify` method found in Mixpanel, Heap, and Analytics.js.


## ElectricLove.track(eventName, eventProperties)

This method allows you to identify the current visitor, and (optionally) describe the user.

_Track a simple event, with no event properties:_

```
ElectricLove.track('click_signup_button');
```

_Track a more complex event, with event properties:_

```
ElectricLove.track('purchase', {
    amount: 32.00,
    itemCount: 4,
    shippingSpeed: 'next-day'
});
```

This is similar to the `Track` method found in Mixpanel, Heap, and Analytics.js.


## Writing an Adapter

Below is an example of a blank adapter.

```
'blank-adapter-template': { // Do not modify this template
    enabled: false, // Change to true once you're completed testing
    test: function () {},
    onIdentify: function (userId, userProperties) {},
    onTrack: function (eventName, eventProperties) {}
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

### 2. onIdentify:
This function takes data from our generic `identify` method, and passes it along to a third-party library, via an adapter.

This should contain a minimal number of integrity checks and transforms, as well as a lightweight wrapper for the library's identify and/or describe functionality.

```
onIdentify: function (userId, userProperties) {
    // Send the identify call to Mixpanel's JS library
    if (window.mixpanel && userId) 
        mixpanel.identify(userId);

    // Set people properties on our identified user
    if (window.mixpanel && userProperties) 
        mixpanel.people.set(userProperties);
}
```

(A simple example taken from the Mixpanel adapter)

### 3. onTrack:
This function takes data from our generic `track` method, and passes it along to a third-party library, via an adapter.

This should contain a minimal number of integrity checks and transforms, as well as a lightweight wrapper for the library's event tracking functionality.

```
onTrack: function (eventName, eventProperties) {
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


## Why is it called ‘Electric Love’?

No reason. Naming things is hard. Also https://youtu.be/RjmU-fou_6A is a pretty cool song (From the Bob's Burgers soundtrack).


## Thanks!
