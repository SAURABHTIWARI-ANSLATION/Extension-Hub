(function () {
  // Module bundler function
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
    "../modules/config": 9
  }],

  // Module 2: Reset action UI
  2: [function (require, module) {
    const config = require("./config");
    const { getSliderValues } = require("./audio-gain.js");

    const resetButton = document.querySelector(".js-actions__reset");
    const restoreButton = document.querySelector(".js-actions__restore");
    const volumeSlider = document.querySelector(config.HTML_JS_HOOK_VOLUME_SLIDER);
    const defaultVolume = 100;

    const renderActionResetUI = async (tabId) => {
      const audioData = await chrome.runtime.sendMessage({
        action: config.ACTION_POPUP_AUDIO_DATA_GET,
        target: config.TARGET_OFFSCREEN_DOCUMENT,
        tabId: tabId
      });

      if (!audioData) {
        resetButton.classList.add("is-hidden");
        if (restoreButton.classList.contains("is-hidden")) {
          resetButton.classList.remove("is-hidden");
          resetButton.setAttribute("disabled", "disabled");
        }
      } else {
        resetButton.classList.remove("is-hidden");
        const sliderValues = getSliderValues(config.VOLUME_VALUE_DEFAULT);
        volumeSlider.value == sliderValues.indexOf(defaultVolume) ?
          resetButton.setAttribute("disabled", "disabled") :
          resetButton.removeAttribute("disabled");
      }
    };

    const setupResetButton = () => {
      resetButton.addEventListener("click", () => {
        const sliderValues = getSliderValues(config.VOLUME_VALUE_DEFAULT);
        volumeSlider.value = sliderValues.indexOf(defaultVolume);
        volumeSlider.dispatchEvent(new Event("input"));
        volumeSlider.dispatchEvent(new Event("change"));
      });
    };

    module.exports = {
      initActionResetUI: async (tabId) => {
        await renderActionResetUI(tabId);
        setupResetButton();
      },
      renderActionResetUI: renderActionResetUI
    };
  }, {
    "./audio-gain.js": 7,
    "./config": 9
  }],

  // Module 3: Restore action UI
  3: [function (require, module) {
    const config = require("./config");
    const storageLocal = require("./chrome/storage-local.js");
    const { getSliderValues, getClosestValue } = require("./audio-gain.js");

    const restoreButton = document.querySelector(".js-actions__restore");
    const restoreValueElement = document.querySelector(".js-actions__restore-value");
    const restoreDomainElement = document.querySelector(".js-actions__restore-domain");
    const volumeSlider = document.querySelector(config.HTML_JS_HOOK_VOLUME_SLIDER);
    const DOMAINS_SETTINGS_KEY = "domains-settings";

    const initActionRestoreUI = async (tabId, url) => {
      const audioData = await chrome.runtime.sendMessage({
        action: config.ACTION_POPUP_AUDIO_DATA_GET,
        target: config.TARGET_OFFSCREEN_DOCUMENT,
        tabId: tabId,
        source: "action-restore-ui"
      });

      if (audioData) {
        restoreButton.classList.add("is-hidden");
      } else {
        const domainsSettings = await storageLocal.get(DOMAINS_SETTINGS_KEY, {});
        const domain = new URL(url).hostname;
        const savedVolume = domainsSettings[domain] && domainsSettings[domain].volume;

        if (Number.isInteger(savedVolume)) {
          restoreButton.classList.remove("is-hidden");
          restoreValueElement.textContent = savedVolume;
          restoreDomainElement.textContent = domain;

          restoreButton.addEventListener("click", () => {
            const sliderValues = getSliderValues(volumeSlider.dataset.maxVolume);
            const closestValue = getClosestValue(sliderValues, savedVolume);
            volumeSlider.value = sliderValues.indexOf(closestValue);
            volumeSlider.dispatchEvent(new Event("input"));
            volumeSlider.dispatchEvent(new Event("change"));
          }, { once: true });
        }
      }
    };

    const updateActionRestoreUI = async (url, sliderIndex) => {
      const sliderValues = getSliderValues(volumeSlider.dataset.maxVolume);
      const domainsSettings = await storageLocal.get(DOMAINS_SETTINGS_KEY, {});
      const domain = new URL(url).hostname;
      const volumeValue = sliderValues[sliderIndex];

      domainsSettings[domain] = domainsSettings[domain] || {};
      domainsSettings[domain].volume = volumeValue;

      if (volumeValue === config.VOLUME_VALUE_DEFAULT) {
        delete domainsSettings[domain].volume;
      }

      await storageLocal.set(DOMAINS_SETTINGS_KEY, domainsSettings);
      restoreButton.classList.add("is-hidden");
    };

    module.exports = {
      initActionRestoreUI: initActionRestoreUI,
      updateActionRestoreUI: updateActionRestoreUI
    };
  }, {
    "./audio-gain.js": 7,
    "./chrome/storage-local.js": 8,
    "./config": 9
  }],

  // Module 4: Audio analyser UI
  4: [function (require, module) {
    const floor = Math.floor;
    const config = require("./config");
    const MAX_VALUE = 255;

    let isFrequencySet = false;
    const frequencySlider = document.querySelector(".js-audio-equalizer__frequency");
    const analyserContainer = document.querySelector(".js-audio-analyser");
    const beforeWrapper = analyserContainer.querySelector(".js-audio-analyser__before-wrapper");
    const beforeCanvas = analyserContainer.querySelector(".js-audio-analyser__before-canvas");
    const beforeContext = beforeCanvas.getContext("2d");
    const beforeFreqEnd = analyserContainer.querySelector(".js-audio-analyser__before-freq-end");
    const afterWrapper = analyserContainer.querySelector(".js-audio-analyser__after-wrapper");
    const afterCanvas = analyserContainer.querySelector(".js-audio-analyser__after-canvas");
    const afterContext = afterCanvas.getContext("2d");
    const afterFreqEnd = analyserContainer.querySelector(".js-audio-analyser__after-freq-end");

    const lastRenderedTime = { before: 0, after: 0 };
    let currentTabId;

    const initAnalyserUI = async (tabId) => {
      currentTabId = tabId;
      analyserContainer.classList.remove("is-hidden");

      if (config.ANALYSER_BEFORE_ENABLED) {
        beforeWrapper.classList.remove("is-hidden");
        beforeCanvas.width = beforeWrapper.offsetWidth;
        requestAnimationFrame(await renderBeforeAnalyser);
      }

      if (config.ANALYSER_AFTER_ENABLED) {
        afterWrapper.classList.remove("is-hidden");
        afterCanvas.width = afterWrapper.offsetWidth;
        requestAnimationFrame(await renderAfterAnalyser);
      }
    };

    const renderBeforeAnalyser = async (timestamp) => {
      requestAnimationFrame(await renderBeforeAnalyser);
      await renderAnalyser(timestamp, "before", config.ACTION_POPUP_ANALYSER_BEFORE_DATA_GET, beforeCanvas, beforeContext);
    };

    const renderAfterAnalyser = async (timestamp) => {
      requestAnimationFrame(await renderAfterAnalyser);
      await renderAnalyser(timestamp, "after", config.ACTION_POPUP_ANALYSER_AFTER_DATA_GET, afterCanvas, afterContext);
    };

    const renderAnalyser = async (timestamp, type, action, canvas, context) => {
      if (!(timestamp - lastRenderedTime[type] < config.ANALYSER_INTERVAL)) {
        lastRenderedTime[type] = timestamp;

        const analyserData = await chrome.runtime.sendMessage({
          action: action,
          target: config.TARGET_OFFSCREEN_DOCUMENT,
          tabId: currentTabId
        });

        if (analyserData) {
          const { dataArray, bufferLength, sampleRate } = analyserData;

          if (!isFrequencySet) {
            beforeFreqEnd.textContent = sampleRate / 2;
            afterFreqEnd.textContent = sampleRate / 2;
            frequencySlider.setAttribute("max", sampleRate / 2);
            isFrequencySet = true;
          }

          context.clearRect(0, 0, canvas.width, canvas.height);

          const barWidth = canvas.width / bufferLength;
          const barPadding = Math.ceil(barWidth);
          const canvasHeight = canvas.height;

          for (let i = 0; i < bufferLength; i++) {
            const value = dataArray[i];
            const x = floor(i * barWidth);
            const barHeight = floor(canvasHeight * value / MAX_VALUE);
            const y = canvasHeight - barHeight;

            context.fillStyle = `hsl(${value + 125}, 100%, 65%)`;
            context.fillRect(x, y, barPadding, barHeight);
          }
        }
      }
    };

    module.exports = {
      initAnalyserUI: initAnalyserUI
    };
  }, {
    "./config": 9
  }],

  // Module 5: Audio equalizer UI
  5: [function (require, module) {
    const config = require("./config");
    const { renderActionResetUI } = require("./action-reset-ui");

    const equalizerContainer = document.querySelector(".js-audio-equalizer");
    const presetButtons = equalizerContainer.querySelectorAll(".js-audio-equalizer__preset");
    const algorithmSelect = document.querySelector(".js-audio-equalizer__algorithm");
    const frequencySlider = document.querySelector(".js-audio-equalizer__frequency");
    const frequencyValue = document.querySelector(".js-audio-equalizer__frequency-value");
    const qSlider = document.querySelector(".js-audio-equalizer__q");
    const qValue = document.querySelector(".js-audio-equalizer__q-value");
    const gainSlider = document.querySelector(".js-audio-equalizer__gain");
    const gainValue = document.querySelector(".js-audio-equalizer__gain-value");

    const applyEqualizerSettings = async (tabId, settings) => {
      const { algorithm, frequency, q, gain } = settings;

      await chrome.runtime.sendMessage({
        action: config.ACTION_POPUP_BIQUAD_FILTER_CHANGE,
        target: config.TARGET_SERVICE_WORKER,
        tabId: tabId,
        algorithm: algorithm,
        frequency: frequency,
        q: q,
        gain: gain
      });

      await renderActionResetUI(tabId);
    };

    const updateUIValues = (algorithm, frequency, q, gain) => {
      algorithmSelect.value = algorithm;
      frequencySlider.value = frequency;
      frequencyValue.textContent = frequency;
      qSlider.value = q;
      qValue.textContent = q;
      gainSlider.value = gain;
      gainValue.textContent = gain;
    };

    const loadEqualizerSettings = async (tabId) => {
      const audioData = await chrome.runtime.sendMessage({
        action: config.ACTION_POPUP_AUDIO_DATA_GET,
        target: config.TARGET_OFFSCREEN_DOCUMENT,
        tabId: tabId
      });

      if (audioData) {
        const { algorithm, frequency, q, gain } = audioData.equalizer;
        updateUIValues(algorithm, frequency, q, gain);

        const activePreset = Object.keys(config.EQUALIZER_PRESETS).find(presetKey => {
          const preset = config.EQUALIZER_PRESETS[presetKey];
          return preset.algorithm === algorithm &&
            preset.frequency === frequency &&
            preset.q === q &&
            preset.gain === gain;
        });

        presetButtons.forEach(button => {
          button.classList.remove("is-active");
        });

        const activeButton = equalizerContainer.querySelector(`[data-equalizer-type="${activePreset}"]`);
        if (activeButton) {
          activeButton.classList.add("is-active");
        } else {
          presetButtons[0].classList.add("is-active");
        }
      }
    };

    const setupEqualizerControls = (tabId) => {
      algorithmSelect.addEventListener("change", async (event) => {
        await applyEqualizerSettings(tabId, { algorithm: event.target.value });
      });

      frequencySlider.addEventListener("input", async (event) => {
        await applyEqualizerSettings(tabId, { frequency: event.target.value });
      });

      qSlider.addEventListener("input", async (event) => {
        await applyEqualizerSettings(tabId, { q: event.target.value });
      });

      gainSlider.addEventListener("input", async (event) => {
        await applyEqualizerSettings(tabId, { gain: event.target.value });
      });

      presetButtons.forEach(button => {
        button.addEventListener("click", async () => {
          presetButtons.forEach(btn => btn.classList.remove("is-active"));
          button.classList.add("is-active");

          const presetType = button.dataset.equalizerType;
          const { algorithm, frequency, q, gain } = config.EQUALIZER_PRESETS[presetType];

          updateUIValues(algorithm, frequency, q, gain);
          await applyEqualizerSettings(tabId, { algorithm, frequency, q, gain });
        });
      });
    };

    module.exports = {
      initSliderEqualizerUI: async (tabId) => {
        await loadEqualizerSettings(tabId);
        setupEqualizerControls(tabId);
      }
    };
  }, {
    "./action-reset-ui": 2,
    "./config": 9
  }],

  // Module 6: Audio gain UI
  6: [function (require, module) {
    const config = require("./config");
    const { updateBadge } = require("./utils.js");
    const storageLocal = require("./chrome/storage-local.js");
    const { getSliderValues, getClosestValue } = require("./audio-gain.js");
    const { renderActionResetUI } = require("./action-reset-ui");
    const { updateActionRestoreUI } = require("./action-restore-ui");

    const volumeSlider = document.querySelector(config.HTML_JS_HOOK_VOLUME_SLIDER);
    const maxVolumeElement = document.querySelector(".js-volume-info__volume-max");
    const currentVolumeElement = document.querySelector(".js-volume-info__volume-value");
    const restoreButton = document.querySelector(".js-actions__restore");

    let lastWheelEventTime = 0;

    const initializeVolumeSlider = async (tabId) => {
      const defaultVolume = config.VOLUME_VALUE_DEFAULT;
      const maxVolume = volumeSlider.dataset.maxVolume || config.VOLUME_VALUE_MAX;
      const sliderValues = getSliderValues(maxVolume);

      volumeSlider.setAttribute("min", 0);
      volumeSlider.setAttribute("max", sliderValues.length - 1);

      let currentValue = getClosestValue(sliderValues, defaultVolume);
      maxVolumeElement.textContent = maxVolume;
      currentVolumeElement.textContent = currentValue;
      volumeSlider.value = sliderValues.indexOf(currentValue);

      const audioData = await chrome.runtime.sendMessage({
        action: config.ACTION_POPUP_AUDIO_DATA_GET,
        target: config.TARGET_OFFSCREEN_DOCUMENT,
        tabId: tabId
      });

      if (audioData) {
        const actualValue = getClosestValue(sliderValues, 100 * audioData.gain.gain);
        volumeSlider.value = sliderValues.indexOf(actualValue);
        currentVolumeElement.textContent = actualValue;
        volumeSlider.dispatchEvent(new Event("input"));
        volumeSlider.dispatchEvent(new Event("change"));
      }
    };

    const updateVolume = async (tabId, sliderIndex) => {
      const sliderValues = getSliderValues(volumeSlider.dataset.maxVolume);
      const volumeValue = sliderValues[sliderIndex];

      currentVolumeElement.textContent = volumeValue;
      await chrome.runtime.sendMessage({
        action: config.ACTION_POPUP_GAIN_CHANGE,
        target: config.TARGET_SERVICE_WORKER,
        tabId: tabId,
        volumeValue: volumeValue
      });

      await renderActionResetUI(tabId);
      updateBadge(tabId, volumeValue);
    };

    const setupVolumeControls = async (tabId, url) => {
      let scrollDirection = await storageLocal.get(
        config.STORAGE_KEY_SCROLL_DIRECTION_INVERTED,
        config.STORAGE_VALUE_SCROLL_DIRECTION_INVERTED_DEFAULT
      );

      storageLocal.watch(config.STORAGE_KEY_SCROLL_DIRECTION_INVERTED, (value) => {
        scrollDirection = value;
      });

      volumeSlider.addEventListener("input", async (event) => {
        await updateVolume(tabId, event.target.value);
        restoreButton.classList.add("is-hidden");
      });

      volumeSlider.addEventListener("wheel", (event) => {
        event.preventDefault();
        const currentTime = Date.now();

        if (!(currentTime - lastWheelEventTime < 100)) {
          const direction = Math.sign(event.deltaY) * (scrollDirection ? -1 : 1);
          volumeSlider.value = parseInt(volumeSlider.value, 10) + direction;
          volumeSlider.dispatchEvent(new Event("input"));
          volumeSlider.dispatchEvent(new Event("change"));
          lastWheelEventTime = currentTime;
        }
      }, { passive: false });

      volumeSlider.addEventListener("change", async () => {
        await updateActionRestoreUI(url, volumeSlider.value);
      });
    };

    module.exports = {
      initAudioGainUI: async (tabId, url) => {
        await initializeVolumeSlider(tabId);
        await setupVolumeControls(tabId, url);
      }
    };
  }, {
    "./action-reset-ui": 2,
    "./action-restore-ui": 3,
    "./audio-gain.js": 7,
    "./chrome/storage-local.js": 8,
    "./config": 9,
    "./utils.js": 27
  }],

  // Module 7: Audio gain utilities
  7: [function (require, module) {
    const abs = Math.abs;

    module.exports = {
      getSliderValues: (maxVolume) => {
        const values = [];
        for (let i = 0; i < 10; i++) values.push(i);
        for (let i = 10; i <= maxVolume; i += 10) values.push(i);
        return values;
      },

      getClosestValue: (values, target) =>
        values.reduce((closest, current) =>
          abs(current - target) < abs(closest - target) ? current : closest
        )
    };
  }, {}],

  // Module 8: Chrome storage local wrapper
  8: [function (require, module) {
    module.exports = {
      get: async (key, defaultValue) => {
        const storageObject = { [key]: JSON.stringify(defaultValue) };
        const result = await chrome.storage.local.get(storageObject);
        return JSON.parse(result[key]);
      },

      set: async (key, value) => {
        const storageObject = { [key]: JSON.stringify(value) };
        await chrome.storage.local.set(storageObject);
      },

      watch: async (key, callback) => {
        chrome.storage.local.onChanged.addListener((changes) => {
          if (key in changes) {
            const newValue = JSON.parse(changes[key].newValue);
            callback(newValue);
          }
        });
      },

      getBytesInUse: async (key) => chrome.storage.local.getBytesInUse(key)
    };
  }, {}],

  // Module 9: Configuration
  9: [function (require, module) {
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

  // Module 10: Dark mode switch UI
  10: [function (require, module) {
    const storageLocal = require("./chrome/storage-local.js");
    const STORAGE_KEY_DARK_MODE = "dark-mode";

    const body = document.querySelector("body");
    const darkModeSwitch = document.querySelector(".js-dark-mode-switch");
    const darkModeCheckbox = darkModeSwitch.querySelector(".js-dark-mode-switch__checkbox");

    module.exports = {
      initDarkModeSwitchUI: async () => {
        const isDarkMode = await storageLocal.get(STORAGE_KEY_DARK_MODE, false);

        if (isDarkMode) {
          body.classList.add("dark-mode");
          darkModeCheckbox.checked = true;
        }

        setTimeout(() => {
          body.classList.add("animated");
        }, 300);

        darkModeCheckbox.addEventListener("change", async () => {
          if (darkModeCheckbox.checked) {
            body.classList.add("dark-mode");
            await storageLocal.set(STORAGE_KEY_DARK_MODE, true);
          } else {
            body.classList.remove("dark-mode");
            await storageLocal.set(STORAGE_KEY_DARK_MODE, false);
          }
        });
      }
    };
  }, {
    "./chrome/storage-local.js": 8
  }],

  // Module 11: Diagnostics UI
  11: [function (require, module) {
    const storageLocal = require("./chrome/storage-local.js");
    const { STORAGE_KEY_INSTALLATION_DATE } = require("./notifications.js");

    const diagnosticsContainer = document.querySelector(".js-diagnostics");
    const diagnosticsCog = document.querySelector(".js-diagnostics__cog");
    const diagnosticsData = document.querySelector(".js-diagnostics__data");
    const diagnosticsDataEncoded = document.querySelector(".js-diagnostics__data-encoded");

    const generateDiagnosticsData = async () => {
      const manifest = chrome.runtime.getManifest();
      const platformInfo = await chrome.runtime.getPlatformInfo();
      const installationDate = await storageLocal.get(STORAGE_KEY_INSTALLATION_DATE, null);
      const storageUsed = await storageLocal.getBytesInUse(null);

      const userAgentDataBrands = navigator.userAgentData &&
        navigator.userAgentData.brands.map(brand => `${brand.brand} ${brand.version}`).join(", ");

      const fullVersionList = navigator.userAgentData &&
        (await navigator.userAgentData.getHighEntropyValues(["fullVersionList"])).fullVersionList
          .map(item => `${item.brand} ${item.version}`).join(", ");

      const diagnosticsText = `
    <strong>App ID</strong>: ${chrome.runtime.id}
    <strong>App name</strong>: ${manifest.name}
    <strong>App version</strong>: ${manifest.version}
    <strong>Installed</strong>: ${installationDate}
    <strong>Storage used</strong>: ${storageUsed} B
    <strong>Platform OS</strong>: ${platformInfo.os}
    <strong>Platform arch</strong>: ${platformInfo.arch}
    <strong>User agent</strong>: ${navigator.userAgent}
    <strong>UA data</strong>: ${userAgentDataBrands}
    <strong>UA data - full</strong>: ${fullVersionList}
    `.split("\n").map(line => line.trim()).filter(line => !!line).join("\n");

      diagnosticsData.innerHTML = diagnosticsText;

      // Encode and reverse the data
      const encodedData = btoa(diagnosticsData.textContent).replace(/=+$/, "").split("").reverse().join("");
      diagnosticsDataEncoded.textContent = encodedData;
    };

    const setupDiagnosticsToggle = () => {
      diagnosticsCog.addEventListener("click", () => {
        diagnosticsContainer.classList.toggle("is-hidden");
        if (!diagnosticsContainer.classList.contains("is-hidden")) {
          generateDiagnosticsData();
        }
      });
    };

    module.exports = {
      initDiagnosticsUI: async () => {
        setupDiagnosticsToggle();
      }
    };
  }, {
    "./chrome/storage-local.js": 8,
    "./notifications.js": 15
  }],

  // Module 12: Footer UI
  12: [function (require, module) {
    const config = require("./config");
    const footerLink = document.querySelector(".js-footer-link");

    // Remove link functionality
    if (footerLink) {
      footerLink.removeAttribute("href");
      footerLink.style.pointerEvents = "none";
      footerLink.style.cursor = "default";
    }

    module.exports = {
      initFooterUI: () => { }
    };
  }, {
    "./config": 9
  }],

  // Module 13: Keyboard shortcuts
  13: [function (require, module) {
    const config = require("./config");
    const { getSliderValues, getClosestValue } = require("./audio-gain.js");
    const volumeSlider = document.querySelector(config.HTML_JS_HOOK_VOLUME_SLIDER);

    module.exports = {
      initKeyboardShortcuts: () => {
        document.documentElement.addEventListener("keypress", (event) => {
          if (event.target.classList.contains("js-support__code")) return;

          event.preventDefault();
          const key = event.key.toLowerCase();
          const numberKey = +key;

          if (!isNaN(numberKey)) {
            const sliderValues = getSliderValues(volumeSlider.dataset.maxVolume);
            const targetVolume = getClosestValue(sliderValues, 100 * numberKey);
            const minValue = sliderValues[volumeSlider.min];
            const maxValue = sliderValues[volumeSlider.max];

            if (minValue <= targetVolume && targetVolume <= maxValue) {
              volumeSlider.value = sliderValues.indexOf(targetVolume);
              volumeSlider.dispatchEvent(new Event("input"));
              volumeSlider.dispatchEvent(new Event("change"));
              return;
            }
          }

          switch (key) {
            case "d":
              document.querySelector("[data-equalizer-type=\"default\"]").click();
              break;
            case "v":
              document.querySelector("[data-equalizer-type=\"voice\"]").click();
              break;
            case "b":
              document.querySelector("[data-equalizer-type=\"bass\"]").click();
              break;
            case "r":
              window.location.reload();
              break;
          }
        });
      }
    };
  }, {
    "./audio-gain.js": 7,
    "./config": 9
  }],

  // Module 14: Notifications UI
  14: [function (require, module) {
    const notifications = require("./notifications");

    const showNotification = (notification) => {
      document.querySelector(".js-notification").classList.add("is-active");
      document.querySelector(".js-notification__close").dataset.id = notification.id;
      document.querySelector(".js-notification__title").innerHTML = notification.title;
      document.querySelector(".js-notification__message").innerHTML = notification.message;
    };

    module.exports = {
      initNotificationsUI: async () => {
        await notifications.initNotifications();
        const notification = notifications.getNotification();
        if (notification) {
          showNotification(notification);
        }
      }
    };
  }, {
    "./notifications": 15
  }],

  // Module 15: Notifications module
  15: [function (require, module) {
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
    "./chrome/storage-local.js": 8
  }],

  // Module 16: Offscreen document initializer
  16: [function (require, module) {
    const config = require("./config");

    const initOffscreenDocument = async () => {
      await chrome.runtime.sendMessage({
        action: config.ACTION_INIT_OFFSCREEN_DOCUMENT,
        target: config.TARGET_SERVICE_WORKER
      });
    };

    module.exports = {
      initOffscreenDocument: async () => {
        await initOffscreenDocument();
      }
    };
  }, {
    "./config": 9
  }],

  // Module 17: Outdated browsers manager
  17: [function (require, module) {
    const outdatedBrowsersManager = document.querySelector(".js-outdated-browsers-manager");

    const extractChromeVersion = (userAgent) => {
      const chromeVersionRegex = /Chrome\/(\d+)/;
      const match = userAgent.match(chromeVersionRegex);
      return match ? match[1] : null;
    };

    const checkBrowserVersion = async () => {
      const userAgent = navigator.userAgent;
      const chromeVersion = extractChromeVersion(userAgent);

      if (chromeVersion && chromeVersion < 116) {
        outdatedBrowsersManager.classList.remove("is-hidden");
      }
    };

    module.exports = {
      initOutdatedBrowsersManagerUI: async () => {
        await checkBrowserVersion();
      }
    };
  }, {}],

  // Module 18: Promo show switch UI (Removed)
  18: [function (require, module) {
    module.exports = { initPromoShowSwitchUI: () => { } };
  }, {}],

  // Module 19: Promo UI (Removed)
  19: [function (require, module) {
    module.exports = { initPromoUI: () => { } };
  }, {}],

  // Module 20: Rating and made by switch UI (Removed)
  20: [function (require, module) {
    module.exports = { initRatingAndMadeBySwitchUI: () => { } };
  }, {}],

  // Module 21: Rating and made by UI (Removed)
  21: [function (require, module) {
    module.exports = { initRatingAndMadeByUI: () => { } };
  }, {}],

  // Module 22: Rating UI (Removed)
  22: [function (require, module) {
    module.exports = { initRatingUI: () => { } };
  }, {}],

  // Module 23: Scroll direction switch UI
  23: [function (require, module) {
    const storageLocal = require("./chrome/storage-local.js");
    const config = require("./config.js");

    const scrollDirectionSwitch = document.querySelector(".js-scroll-direction-switch");
    const scrollDirectionCheckbox = scrollDirectionSwitch.querySelector(".js-scroll-direction-switch__checkbox");

    module.exports = {
      initScrollDirectionSwitchUI: async () => {
        const scrollDirection = await storageLocal.get(
          config.STORAGE_KEY_SCROLL_DIRECTION_INVERTED,
          config.STORAGE_VALUE_SCROLL_DIRECTION_INVERTED_DEFAULT
        );

        scrollDirectionCheckbox.checked = scrollDirection;

        scrollDirectionCheckbox.addEventListener("change", async () => {
          if (scrollDirectionCheckbox.checked) {
            await storageLocal.set(
              config.STORAGE_KEY_SCROLL_DIRECTION_INVERTED,
              config.STORAGE_VALUE_SCROLL_DIRECTION_INVERTED_INVERTED
            );
          } else {
            await storageLocal.set(
              config.STORAGE_KEY_SCROLL_DIRECTION_INVERTED,
              config.STORAGE_VALUE_SCROLL_DIRECTION_INVERTED_REGULAR
            );
          }
        });
      }
    };
  }, {
    "./chrome/storage-local.js": 8,
    "./config.js": 9
  }],

  // Module 24: Settings UI
  24: [function (require, module) {
    const config = require("./config");
    const storageLocal = require("./chrome/storage-local");

    const settingsSwitch = document.querySelector(".js-settings-switch");
    const settingsFrame = document.querySelector(".js-settings-frame");

    module.exports = {
      initSettingsUI: async () => {
        settingsSwitch.addEventListener("click", () => {
          settingsFrame.classList.toggle("is-hidden");
        });
      }
    };
  }, {
    "./chrome/storage-local": 8,
    "./config": 9
  }],

  // Module 25: Supporter UI
  25: [function (require, module) {
    const config = require("./config");
    const storageLocal = require("./chrome/storage-local.js");

    const IS_PREMIUM_KEY = "is-premium";
    const volumeSlider = document.querySelector(config.HTML_JS_HOOK_VOLUME_SLIDER);
    const heartButton = document.querySelector(".js-heart");
    const supportContainer = document.querySelector(".js-support");
    const supportCodeInput = document.querySelector(".js-support__code");
    const activateButton = document.querySelector(".js-support__activate");
    const thankYouMessage = document.querySelector(".js-support__thankyou");
    const invalidCodeMessage = document.querySelector(".js-support__invalid-code");

    // Force premium logic
    const activatePremium = async () => {
      // Always set to premium
      await storageLocal.set(IS_PREMIUM_KEY, true);
    };

    const enablePremiumFeatures = () => {
      volumeSlider.dataset.maxVolume = 800;
    };

    // Remove event listeners or make them do nothing relevant for payment
    if (heartButton) heartButton.style.display = 'none';

    module.exports = {
      initSupporterUI: enablePremiumFeatures,
      loadIsSupporter: async () => true // Always return true for isSupporter
    };
  }, {
    "./chrome/storage-local.js": 8,
    "./config": 9
  }],

  // Module 26: Tabs UI
  26: [function (require, module) {
    const tabsTitle = document.querySelector(".js-tabs__title");
    const tabsList = document.querySelector(".js-tabs__list");

    const loadAudibleTabs = async () => {
      const audibleTabs = await chrome.tabs.query({ audible: true });
      audibleTabs.sort((a, b) => b.id - a.id);

      if (audibleTabs.length > 0) {
        tabsTitle.textContent = "Tabs playing audio right now";
        tabsList.classList.add("tabs__list--active");
      } else {
        tabsTitle.textContent = "No tabs playing audio right now";
        tabsList.classList.remove("tabs__list--active");
      }

      audibleTabs.forEach(tab => {
        const template = document.querySelector(".js-template-tab").content;
        template.querySelector(".js-tab").dataset.tabId = tab.id;
        template.querySelector(".js-tab__icon-image").src = tab.favIconUrl;
        template.querySelector(".js-tab__title").textContent = tab.title;
        tabsList.appendChild(document.importNode(template, true));
      });
    };

    const setupTabClickHandler = () => {
      tabsList.addEventListener("click", async (event) => {
        event.preventDefault();
        const target = event.target;
        const tabElement = target.closest(".tab");
        const tabId = parseInt(tabElement.dataset.tabId, 10);

        const updatedTab = await chrome.tabs.update(tabId, { active: true });
        await chrome.windows.update(updatedTab.windowId, { focused: true });
      });
    };

    module.exports = {
      initTabsUI: async () => {
        await loadAudibleTabs();
        setupTabClickHandler();
      }
    };
  }, {}],

  // Module 27: Utilities
  27: [function (require, module) {
    module.exports = {
      updateBadge: (tabId, volume) => {
        chrome.action.setBadgeText({
          text: `${volume}`,
          tabId: tabId
        });
      }
    };
  }, {}],

  // Module 28: Main entry point
  28: [function (require) {
    const { initKeyboardShortcuts } = require("./modules/keyboard-shortcuts");
    const { initNotificationsUI } = require("./modules/notifications-ui");
    const { initSupporterUI, loadIsSupporter } = require("./modules/supporter-ui");
    const { initTabsUI } = require("./modules/tabs-ui");
    const { initAudioGainUI } = require("./modules/audio-gain-ui.js");
    const { initDarkModeSwitchUI } = require("./modules/dark-mode-switch-ui");
    const { initActionResetUI } = require("./modules/action-reset-ui");
    const { initActionRestoreUI } = require("./modules/action-restore-ui");
    const { initSliderEqualizerUI } = require("./modules/audio-equalizer-ui.js");
    const { initAnalyserUI } = require("./modules/audio-analyser-ui.js");
    const { initOffscreenDocument } = require("./modules/offscreen-document.js");
    const { initDiagnosticsUI } = require("./modules/diagnostics-ui.js");
    const { initOutdatedBrowsersManagerUI } = require("./modules/outdated-browsers-manager-ui.js");
    const { initSettingsUI } = require("./modules/settings-ui");
    const { initScrollDirectionSwitchUI } = require("./modules/scroll-direction-switch-ui.js");

    (async () => {
      const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTabId = activeTabs[0].id;
      const currentTabUrl = activeTabs[0].url;

      const isSupporter = await loadIsSupporter();
      if (isSupporter) {
        initSupporterUI();
      }

      await initSettingsUI();
      await initDarkModeSwitchUI();
      await initScrollDirectionSwitchUI();
      await initNotificationsUI();
      await initOffscreenDocument();
      await initAudioGainUI(currentTabId, currentTabUrl);
      await initSliderEqualizerUI(currentTabId);
      await initAnalyserUI(currentTabId);
      await initActionRestoreUI(currentTabId, currentTabUrl);
      await initActionResetUI(currentTabId);
      await initTabsUI();
      await initDiagnosticsUI();
      await initOutdatedBrowsersManagerUI();
      initKeyboardShortcuts();
    })();
  }, {
    "./modules/action-reset-ui": 2,
    "./modules/action-restore-ui": 3,
    "./modules/audio-analyser-ui.js": 4,
    "./modules/audio-equalizer-ui.js": 5,
    "./modules/audio-gain-ui.js": 6,
    "./modules/dark-mode-switch-ui": 10,
    "./modules/diagnostics-ui.js": 11,
    "./modules/keyboard-shortcuts": 13,
    "./modules/notifications-ui": 14,
    "./modules/offscreen-document.js": 16,
    "./modules/outdated-browsers-manager-ui.js": 17,
    "./modules/scroll-direction-switch-ui.js": 23,
    "./modules/settings-ui": 24,
    "./modules/supporter-ui": 25,
    "./modules/tabs-ui": 26
  }]
}, {}, [28]);