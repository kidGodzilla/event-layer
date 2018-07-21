var EventLayer = (function EventLayer () {

    var that = this;

    /**
     * Third-party adapters for EventLayer.track(), EventLayer.identify(), etc.
     */
    var thirdPartyAdapters = {
        'segment': {
            enabled: true,
            test: function () {
                // This test not only tests for Segment's variety of Analytics.js,
                // it distinguishes it from this library, so you can simply alias this to window.analytics without worry.
                return window.analytics && typeof(window.analytics) === 'object' && window.analytics.Integrations && typeof(window.analytics.Integrations) === 'object';
            },
            identify: function (userId, userProperties) {
                // Send the identify call to Segment's Analytics.js library
                // console.log('Identifying: ', userId, userProperties);
                if (window.analytics && userId) analytics.identify(userId, userProperties);
            },
            track: function (eventName, eventProperties) {
                // Send the tracked event to Segment's Analytics.js library
                // console.log('tracking: ', eventName, eventProperties);
                if (window.analytics && eventName) analytics.track(eventName, eventProperties);
            },
            page: function (category, name, properties) {
                // Send the page call to Segment's Analytics.js library
                // console.log('page: ', category, name, properties);
                if (window.analytics && name) analytics.page(category, name, properties);
            },
            alias: function (userId, previousId) {
                // Send the alias call to Segment's Analytics.js library
                // console.log('alias: ', userId, previousId);
                if (window.analytics && userId && previousId) analytics.alias(userId, previousId);
            },
            group: function (groupId, traits) {
                // Send the group call to Segment's Analytics.js library
                // console.log('group: ', groupId, traits);
                if (window.analytics && groupId) analytics.group(groupId, traits);
            }
        },
        'mixpanel': {
            enabled: true,
            test: function () {
                return window.mixpanel && window.mixpanel.__loaded;
            },
            identify: function (userId, userProperties, options) {
                // Send the identify call to Mixpanel's JS library
                // console.log('Identifying: ', userId, userProperties);
                if (window.mixpanel && userId) mixpanel.identify(userId);

                if (window.mixpanel && userProperties) {
                    if (options && options.setOnce) {
                        // Set people properties on our identified user, but only if they have not yet been set.
                        mixpanel.people.set_once(userProperties);
                    } else {
                        // Set people properties on our identified user
                        mixpanel.people.set(userProperties);
                    }
                }
            },
            track: function (eventName, eventProperties) {
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
            identify: function (userId, userProperties) {
                // Send the identify call to Heap's JS library
                // console.log('Identifying: ', userId, userProperties);
                if (window.heap && userId) heap.identify(userId);

                // Set people properties on our identified user
                if (window.heap && userProperties) heap.addUserProperties(userProperties);
            },
            track: function (eventName, eventProperties) {
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
            identify: function (userId, userProperties) {
                // Send the identify call to Intercom's JS library
                // console.log('Identifying: ', userId, userProperties);
                if (window.Intercom && userId)
                    Intercom('update', { user_id: userId });

                // Set people properties on our identified user
                if (window.Intercom && userProperties)
                    Intercom('update', userProperties);
            },
            track: function (eventName, eventProperties) {
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
            identify: function (userId, userProperties) {
                // Send the identify call to Amplitude's JS library
                // console.log('Identifying: ', userId, userProperties);
                if (window.amplitude && userId) amplitude.getInstance().setUserId(userId);

                // Set people properties on our identified user
                if (window.amplitude && userProperties) amplitude.getInstance().setUserProperties(userProperties);
            },
            track: function (eventName, eventProperties) {
                // Send the tracked event to Amplitude's JS library
                // console.log('tracking: ', eventName, eventProperties);
                if (window.amplitude && eventName) amplitude.getInstance().logEvent(eventName, eventProperties);
            },
            page: function (category, name, properties) {
                if (window.amplitude) {
                    if (category || name) {
                        if (category)
                            amplitude.getInstance().logEvent('pageview_' + category, properties);

                        if (name)
                            amplitude.getInstance().logEvent('pageview_' + name, properties);
                    } else {
                        amplitude.getInstance().logEvent('pageview', properties);
                    }
                }
            }
        },
        'google-analytics': {
            enabled: true,
            test: function () {
                return window.ga;
            },
            identify: function (userId, userProperties = {}) {
                if (window.ga) {
                    userProperties.userId = userId
                    ga('set', userProperties);
                }
            },
            track: function (eventName, eventProperties = {}) {
                if (window.ga) {
                    if (!eventProperties.hasOwnProperty("eventCategory")) {
                        eventProperties.eventCategory = "All"
                    }
                    eventProperties.eventAction = eventName;
                    eventProperties.hitType = 'event'
                    ga('send', eventProperties);
                }
            },
            page: function (category, name, properties={}) {
                if (window.ga) {
                    if (category) properties.category = category;
                    properties.hitType = 'pageview';
                    properties.page = name || properties.path;
                    properties.location = properties.url;
                    ga('send', properties);
                }
            }
        },
        'keen': {
            enabled: true,
            // Todo: This test sucks (keen is not opinionated as to what global you place it in (you don't even need to expose it as a global),
            // but defaults to client, which is too common to use as a test.)
            test: function () {
                return ((window.Keen && window.Keen.loaded) || ((window.KeenAsync && window.KeenAsync.loaded))) && window.client;
            },
            identify: function (userId, userProperties) {
                if (window.client && userId) client.extendEvents({
                    'user_id': userId
                });

                if (window.client && userProperties) client.extendEvents(userProperties);
            },
            track: function (eventName, eventProperties) {
                if (window.client && eventName) client.recordEvent(eventName, eventProperties);
            }
        },
        'helpscout': { // Helpscout.net
            enabled: true,
            test: function () {
                return window.HS && window.HSCW;
            },
            identify: function (userId, userProperties) {

                if (userId) {
                    if (!userProperties) userProperties = {};
                    userProperties.userId = userId;
                }

                if (window.HS && userProperties)
                    HS.beacon.identify(userProperties);
            }
        },
        'fullstory': {
            enabled: true,
            test: function () {
                return window.FS && window._fs_loaded;
            },
            identify: function (userId, userProperties) {
                if (window.FS && userId) FS.identify(userId, userProperties);
            }
        },
        'olark': {
            enabled: true,
            test: function () {
                return window.olark;
            },
            identify: function (userId, userProperties) {
                if (window.olark && userId) olark.identify(userId);

                if (userProperties.email) {
                    olark('api.visitor.updateEmailAddress', {
                        emailAddress: userProperties.email
                    });
                }
            }
        },
        'calq': {
            enabled: true,
            test: function () {
                return window.calq;
            },
            track: function (eventName, eventProperties) {
                if (window.calq && eventName)
                    calq.action.track(eventName, eventProperties);
            },
            identify: function (userId, userProperties) {
                if (window.calq) calq.user.identify(userId);

                if (window.calq && userProperties) {
                    if (userProperties.email) userProperties.$email = userProperties.email;
                    if (userProperties.phone) userProperties.$phone = userProperties.phone;

                    delete userProperties.email;
                    delete userProperties.phone;

                    if (userProperties.city) userProperties.$city = userProperties.city;
                    if (userProperties.country) userProperties.$country = userProperties.country;
                    if (userProperties.region) userProperties.$region = userProperties.region;
                    if (userProperties.full_name) userProperties.$full_name = userProperties.full_name;

                    delete userProperties.city;
                    delete userProperties.country;
                    delete userProperties.region;
                    delete userProperties.full_name;

                    if (userProperties.utm_campaign) userProperties.$utm_campaign = userProperties.utm_campaign;
                    if (userProperties.utm_source) userProperties.$utm_source = userProperties.utm_source;
                    if (userProperties.utm_medium) userProperties.$utm_medium = userProperties.utm_medium;
                    if (userProperties.utm_content) userProperties.$utm_content = userProperties.utm_content;
                    if (userProperties.utm_term) userProperties.$utm_term = userProperties.utm_term;

                    delete userProperties.utm_campaign;
                    delete userProperties.utm_source;
                    delete userProperties.utm_medium;
                    delete userProperties.utm_content;
                    delete userProperties.utm_term;

                    calq.user.profile(userProperties);
                }
            },
            page: function (category, name, properties) {
                if (window.calq) calq.action.trackPageView();
            }
        },
        'chameleon': {
            enabled: true,
            test: function () {
                return !!window.chmln;
            },
            track: function (eventName, eventProperties) {
                if (window.chmln && eventName) chmln.track(eventName, eventProperties);
            },
            identify: function (userId, userProperties) {
                if (window.chmln && userId) {
                    var obj = { uid: userId };

                    if (userProperties.email) obj.email = userProperties.email;
                    if (userProperties.created) obj.created = userProperties.created;
                    if (userProperties.createdAt) obj.created = userProperties.createdAt;

                    if (userProperties.city) obj.city = userProperties.city;
                    if (userProperties.state) obj.state = userProperties.state;
                    if (userProperties.country) obj.country = userProperties.country;

                    // platform, device, screen, browser, IP address, locale, timezone, language

                    chmln.identify(obj);
                }
            },
            alias: function (userId, previousId) {
                if (window.chmln && userId && previousId) chmln.alias({ from: previousId, to: userId });
            },
            group: function (groupId, traits) {
                if (!groupId) return;
                var options = {};

                if (traits)  {
                    for (var key in traits) {
                        options['group:' + key] = traits[key];
                    }
                }

                options['group:id'] = groupId;
                window.chmln.set(options);
            }
        },
        'sentry': {
            enabled: true,
            test: function () {
                return window.Raven;
            },
            identify: function (userId, userProperties) {
                if (!userProperties) userProperties = {};
                if (userId) userProperties.userId = userId;

                if (window.Raven)
                    Raven.setUserContext(userProperties);
            }
        },
        'luckyorange': {
            enabled: true,
            test: function () {
                return !!window.__lo_cs_added;
            },
            identify: function (userId, userProperties) {
                if (!userProperties) userProperties = {};
                if (userId) userProperties.userId = userId;

                if (window.__lo_cs_added)
                    window.__wtw_custom_user_data = userProperties;
            }
        },
        'castle': {
            enabled: true,
            test: function () {
                return typeof window._castle === 'function';
            },
            identify: function (userId, userProperties) {
                delete userProperties.id;
                if (window._castle) _castle('identify', userId, userProperties);
            },
            track: function (eventName, eventProperties) {
                if (window._castle) _castle('track', eventName, eventProperties);
            },
            page: function (category, name, properties) {
                if (window._castle) _castle('page', properties.url, properties.title);
            }
        },
        'rollbar': {
            enabled: true,
            test: function () {
                return window.Rollbar;
            },
            identify: function (userId, userProperties) {
                if (!userProperties) userProperties = {};
                userProperties.id = userId;

                if (window.Rollbar && userId)
                    Rollbar.configure({ payload: { person: userProperties } });
            }
        },
        'talkus': {
            enabled: true,
            test: function () {
                return !!window.talkus;
            },
            identify: function (userId, userProperties) {
                // Hacky way of getting the AppId (for now Todo update)
                var lsObj = JSON.parse(localStorage.getItem('talkusBubbleTS'));
                var appId = Object.keys(lsObj)[0];

                if (!userProperties) userProperties = {};
                userProperties.userId = userId;

                if (window.talkus && appId) talkus('init', appId, userProperties);
            }
        },
        'google-tag-manager': {
            enabled: true,
            test: function () {
                return !!(window.dataLayer && Array.prototype.push !== window.dataLayer.push);
            },
            track: function (eventName, eventProperties) {
                if (!eventProperties) eventProperties = {};
                eventProperties.event = eventName;

                if (window.dataLayer && eventProperties) dataLayer.push(eventProperties);
            },
            page: function (category, name, properties) {
                if (!properties) properties = {};
                properties.event = 'pageview_' + name;
                properties.category = category;

                if (window.dataLayer)
                    dataLayer.push(properties);
            }
        },
        'elevio': {
            enabled: true,
            test: function () {
                return !!window._elev;
            },
            identify: function (userId, userProperties) {
                if (!userProperties || !window._elev) return;

                var user = {};
                user.via = 'event-layer';

                if (userProperties.email) user.email = userProperties.email;
                if (userProperties.name) user.name = userProperties.name;
                if (userProperties.plan) user.plan = [userProperties.plan];
                if (userProperties.plan) user.groups = [userProperties.plan];

                // Delete those
                delete userProperties.firstName;
                delete userProperties.lastName;
                delete userProperties.email;
                delete userProperties.name;
                delete userProperties.plan;
                delete userProperties.id;

                if (Object.keys(userProperties).length > 0) user.traits = userProperties;
                window._elev.user = user;
            }
        },
        'drift': {
            enabled: true,
            test: function () {
                return window.drift !== undefined;
            },
            track: function (eventName, eventProperties) {
                // Todo: Nice to have, Investigate convertDates for eventProperties.
                // This seems to iterate through dates and apply `Math.floor(date.getTime() / 1000)`

                if (window.drift && eventName)
                    window.drift.track(eventName, eventProperties);
            },
            identify: function (userId, userProperties) {
                if (!window.drift || !userId) return;

                delete userProperties.id;
                window.drift.identify(userId, userProperties);
            },
            page: function (category, name, properties) {
                if (window.drift && name)
                    window.drift.page(name);
            }
        },
        'drip': {
            enabled: true,
            test: function () {
                return window._dc && typeof(window._dc) === 'object';
            },
            track: function (eventName, eventProperties) {
                if (!window._dcq || !eventName) return;

                if (eventProperties) {
                    // Convert all keys with spaces to underscores
                    for (var key in eventProperties) {
                        if (key.indexOf(' ') === -1) return; // Skip keys w/o spaces

                        var formattedKey = key.replace(' ', '_');
                        eventProperties[formattedKey] = eventProperties[key];
                        delete eventProperties[key];
                    }

                    if (eventProperties.revenue) {
                        var cents = Math.round(eventProperties.revenue * 100);
                        eventProperties.cents = cents;
                        delete eventProperties.revenue;
                    }
                }

                window._dcq.push('track', eventName, eventProperties);
            },
            identify: function (userId, userProperties) {
                if (window._dcq && userProperties)
                    window._dcq.push('identify', userProperties);
            }
        },
        'bugsnag': {
            enabled: true,
            test: function () {
                return window.Bugsnag && typeof(window.Bugsnag) === 'object';
            },
            identify: function (userId, userProperties) {
                if (!window.Bugsnag) return;
                window.Bugsnag.user = window.Bugsnag.user || {};
                window.Bugsnag.user = Object.assign(window.Bugsnag.user, userProperties);
            }
        },
        'improvely': {
            enabled: true,
            test: function () {
                return !!(window.improvely && window.improvely.identify);
            },
            track: function (eventName, eventProperties) {
                var props = eventProperties;

                // Todo: What does track.properties({ revenue: 'amount' }) do?
                // Does it do this?
                // props = Object.assign(props, { revenue: 'amount' });
                // or this?
                // props.revenue = props.amount;
                props.revenue = props.amount;
                delete props.amount;

                props.type = eventName;
                window.improvely.goal(props);
            },
            identify: function (userId, userProperties) {
                if (userId && window.improvely)
                    window.improvely.label(userId);
            }
        },
        'inspectlet': {
            enabled: true,
            test: function () {
                return !!(window.__insp_ && window.__insp);
            },
            track: function (eventName, eventProperties) {
                if (window.__insp && eventName)
                    __insp.push('tagSession', eventName, eventProperties);
            },
            identify: function (userId, userProperties) {
                if (!window.__insp) return;

                //var traits = identify.traits({ id: 'userid' });
                // Todo: Am I doing it right?
                var traits = Object.assign({}, userProperties);
                traits.id = userId || traits.uid;
                delete traits.uid;

                if (userProperties && userProperties.email)
                    __insp.push('identify', userProperties.email);

                if (userId || userProperties)
                    __insp.push('tagSession', traits);
            },
            page: function (category, name, properties) {
                if (window.__insp)
                    __insp.push('virtualPage');
            }
        },
        'qualaroo': {
            enabled: true,
            test: function () {
                return !!(window._kiq && window._kiq.push !== Array.prototype.push);
            },
            track: function (eventName, eventProperties, options) {
                var traits = {};
                traits['Triggered: ' + eventName] = true;
                // this.identify(new Identify({ traits: traits })); // Identify = require('segmentio-facade').Identify;
            },
            identify: function (userId, userProperties) {
                if (!window._kiq) return;

                if (userProperties && userProperties.email) userId = userProperties.email;
                if (userProperties) _kiq.push('set', userProperties);
                if (userId) _kiq.push('identify', userId);
            }
        },
        'facebook-tracking-pixel': {
            enabled: true,
            test: function () {
                return !!(window.fbq && typeof window.fbq === 'function');
            },
            track: function (eventName, eventProperties) {
                if (!window.fbq) return;

                fbq('trackCustom', eventName, eventProperties);
            },
            page: function (category, name, properties) {
                if (!window.fbq) return;

                fbq('track', "PageView");
            },
            facebookTrackEvent: function (eventName, eventProperties) {
                if (!window.fbq) return;

                fbq('track', eventName, eventProperties);
            }
        },
        'customerio': {
            enabled: true,
            test: function () {
                return !!(window._cio && window._cio.push !== Array.prototype.push);
            },
            track: function (eventName, eventProperties) {
                if (!window._cio) return;

                window._cio.track(eventName, eventProperties);
            },
            identify: function (userId, userProperties) {
                if (!window._cio) return;
                if (!userId) return console.warn('user id required by customer.io for identify function.');

                // Expects userProperties { id: string unique, email: string, created_at: unix-timestamp }

                // Transform createdAt -> created_at
                if (userProperties && userProperties.createdAt && !userProperties.created_at)
                    userProperties.created_at = userProperties.createdAt;

                // Add userId if no id is present
                if (userProperties && !userProperties.id)
                    userProperties.id = userId;

                window._cio.identify(userProperties);
            },
            alias: function (userId, previousId) {
                // Todo
            },
            group: function (groupId, traits) {
                // Todo
            },
            page: function (category, name, properties) {
                if (!window._cio) return;

                if (!window.__currentUserId) return console.warn('You must call the Identify function for Customer.io before the page function, passing a valid userId.');
                if (!name) return console.warn('Customer.io requires a valid name property when calling the page event. Since Analytics.js expects a category field as well, this must be sent (even if it is empty). See documentation for more details.');

                if (!properties) properties = {};

                properties.id = window.__currentUserId;
                properties.type = 'page';
                properties.name = name;
                properties.category = category;

                window._cio.page(location.href, properties);
            }
        },
        'blank-adapter-template': { // Do not modify this template
            enabled: false,
            test: function () {},
            track: function (eventName, eventProperties) {},
            identify: function (userId, userProperties) {},
            page: function (category, name, properties) {},
            alias: function (userId, previousId) {},
            group: function (groupId, traits) {}
        }
    };

    // Recursively convert an `obj`'s dates to new values, using an input function, convert().
    function convertDates (oObj, convert) {
        if (typeof(oObj) !== 'object') return oObj;

        var obj = Object.assign({}, oObj);

        for (var key in obj) {
            var val = obj[key];
            if (typeof(val) === 'date') obj[key] = convert(val);
            if (typeof(val) === 'object') obj[key] = convertDates(val, convert);
        }

        return obj;
    }

    function track (eventName, eventProperties, options, callback) {
        if (!thirdPartyAdapters) return; // Early return if there are no adapters

        onReady();

        for (var adapterName in thirdPartyAdapters) {
            var adapter = thirdPartyAdapters[adapterName];

            // If this adapter passes it's own internal test (usually to detect if a specific source is available)
            if (adapter.enabled && adapter.test && typeof(adapter.test) === 'function' && adapter.test()) {
                // If everything checks out for the data we've received,
                // pass the data to the adapter so it can be tracked

                // If TRANSLATE_EVENT_NAMES exists, use it to translate event names
                if (window.TRANSLATE_EVENT_NAMES && typeof window.TRANSLATE_EVENT_NAMES === 'object')
                    eventName = TRANSLATE_EVENT_NAMES(eventName);

                if (adapter.track && typeof(adapter.track) === 'function')
                    adapter.track(eventName, eventProperties);
            }
        }

        if (callback && typeof(callback) === 'function') callback();
    }

    function identify (userId, userProperties, options, callback) {
        if (!thirdPartyAdapters) return; // Early return if there are no adapters

        onReady();

        // Stash this for later
        window.__currentUserId = userId;

        for (var adapterName in thirdPartyAdapters) {
            var adapter = thirdPartyAdapters[adapterName];

            // If this adapter passes it's own internal test (usually to detect if a specific source is available)
            if (adapter.enabled && adapter.test && typeof(adapter.test) === 'function' && adapter.test()) {
                // If everything checks out for the data we've received,
                // pass the data to the adapter so it can be tracked
                if (adapter.identify && typeof(adapter.identify) === 'function')
                    adapter.identify(userId, userProperties);
            }
        }

        if (callback && typeof(callback) === 'function') callback();
    }

    function page (category, name, properties, options, callback) {
        if (!thirdPartyAdapters) return; // Early return if there are no adapters

        onReady();

        // Handle not passing the category (shift right)
        if (category && (!name || typeof(name) !== 'string')) {
            callback = options;
            options = properties;
            properties = name;
            name = category;
            category = null;
        }

        // url (canonical?), title, referrer, path
        var url = document.querySelector("link[rel='canonical']") ? document.querySelector("link[rel='canonical']").href : document.location.href;
        var title = document.title;
        var referrer = document.referrer;
        var path = location.pathname;

        var props = {
            url: url,
            title: title,
            referrer: referrer,
            path: path
        };

        var properties = Object.assign(props, properties);

        for (var adapterName in thirdPartyAdapters) {
            var adapter = thirdPartyAdapters[adapterName];

            // If this adapter passes it's own internal test (usually to detect if a specific source is available)
            if (adapter.enabled && adapter.test && typeof(adapter.test) === 'function' && adapter.test()) {
                // If everything checks out for the data we've received,
                // pass the data to the adapter so it can be tracked
                if (adapter.page && typeof(adapter.page) === 'function')
                    adapter.page(category, name, properties);
            }
        }

        if (callback && typeof(callback) === 'function') callback();
    }

    function group (groupId, traits, options, callback) {
        if (!thirdPartyAdapters) return; // Early return if there are no adapters

        onReady();

        for (var adapterName in thirdPartyAdapters) {
            var adapter = thirdPartyAdapters[adapterName];

            // If this adapter passes it's own internal test (usually to detect if a specific source is available)
            if (adapter.enabled && adapter.test && typeof(adapter.test) === 'function' && adapter.test()) {
                // If everything checks out for the data we've received,
                // pass the data to the adapter so we can perform a grouping
                if (adapter.group && typeof(adapter.group) === 'function')
                    adapter.group(groupId, traits);
            }
        }

        if (callback && typeof(callback) === 'function') callback();
    }

    function alias (userId, previousId, options, callback) {
        if (!thirdPartyAdapters) return; // Early return if there are no adapters

        onReady();

        for (var adapterName in thirdPartyAdapters) {
            var adapter = thirdPartyAdapters[adapterName];

            // If this adapter passes it's own internal test (usually to detect if a specific source is available)
            if (adapter.enabled && adapter.test && typeof(adapter.test) === 'function' && adapter.test()) {
                // If everything checks out for the data we've received,
                // pass the data to the adapter so we can alias this user
                if (adapter.alias && typeof(adapter.alias) === 'function')
                    adapter.alias(userId, previousId);
            }
        }

        if (callback && typeof(callback) === 'function') callback();
    }

    /**
     * Facebook tracking pixel support
     *
     * Based on: https://developers.facebook.com/docs/facebook-pixel/api-reference
     *
     * Facebook tracking pixel specific event names:
     * ViewContent
     * Search
     * AddToCart
     * AddToWishlist
     * InitiateCheckout
     * AddPaymentInfo
     * Purchase
     * Lead
     * CompleteRegistration
     */
    function fbTrack (eventName, eventProperties, options, callback) {
        if (!thirdPartyAdapters) return; // Early return if there are no adapters

        onReady();

        // Iterate through third-party adapters, sending track events.
        for (var adapterName in thirdPartyAdapters) {
            var adapter = thirdPartyAdapters[adapterName];

            if (adapterName === 'facebook-tracking-pixel') continue; // Skip FB Tracking pixel

            // If this adapter passes it's own internal test (usually to detect if a specific source is available)
            if (adapter.enabled && adapter.test && typeof(adapter.test) === 'function' && adapter.test()) {
                // If everything checks out for the data we've received,
                // pass the data to the adapter so it can be tracked
                if (adapter.facebookTrackEvent && typeof(adapter.facebookTrackEvent) === 'function') {
                    adapter.facebookTrackEvent(eventName, eventProperties);
                } else if (adapter.track && typeof(adapter.track) === 'function') {
                    // If TRANSLATE_EVENT_NAMES exists, use it to translate event names
                    if (window.TRANSLATE_EVENT_NAMES && typeof window.TRANSLATE_EVENT_NAMES === 'object')
                        eventName = TRANSLATE_EVENT_NAMES(eventName);

                    adapter.track(eventName, eventProperties);
                }

            }
        }

        if (callback && typeof(callback) === 'function') callback();
    }

    /**
     * Event Layer defaults
     */
    function ready (callback) {
        if (callback && typeof(callback) === 'function')
            EventLayer.readyFunction = callback;
    }

    function onReady () {
        if (!EventLayer.readyFunction) return;

        if (EventLayer.readyFunction && typeof(EventLayer.readyFunction) === 'function') EventLayer.readyFunction();

        EventLayer.readyFunction = null;
    }

    // Execute directly before the first track/identify/page/group/alias call, or after a default timeout (5s)
    setTimeout(onReady, 5000);


    // Todo:
    // QueryString API?
    // Selecting Integrations should match analytics.js syntax

    // Create / export globals
    window.EventLayer = {};
    EventLayer.thirdPartyAdapters = thirdPartyAdapters;
    EventLayer.readyFunction = null;
    EventLayer.Integrations = null; // This needs to be null so that it's not confused with Segment.com's library.
    EventLayer.identify = identify;
    EventLayer.onReady = onReady;
    EventLayer.fbTrack = fbTrack; // Facebook-tracking pixel
    EventLayer.track = track;
    EventLayer.group = group;
    EventLayer.alias = alias;
    EventLayer.ready = ready;
    EventLayer.page = page;

    window.__currentUserId = null;

    return function () {
        return EventLayer;
    };

})();
