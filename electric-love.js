var ElectricLove = (function ElectricLove () {
    /**
     * Third-party adapters for ElectricLove.track(), ElectricLove.identify(), etc.
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
                return window.ga && window.ga.loaded;
            },
            identify: function (userId, userProperties) {
                if (window.ga) ga('set', 'userId', userId);
            },
            track: function (eventName, eventProperties) {
                if (window.ga) ga('send', {
                    hitType: 'event',
                    eventCategory: 'All',
                    eventAction: eventName
                });
            }
        },
        'keen': {
            enabled: true,
            // Todo: This test sucks (keen is not opinionated as to what global you place it in (you don't even need to expose it as a global),
            // but defaults to client, which is too common to use as a test.)
            test: function () {
                return window.Keen && window.Keen.loaded && window.client;
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
                return window.chmln;
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
                user.via = 'electric-love';

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

        obj.forEach(function (val, key) {
            if (type(val) === 'date') obj[key] = convert(val);

            if (type(val) === 'object') obj[key] = convertDates(val, convert);
        });

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
                if (adapter.track && typeof(adapter.track) === 'function')
                    adapter.track(eventName, eventProperties);
            }
        }

        if (callback && typeof(callback) === 'function') callback();
    }

    function identify (userId, userProperties, options, callback) {
        if (!thirdPartyAdapters) return; // Early return if there are no adapters

        onReady();

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

    function ready (callback) {
        if (callback && typeof(callback) === 'function')
            ElectricLove.readyFunction = callback;
    }

    function onReady () {
        if (!ElectricLove.readyFunction) return;

        if (ElectricLove.readyFunction && typeof(ElectricLove.readyFunction) === 'function') ElectricLove.readyFunction();

        ElectricLove.readyFunction = null;
    }

    // Execute directly before the first track/identify/page/group/alias call, or after a default timeout (5s)
    setTimeout(onReady, 5000);


    // Todo:
    // QueryString API?
    // Selecting Integrations should match analytics.js syntax?


    // Create / export globals
    window.ElectricLove = {};
    ElectricLove.thirdPartyAdapters = thirdPartyAdapters;
    ElectricLove.readyFunction = null;
    ElectricLove.Integrations = null; // This needs to be null so that it's not confused with Segment.com's library.
    ElectricLove.identify = identify;
    ElectricLove.onReady = onReady;
    ElectricLove.track = track;
    ElectricLove.group = group;
    ElectricLove.alias = alias;
    ElectricLove.ready = ready;
    ElectricLove.page = page;

    return function () {
        return ElectricLove;
    };

})();
