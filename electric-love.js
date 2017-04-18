var ElectricLove = (function ElectricLove () {
    /**
     * Third-party adapters for Gumshoe.track()
     */
    var thirdPartyAdapters = {
        'segment': {
            enabled: true,
            test: function () {
                return window.analytics && window.analytics.Integrations && typeof(window.analytics.Integrations) === 'object';
            },
            onIdentify: function (userId, userProperties) {
                // Send the identify call to Segment's Analytics.js library
                // console.log('Identifying: ', userId, userProperties);
                if (window.analytics && userId) analytics.identify(userId, userProperties);

            },
            onTrack: function (eventName, eventProperties) {
                // Send the tracked event to Segment's Analytics.js library
                // console.log('tracking: ', eventName, eventProperties);
                if (window.analytics && eventName) analytics.track(eventName, eventProperties);
            }
        },
        'mixpanel': {
            enabled: true,
            test: function () {
                return window.mixpanel && window.mixpanel.__loaded;
            },
            onIdentify: function (userId, userProperties) {
                // Send the identify call to Mixpanel's JS library
                // console.log('Identifying: ', userId, userProperties);
                if (window.mixpanel && userId) mixpanel.identify(userId);

                // Set people properties on our identified user
                if (window.mixpanel && userProperties) mixpanel.people.set(userProperties);
            },
            onTrack: function (eventName, eventProperties) {
                // Send the tracked event to Mixpanel's JS library
                // console.log('tracking: ', eventName, eventProperties);
                if (window.mixpanel && eventName) mixpanel.track(eventName, eventProperties);
            }
        },
        'heap': {
            enabled: true,
            test: function () {
                return (window.heap && window.heap.track) ? true : false;
            },
            onIdentify: function (userId, userProperties) {
                // Send the identify call to Heap's JS library
                // console.log('Identifying: ', userId, userProperties);
                if (window.heap && userId) heap.identify(userId);

                // Set people properties on our identified user
                if (window.heap && userProperties) heap.addUserProperties(userProperties);
            },
            onTrack: function (eventName, eventProperties) {
                // Send the tracked event to Heap's JS library
                // console.log('tracking: ', eventName, eventProperties);
                if (window.heap && eventName) heap.track(eventName, eventProperties);
            }
        },
        'intercom': {
            enabled: true,
            test: function () {
                return (window.Intercom && window.Intercom('getVisitorId')) ? true : false;
            },
            onIdentify: function (userId, userProperties) {
                // Send the identify call to Intercom's JS library
                // console.log('Identifying: ', userId, userProperties);
                if (window.Intercom && userId)
                    Intercom('update', { user_id: userId });

                // Set people properties on our identified user
                if (window.Intercom && userProperties)
                    Intercom('update', userProperties);
            },
            onTrack: function (eventName, eventProperties) {
                // Send the tracked event to Intercom's JS library
                // console.log('tracking: ', eventName, eventProperties);
                if (window.Intercom && eventName)
                    Intercom('trackEvent', eventName, eventProperties);
            }
        },
        'amplitude': {
            enabled: true,
            test: function () {
                return (window.amplitude && window.amplitude.options) ? true : false;
            },
            onIdentify: function (userId, userProperties) {
                // Send the identify call to Amplitude's JS library
                // console.log('Identifying: ', userId, userProperties);
                if (window.amplitude && userId) amplitude.getInstance().setUserId(userId);

                // Set people properties on our identified user
                if (window.amplitude && userProperties) amplitude.getInstance().setUserProperties(userProperties);
            },
            onTrack: function (eventName, eventProperties) {
                // Send the tracked event to Amplitude's JS library
                // console.log('tracking: ', eventName, eventProperties);
                if (window.amplitude && eventName) amplitude.getInstance().logEvent(eventName, eventProperties);
            }
        },
        'google-analytics': {
            enabled: true,
            test: function () {
                return window.ga && window.ga.loaded;
            },
            onIdentify: function (userId, userProperties) {
                if (window.ga) ga('set', 'userId', userId);
            },
            onTrack: function (eventName, eventProperties) {
                if (window.ga) ga('send', {
                    hitType: 'event',
                    eventCategory: 'All',
                    eventAction: eventName
                });
            }
        },
        'keen': { // Do not modify this template
            enabled: true,
            test: function () {
                return window.Keen && window.Keen.loaded && window.client;
            },
            onIdentify: function (userId, userProperties) {
                if (window.client && userId) client.extendEvents({
                    'user_id': userId
                });

                if (window.client && userProperties) client.extendEvents(userProperties);
            },
            onTrack: function (eventName, eventProperties) {
                if (window.client && eventName) client.recordEvent(eventName, eventProperties);
            }
        },
        'blank-adapter-template': { // Do not modify this template
            enabled: false,
            test: function () {},
            onIdentify: function (userId, userProperties) {},
            onTrack: function (eventName, eventProperties) {}
        }
    };

    function track (eventName, eventProperties) {
        if (!thirdPartyAdapters) return; // Early return if there are no adapters

        for (var adapterName in thirdPartyAdapters) {
            var adapter = thirdPartyAdapters[adapterName];

            // If this adapter passes it's own internal test (usually to detect if a specific source is available)
            if (adapter.enabled && adapter.test && typeof(adapter.test) === 'function' && adapter.test()) {
                // If everything checks out for the data we've received,
                // pass the data to the adapter so it can be tracked
                if (adapter.onTrack && typeof(adapter.onTrack) === 'function') {
                    adapter.onTrack(eventName, eventProperties);
                }

            }
        }
    }

    function identify (userId, userProperties) {
        if (!thirdPartyAdapters) return; // Early return if there are no adapters

        for (var adapterName in thirdPartyAdapters) {
            var adapter = thirdPartyAdapters[adapterName];

            // If this adapter passes it's own internal test (usually to detect if a specific source is available)
            if (adapter.enabled && adapter.test && typeof(adapter.test) === 'function' && adapter.test()) {
                // If everything checks out for the data we've received,
                // pass the data to the adapter so it can be tracked
                if (adapter.onIdentify && typeof(adapter.onIdentify) === 'function')
                    adapter.onIdentify(userId, userProperties);
            }
        }
    }

    // Create / export globals
    window.ElectricLove = {};
    ElectricLove.thirdPartyAdapters = thirdPartyAdapters;
    ElectricLove.identify = identify;
    ElectricLove.track = track;

    return function () {
        return ElectricLove;
    };

})();
