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

  // Export the module bundler
  return createModuleBundle;
})()({
  // Module 1: Notifications configuration
  1: [function (require, module) {
    const config = require("../modules/config");
    const dateFrom = "2018-01-01";
    const dateTo = "2029-12-31";
    const priorityLow = 100;
    const priorityHigh = 200;

    module.exports = {
      notifications: []
    };
  }, {
    "../modules/config": 3
  }],

  // Module 2: Chrome storage local wrapper
  2: [function (require, module) {
    module.exports = {
      get: async function (key, defaultValue) {
        const storageObject = {
          [key]: JSON.stringify(defaultValue)
        };
        const result = await chrome.storage.local.get(storageObject);
        return JSON.parse(result[key]);
      },

      set: async function (key, value) {
        const storageObject = {
          [key]: JSON.stringify(value)
        };
        await chrome.storage.local.set(storageObject);
      },

      watch: async function (key, callback) {
        chrome.storage.local.onChanged.addListener(function (changes) {
          if (key in changes) {
            const newValue = JSON.parse(changes[key].newValue);
            callback(newValue);
          }
        });
      },

      getBytesInUse: async function (key) {
        return chrome.storage.local.getBytesInUse(key);
      }
    };
  }, {}],

  // Module 3: Configuration
  3: [function (require, module) {
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

    // REMOVED UTM LOGIC
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

  // Module 4: Notifications module
  4: [function (require, module) {
    const storageLocal = require("./chrome/storage-local.js");
    const { notifications } = require("../config/notifications");

    const NOTIFICATIONS_KEY = "notifications";
    const INSTALLATION_DATE_KEY = "installation-date";

    const state = {
      date: new Date(),
      installationDate: new Date(),
      usedIds: []
    };

    const loadUsedNotificationIds = async () => {
      state.usedIds = await storageLocal.get(NOTIFICATIONS_KEY, []);
    };

    const markNotificationAsUsed = async (notificationId) => {
      state.usedIds.push(notificationId);
      await storageLocal.set(NOTIFICATIONS_KEY, state.usedIds);
    };

    const saveInstallationDate = async () => {
      state.installationDate = new Date();
      await storageLocal.set(INSTALLATION_DATE_KEY, state.installationDate);
    };

    const loadInstallationDate = async () => {
      const storedDate = await storageLocal.get(INSTALLATION_DATE_KEY, null);
      if (storedDate) {
        state.installationDate = new Date(storedDate);
      } else {
        await saveInstallationDate();
      }
    };

    const setupNotificationCloseHandlers = () => {
      document.addEventListener("click", async (event) => {
        const closeButton = event.target.closest(".js-notification__close");
        if (closeButton) {
          const notificationId = closeButton.dataset.id;
          await markNotificationAsUsed(notificationId);
          closeButton.closest(".notification").classList.remove("is-active");
          document.querySelector("html").style.minHeight = "auto";
        }
      });
    };

    module.exports = {
      initNotifications: async () => {
        await loadInstallationDate();
        await loadUsedNotificationIds();
        setupNotificationCloseHandlers();
      },

      getNotification: () => {
        const daysSinceInstallation = Math.floor(
          (state.date - state.installationDate) / 1000 / 60 / 60 / 24
        );

        return notifications
          .filter(notification => state.date >= new Date(notification.dateFrom))
          .filter(notification => state.date <= new Date(notification.dateTo))
          .filter(notification => state.usedIds.indexOf(notification.id) === -1)
          .filter(notification => notification.minDaysFromInstallation <= daysSinceInstallation)
          .filter(notification =>
            notification.maxDaysFromInstallation === null ||
            daysSinceInstallation <= notification.maxDaysFromInstallation
          )
          .sort((a, b) => a.priority - b.priority)
          .pop();
      },

      STORAGE_KEY_INSTALLATION_DATE: INSTALLATION_DATE_KEY
    };
  }, {
    "../config/notifications": 1,
    "./chrome/storage-local.js": 2
  }],

  // Module 5: Service worker/main entry point
  5: [function (require) {
    const config = require("./modules/config");
    const storageLocal = require("./modules/chrome/storage-local.js");
    const { STORAGE_KEY_INSTALLATION_DATE } = require("./modules/notifications.js");

    const OFFSCREEN_DOCUMENT_PATH = "html/offscreen.html";
    // Updated: 2026-01-06T12:20:00
    const APP_VERSION_KEY = "app-version";

    const hasOffscreenDocument = async () => {
      if ("getContexts" in chrome.runtime) {
        const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
        const contexts = await chrome.runtime.getContexts({
          contextTypes: ["OFFSCREEN_DOCUMENT"],
          documentUrls: [offscreenUrl]
        });
        return contexts.length > 0;
      } else {
        // Fallback for older Chrome versions
        const clients = await clients.matchAll();
        return clients.some(client =>
          client.url.includes(chrome.runtime.id) &&
          client.url.includes(OFFSCREEN_DOCUMENT_PATH)
        );
      }
    };

    const createOffscreenDocument = async () => {
      const hasDocument = await hasOffscreenDocument();
      if (!hasDocument) {
        await chrome.offscreen.createDocument({
          url: OFFSCREEN_DOCUMENT_PATH,
          reasons: ["USER_MEDIA"],
          justification: "Capture MediaStream (audio only) of the currently active tab (chrome.tabCapture API)"
        });
      }
    };

    // Listen for messages
    chrome.runtime.onMessage.addListener(async (message) => {
      if (message.target === config.TARGET_SERVICE_WORKER) {
        if (message.action === config.ACTION_INIT_OFFSCREEN_DOCUMENT) {
          await createOffscreenDocument();
        }
        else if (
          message.action === config.ACTION_POPUP_GAIN_CHANGE ||
          message.action === config.ACTION_POPUP_BIQUAD_FILTER_CHANGE
        ) {
          // Get existing audio data or create new media stream
          const audioData = await chrome.runtime.sendMessage({
            action: config.ACTION_POPUP_AUDIO_DATA_GET,
            target: config.TARGET_OFFSCREEN_DOCUMENT,
            tabId: message.tabId
          });

          let mediaStreamId = null;
          if (!audioData) {
            mediaStreamId = await chrome.tabCapture.getMediaStreamId({
              targetTabId: message.tabId
            });
          }

          // Diagnostic logging for forwarded messages
          console.log('service-worker: forwarding', message.action, 'for tab', message.tabId, 'mediaStreamId:', mediaStreamId, 'audioDataExists:', !!audioData);

          if (message.action === config.ACTION_POPUP_GAIN_CHANGE) {
            await chrome.runtime.sendMessage({
              action: config.ACTION_POPUP_GAIN_CHANGE,
              target: config.TARGET_OFFSCREEN_DOCUMENT,
              tabId: message.tabId,
              volumeValue: message.volumeValue,
              mediaStreamId: mediaStreamId
            });
          }
          else if (message.action === config.ACTION_POPUP_BIQUAD_FILTER_CHANGE) {
            await chrome.runtime.sendMessage({
              action: config.ACTION_POPUP_BIQUAD_FILTER_CHANGE,
              target: config.TARGET_OFFSCREEN_DOCUMENT,
              tabId: message.tabId,
              algorithm: message.algorithm,
              frequency: message.frequency,
              q: message.q,
              gain: message.gain,
              mediaStreamId: mediaStreamId
            });
          }
        }
      }
    });

    // Handle tab closure
    chrome.tabs.onRemoved.addListener(async (tabId) => {
      await createOffscreenDocument();
      await chrome.runtime.sendMessage({
        action: config.ACTION_TAB_CLOSED,
        target: config.TARGET_OFFSCREEN_DOCUMENT,
        tabId: tabId
      });
    });

    // Handle installation and updates
    chrome.runtime.onInstalled.addListener(async (details) => {
      const currentVersion = config.getAppVersion();

      if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        // Open install page on first install
        await chrome.tabs.create({ url: config.INSTALL_URL });
      }
      else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        const previousVersion = await storageLocal.get(APP_VERSION_KEY, null);
        const installationDate = await storageLocal.get(STORAGE_KEY_INSTALLATION_DATE, null);

        let daysSinceInstallation = null;
        if (installationDate) {
          daysSinceInstallation = Math.floor((Date.now() - new Date(installationDate)) / 86400000);
        }

        // Show update page for specific versions
        if (
          (!previousVersion || previousVersion !== currentVersion) &&
          config.APP_VERSION_WITH_UPDATE_URL.includes(currentVersion)
        ) {
          let updateUrl = config.getUpdateUrl();

          if (
            config.APP_VERSION_WITH_UPDATE_URL_EXTENDED.includes(currentVersion) &&
            daysSinceInstallation
          ) {
            updateUrl = config.updateUrl(updateUrl, { d: daysSinceInstallation });
            await chrome.tabs.create({ url: updateUrl });
          } else {
            await chrome.tabs.create({ url: updateUrl });
          }
        }
      }

      // Store current version
      await storageLocal.set(APP_VERSION_KEY, currentVersion);
    });

    // Set uninstall URL
    chrome.runtime.setUninstallURL(config.UNINSTALL_URL);
  }, {
    "./modules/chrome/storage-local.js": 2,
    "./modules/config": 3,
    "./modules/notifications.js": 4
  }]
}, {}, [5]);