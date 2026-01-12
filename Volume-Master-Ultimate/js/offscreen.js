(function () {
    // Module bundler/loader function
    function createModuleBundle(modules, cache, entryPoints) {
        function require(moduleId, skipCache) {
            if (!cache[moduleId]) {
                if (!modules[moduleId]) {
                    // Try to use native require if available
                    const nativeRequire = typeof require === 'function' && require;
                    if (!skipCache && nativeRequire) return nativeRequire(moduleId, true);

                    if (fallbackRequire) return fallbackRequire(moduleId, true);

                    const error = new Error("Cannot find module '" + moduleId + "'");
                    error.code = "MODULE_NOT_FOUND";
                    throw error;
                }

                // Create module cache entry
                const moduleExports = {};
                cache[moduleId] = { exports: moduleExports };

                // Execute module
                modules[moduleId][0].call(
                    moduleExports,
                    function (dependencyId) {
                        const resolvedId = modules[moduleId][1][dependencyId] || dependencyId;
                        return require(resolvedId);
                    },
                    cache[moduleId],
                    moduleExports,
                    createModuleBundle,
                    modules,
                    cache,
                    entryPoints
                );
            }
            return cache[moduleId].exports;
        }

        // Try to get native require as fallback
        const fallbackRequire = typeof require === 'function' && require;

        // Load all entry points
        for (let i = 0; i < entryPoints.length; i++) {
            require(entryPoints[i]);
        }

        return require;
    }

    return createModuleBundle;
})()({
    // Module 1: Configuration
    1: [function (require, module) {
        const CHROME = "chrome";
        const EDGE = "edge";

        const extensionIds = {
            "jghecgabfgfdldnmbfkhmffcabddioke": { id: CHROME },
            "hggkhljchkjfpegomlekngmfhkdhafig": { id: EDGE }
        };

        const currentExtensionId = chrome.runtime.id in extensionIds ?
            chrome.runtime.id : "jghecgabfgfdldnmbfkhmffcabddioke";
        const currentBrowser = extensionIds[currentExtensionId].id || CHROME;

        // REMOVED EXTERNAL URLs
        const baseUrl = "";
        const volumeMasterUrl = "";

        const getAppVersion = () => chrome.runtime.getManifest().version;

        const getUrl = (url, utmContent = "") => {
            return "";
        };

        module.exports = {
            HOMEPAGE_URL: "",
            INSTALL_URL: "",
            UNINSTALL_URL: "",
            FOOTER_URL: "",
            ISSUE_URL: "",

            getStoreReviewsUrl: () => {
                return "";
            },

            getStoreName: () => {
                if (currentBrowser === CHROME) return "Chrome Web Store";
                if (currentBrowser === EDGE) return "Microsoft Edge Add-ons";
                return void 0;
            },

            getUrl: getUrl,

            getUpdateUrl: () => "",

            updateUrl: (url, params) => {
                return "";
            },

            getAppVersion: getAppVersion,

            APP_VERSION_WITH_UPDATE_URL: [],
            APP_VERSION_WITH_UPDATE_URL_EXTENDED: [],

            TARGET_SERVICE_WORKER: "service-worker",
            TARGET_OFFSCREEN_DOCUMENT: "offscreen-document",
            ACTION_POPUP_AUDIO_DATA_GET: "popup-audio-data-get",
            ACTION_POPUP_GAIN_CHANGE: "popup-gain-change",
            ACTION_POPUP_BIQUAD_FILTER_CHANGE: "popup-biquad-filter-change",
            ACTION_POPUP_ANALYSER_BEFORE_DATA_GET: "popup-analyser-before-data-get",
            ACTION_POPUP_ANALYSER_AFTER_DATA_GET: "popup-analyser-after-data-get",
            ACTION_TAB_CLOSED: "tab-closed",
            ACTION_INIT_OFFSCREEN_DOCUMENT: "init-offscreen-document",
            ACTION_GET_MEDIA_STREAM_ID: "get-media-stream-id",

            AUDIO_STATE_AUDIO_CONTEXT: "audioContext",
            AUDIO_STATE_GAIN_NODE: "gainNode",
            AUDIO_STATE_BIQUAD_FILTER_NODE: "biquadFilter",
            AUDIO_STATE_ANALYSER_NODE_BEFORE: "analyserBefore",
            AUDIO_STATE_ANALYSER_NODE_AFTER: "analyserAfter",

            ANALYSER_BEFORE_ENABLED: false,
            ANALYSER_AFTER_ENABLED: false,
            ANALYSER_INTERVAL: 1000 / 30, // 30 FPS
            ANALYSER_FFT_SIZE: 128,

            EQUALIZER_PRESETS: {
                default: { algorithm: "highpass", frequency: 0, q: 1, gain: 0 },
                voice: { algorithm: "peaking", frequency: 1500, q: 1, gain: 12 },
                bass: { algorithm: "lowshelf", frequency: 350, q: 1, gain: 6 }
            },

            VOLUME_VALUE_DEFAULT: 100,
            VOLUME_VALUE_MAX: 800,

            HTML_JS_HOOK_VOLUME_SLIDER: ".js-volume-slider__slider",

            STORAGE_KEY_SCROLL_DIRECTION_INVERTED: "scroll-direction-inverted",
            STORAGE_VALUE_SCROLL_DIRECTION_INVERTED_DEFAULT: false,
            STORAGE_VALUE_SCROLL_DIRECTION_INVERTED_REGULAR: false,
            STORAGE_VALUE_SCROLL_DIRECTION_INVERTED_INVERTED: true,

            STORAGE_KEY_PROMO_SHOW: "promo-show",
            STORAGE_VALUE_PROMO_SHOW_DEFAULT: false,
            STORAGE_VALUE_PROMO_SHOW_ON: false,
            STORAGE_VALUE_PROMO_SHOW_OFF: false,

            STORAGE_KEY_RATING_AND_MADE_BY_SHOW: "rating-and-made-by-show",
            STORAGE_VALUE_RATING_AND_MADE_BY_SHOW_DEFAULT: false,
            STORAGE_VALUE_RATING_AND_MADE_BY_SHOW_ON: false,
            STORAGE_VALUE_RATING_AND_MADE_BY_SHOW_OFF: false
        };
    }, {}],

    // Module 2: Audio processing offscreen document
    2: [function (require) {
        const config = require("./modules/config");

        // Global object to store audio states for different tabs
        const audioStates = {};
        window.audioStates = audioStates;

        // Initialize audio processing pipeline for a tab
        const initializeAudioProcessing = (tabId, mediaStream) => {
            // Create audio context
            const audioContext = new window.AudioContext();

            // Create audio source from media stream
            const mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);

            // Create gain node for volume control
            const gainNode = audioContext.createGain();

            // Create biquad filter for equalizer
            const biquadFilterNode = audioContext.createBiquadFilter();
            biquadFilterNode.type = "peaking"; // Default type

            // Create analyser nodes (before and after processing)
            const analyserBeforeNode = audioContext.createAnalyser();
            analyserBeforeNode.fftSize = config.ANALYSER_FFT_SIZE;

            const analyserAfterNode = audioContext.createAnalyser();
            analyserAfterNode.fftSize = config.ANALYSER_FFT_SIZE;

            // Build audio processing chain
            const audioChain = [
                mediaStreamSource,                         // Source
                config.ANALYSER_BEFORE_ENABLED && analyserBeforeNode, // Analyser before processing
                gainNode,                                  // Volume control
                biquadFilterNode,                          // Equalizer
                config.ANALYSER_AFTER_ENABLED && analyserAfterNode   // Analyser after processing
            ].filter(node => node); // Filter out disabled nodes

            // Connect all nodes in the chain
            audioChain.reduce((previousNode, currentNode) => {
                previousNode.connect(currentNode);
                return currentNode;
            }).connect(audioContext.destination);

            // Store all nodes in the global state
            audioStates[tabId] = audioStates[tabId] || {};
            audioStates[tabId][config.AUDIO_STATE_AUDIO_CONTEXT] = audioContext;
            audioStates[tabId][config.AUDIO_STATE_GAIN_NODE] = gainNode;
            audioStates[tabId][config.AUDIO_STATE_BIQUAD_FILTER_NODE] = biquadFilterNode;
            audioStates[tabId][config.AUDIO_STATE_ANALYSER_NODE_BEFORE] = analyserBeforeNode;
            audioStates[tabId][config.AUDIO_STATE_ANALYSER_NODE_AFTER] = analyserAfterNode;
        };

        // Update volume/gain for a tab
        const updateVolume = (tabId, volumeValue) => {
            const state = audioStates[tabId];
            if (!state) {
                console.warn('updateVolume: No audio state for tab', tabId, 'value:', volumeValue);
                return;
            }

            const gainNode = state[config.AUDIO_STATE_GAIN_NODE];
            if (!gainNode) {
                console.warn('updateVolume: No gain node for tab', tabId, state);
                return;
            }

            const newGain = volumeValue / 100;
            gainNode.gain.value = newGain;
            console.log('updateVolume: applied gain for tab', tabId, '=>', newGain, { tabId, volumeValue, newGain });
        };

        // Update equalizer settings for a tab
        const updateEqualizer = (tabId, algorithm, frequency, q, gain) => {
            const filterNode = audioStates[tabId][config.AUDIO_STATE_BIQUAD_FILTER_NODE];

            if (algorithm != null) {
                filterNode.type = algorithm;
            }
            if (frequency != null) {
                filterNode.frequency.value = frequency;
            }
            if (q != null) {
                filterNode.Q.value = q;
            }
            if (gain != null) {
                filterNode.gain.value = gain;
            }
        };

        // Get media stream from tab capture
        const getTabMediaStream = async (mediaStreamId) => {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: "tab",
                        chromeMediaSourceId: mediaStreamId
                    }
                }
            });
            return mediaStream;
        };

        // Handle incoming messages
        const handleMessage = async (message, sendResponse) => {
            if (message.target === config.TARGET_OFFSCREEN_DOCUMENT) {

                // Get current audio data for a tab
                if (message.action === config.ACTION_POPUP_AUDIO_DATA_GET) {
                    let audioData = null;

                    if (message.tabId in audioStates) {
                        const tabAudioState = audioStates[message.tabId];
                        audioData = {
                            gain: {
                                gain: tabAudioState[config.AUDIO_STATE_GAIN_NODE].gain.value
                            },
                            equalizer: {
                                algorithm: tabAudioState[config.AUDIO_STATE_BIQUAD_FILTER_NODE].type,
                                frequency: tabAudioState[config.AUDIO_STATE_BIQUAD_FILTER_NODE].frequency.value,
                                q: tabAudioState[config.AUDIO_STATE_BIQUAD_FILTER_NODE].Q.value,
                                gain: tabAudioState[config.AUDIO_STATE_BIQUAD_FILTER_NODE].gain.value
                            }
                        };
                    }

                    sendResponse(audioData);
                }

                // Update volume/gain
                else if (message.action === config.ACTION_POPUP_GAIN_CHANGE) {
                    console.log('offscreen: received GAIN_CHANGE', message);
                    // Initialize audio processing if not already done
                    if (!(message.tabId in audioStates)) {
                        try {
                            const mediaStream = await getTabMediaStream(message.mediaStreamId);
                            initializeAudioProcessing(message.tabId, mediaStream);
                        } catch (err) {
                            console.error('Failed to initialize audio processing for gain change:', err);
                            sendResponse(null);
                            return;
                        }
                    }

                    try {
                        updateVolume(message.tabId, message.volumeValue);
                    } catch (err) {
                        console.error('Error applying volume change:', err, message);
                    }

                    sendResponse(null);
                }

                // Update equalizer settings
                else if (message.action === config.ACTION_POPUP_BIQUAD_FILTER_CHANGE) {
                    // Initialize audio processing if not already done
                    if (!(message.tabId in audioStates)) {
                        try {
                            const mediaStream = await getTabMediaStream(message.mediaStreamId);
                            initializeAudioProcessing(message.tabId, mediaStream);
                        } catch (err) {
                            console.error('Failed to initialize audio processing for biquad filter change:', err);
                            sendResponse(null);
                            return;
                        }
                    }

                    updateEqualizer(
                        message.tabId,
                        message.algorithm,
                        message.frequency,
                        message.q,
                        message.gain
                    );
                    sendResponse(null);
                }

                // Get analyser data (before processing)
                else if (message.action === config.ACTION_POPUP_ANALYSER_BEFORE_DATA_GET) {
                    if (message.tabId in audioStates) {
                        const audioContext = audioStates[message.tabId][config.AUDIO_STATE_AUDIO_CONTEXT];
                        const analyserNode = audioStates[message.tabId][config.AUDIO_STATE_ANALYSER_NODE_BEFORE];

                        if (audioContext && analyserNode) {
                            const bufferLength = analyserNode.frequencyBinCount;
                            const dataArray = new Uint8Array(bufferLength);

                            analyserNode.getByteFrequencyData(dataArray);

                            sendResponse({
                                dataArray: Array.from(dataArray),
                                bufferLength: bufferLength,
                                sampleRate: audioContext.sampleRate
                            });
                            return;
                        }
                    }
                    sendResponse(null);
                }

                // Get analyser data (after processing)
                else if (message.action === config.ACTION_POPUP_ANALYSER_AFTER_DATA_GET) {
                    if (message.tabId in audioStates) {
                        const audioContext = audioStates[message.tabId][config.AUDIO_STATE_AUDIO_CONTEXT];
                        const analyserNode = audioStates[message.tabId][config.AUDIO_STATE_ANALYSER_NODE_AFTER];

                        if (audioContext && analyserNode) {
                            const bufferLength = analyserNode.frequencyBinCount;
                            const dataArray = new Uint8Array(bufferLength);

                            analyserNode.getByteFrequencyData(dataArray);

                            sendResponse({
                                dataArray: Array.from(dataArray),
                                bufferLength: bufferLength,
                                sampleRate: audioContext.sampleRate
                            });
                            return;
                        }
                    }
                    sendResponse(null);
                }

                // Clean up when tab is closed
                else if (message.action === config.ACTION_TAB_CLOSED) {
                    const tabId = message.tabId;

                    if (tabId in audioStates) {
                        audioStates[tabId][config.AUDIO_STATE_AUDIO_CONTEXT].close().then(() => {
                            delete audioStates[tabId];
                        });
                    }

                    sendResponse(null);
                }

                // Default response for unhandled actions
                else {
                    sendResponse(null);
                }
            }
        };

        // Set up message listener
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const asyncActions = new Set([
                config.ACTION_POPUP_GAIN_CHANGE,
                config.ACTION_POPUP_BIQUAD_FILTER_CHANGE
            ]);

            const p = handleMessage(message, sendResponse);
            p.catch(err => {
                console.error('Error handling message:', err);
                try { sendResponse(null); } catch (e) {}
            });

            // Return true only if we expect an async response for this action
            return (message && message.target === config.TARGET_OFFSCREEN_DOCUMENT && asyncActions.has(message.action));
        });

    }, {
        "./modules/config": 1
    }]
}, {}, [2]);