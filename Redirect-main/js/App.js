var App = (function(){

  var defaultSettings = {
    showCookie: true,
    testRelcan: true,
    showLRT: true,
    showRobots: true,
    robotsCacheTime: 3600,
    showSelfRelcan: true,
    robotsBlockingNonIndexable: false,
    selfRelcanManuallySet: false,
    highlightNoFollow: false
  };
  var settings = {};

  var pathPerTab = {};

  var timestampRequestStart = {};

  var ChromePlatformAnalytics = {
    init: function(){},
    sendAppView: function(){},
    sendEvent: function(){},
    toggle: function(){}
  };

  var vendor = (navigator.userAgent.match(/(Chrome|Firefox)/) || [])[1];
  var localStorage = {};


  var init = async function(){
    if (typeof chrome.runtime.onInstalled !== 'undefined') {
      chrome.runtime.onInstalled.addListener(onInstallUpdateHandler);
    }
    var uninstallURL = 'https://lrt.li/rtuninstallchrome';
    if (vendor === 'Firefox') uninstallURL = 'https://lrt.li/rtuninstallfirefox';
    chrome.runtime.setUninstallURL(uninstallURL);
    initSettings(function(){
      initMessaging();
      initWebRequestsObserver();
      initWebNavigationObserver();
      initTabEvents();
      // Screenshot.init();
    });
  };


  var onInstallUpdateHandler = function(details){
    if (details.reason === 'install') {
      var welcomeURL = 'https://lrt.li/rtsuccesschrome';
      if (vendor === 'Firefox') welcomeURL = 'https://lrt.li/rtsuccessfirefox';
      chrome.tabs.create({url: welcomeURL});
      sendEvent('install');
    }
    // TODO: not used yet
    // else if (details.reason === 'update') {
    //   var updateURL = 'https://lrt.li/rtupdatechrome';
    //   if (vendor === 'Firefox') updateURL = 'https://lrt.li/rtupdatefirefox';
    //   chrome.tabs.create({url: updateURL});
    //   sendEvent('update');
    // }
  };


  var initSettings = function(cbContinue){
    chrome.storage.local.get('settings', function(data){
      if (data.settings) settings = data.settings;
      for (var key in defaultSettings) {
        if (typeof settings[key] === 'undefined') {
          settings[key] = defaultSettings[key];
        }
      }
      // console.log(settings);
      if (cbContinue) cbContinue();
    });
  };


  var getSettings = function(){
    return settings;
  };


  var initMessaging = function(){
    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        // console.log(request);
        var cmd = request.cmd;
        var tabId = sender.tab ? sender.tab.id : '';
        var data = request.data;

        if (cmd === 'ui.getTabData') {
          var path = pathPerTab[data.tabId];
          sendResponse({
            path: path,
            summary: (path.getIconData(settings) || {})
          });
        }
        else if (cmd === 'page.data') {
          Tracer.processPageData( tabId, sender.tab.url, data );
          updatePath(tabId);
          sendResponse( pathPerTab[tabId].hops[ pathPerTab[tabId].hops.length - 1 ] );
        }
        else if (cmd === 'page.userClick') {
          Tracer.addUserClick(tabId, sender.tab.url);
        }
        else if (cmd === 'popup.check_url') {
          UrlChecker.getStatus(data, function(statusObj){
            sendResponse(statusObj);
          });
          return true;
        }
        else if (cmd === 'settings.get') {
          sendResponse(settings);
        }
        else if (cmd === 'settings.set') {
          if (settings[data.key] !== data.value) {
            ChromePlatformAnalytics.sendEvent(['redirect-trace', 'option changed', data.key + '=' + data.value]);
          }
          settings[ data.key ] = data.value;
          chrome.storage.local.set({settings: settings});
        }
        else if (cmd === 'get_short_trace') {
          getShortTrace(data.tabId, sendResponse);
        }
        else if (cmd === 'export') {
          var res = getFullTrace(data.tabId, data.filename);
          sendResponse(res);
        }
        else if (cmd === 'open_in_tab') {
          chrome.tabs.create({
            url: '/html/popup.html?tabId=' + data.tabId + '&expanded=' + data.expanded
          });
        }
        else if (cmd === 'lrt.getPowerTrust') {
          LRT.getPowerTrust(
            data,
            function(json){
              sendResponse({error: false, data: json});
            },
            function(errorThrown, xhr){
              ChromePlatformAnalytics.sendEvent(['api', 'error', 'powertrust: ' + errorThrown]);
              sendResponse({error: true, data: errorThrown});
            }
          );
          return true;
        }
        else if (cmd === 'lrt.getMetrics') {
          LRT.getMetrics(
            data,
            function(json){
              sendResponse({error: false, data: json});
            },
            function(errorThrown, xhr){
              ChromePlatformAnalytics.sendEvent(['api', 'error', 'metrics: ' + errorThrown]);
              sendResponse({error: true, data: errorThrown});
            }
          );
          return true;
        }
        else if (cmd === 'get_ip_info') {
          var ip = data;
          var cachedResponse = Cache.get(ip);
          if (cachedResponse) {
            sendResponse(cachedResponse);
            return;
          }
          IP.getInfo(ip, function(response){
            if (response && !response.error) {
              Cache.set(ip, response);
              sendResponse(response);
            }
          });
          return true;
        }
        else if (cmd === 'reload_tab') {
          chrome.tabs.update(data.tabId, {
            url: data.url
          });
        }
        else if (cmd === 'track_event') {
          sendEvent(data);
        }
    });
  };


  var initWebRequestsObserver = function(){
    var opts = ["responseHeaders", "extraHeaders"];
    var filter = {urls: ["<all_urls>"]};
    var cbProcessDetails = function(details){
      if (details.type !== 'main_frame') return;
      if (details.tabId < 0) return;
      // console.log("webRequest", details.requestId, details);
      Tracer.addWebRequestInfo(details.tabId, details, timestampRequestStart[details.requestId] );
      delete timestampRequestStart[details.requestId] ;
      setTimeout(updatePath, 300, details.tabId);
    };
    chrome.webRequest.onBeforeRequest.addListener(function(details){
      if (details.type !== 'main_frame') return;
      if (details.tabId < 0) return;
      timestampRequestStart[details.requestId] = Date.now();
    }, filter, []);
    chrome.webRequest.onBeforeRedirect.addListener(cbProcessDetails,filter,opts);
    chrome.webRequest.onCompleted.addListener(cbProcessDetails,filter,opts);
  };


  var initWebNavigationObserver = function(){
    chrome.webNavigation.onCommitted.addListener(function( details ){
      if (details.frameId !== 0) return;
      if (!details.url.match(/^http.*/)) return;
      if (details.url.match(/^https?:\/\/chrome\.google\.com\/webstore/)) return;
      // console.log("webNavigation", details);
      Tracer.addNavigationInfo(details.tabId, details);
      setTimeout(updatePath, 300, details.tabId);
    });
  };


  var initTabEvents = function(){
    chrome.tabs.onReplaced.addListener(function(addedId, removedId){
      console.log('tab replaced: ' + removedId + ' -> ' + addedId);
    });
  };


  var sendEvent = function(action){
    ChromePlatformAnalytics.sendEvent(['redirect-trace', action, vendor]);
  };



  var updatePath = function(tabId){
    var log = Tracer.getLog(tabId);
    var path = new Path( log );
    pathPerTab[tabId] = path;
    chrome.tabs.get(tabId, function(tab){
      if (chrome.runtime.lastError) {}
      else updateIcon(tabId, path);
    });
  };


  var updateIcon = function( tabId, path ){
    var badge = getBadge(path);
    try{
      Icon.setTab(tabId, {
        badge: badge.text,
        badgeBgColor: badge.color,
        title: badge.text + '\n' + (path.getIconData(settings) || {}).summary,
        imageData: RTIcon.getImageData({
          size: 19,
          data: path.getIconData(settings)
        })
      });
    } catch (e) {
      console.log(e);
    }
  };


  var getShortTrace = function(tabId, cbProcessText){
    var path = pathPerTab[tabId];
    var text = path.getShortTrace();
    cbProcessText(text);
  };


  var getFullTrace = function(tabId, filename){
    var path = pathPerTab[tabId];
    var text = path.getFullTrace();
    return text;
  };


  var downloadFile = function(filename, text){
    var dataURL = "data:text/plain;charset=utf-8," + encodeURIComponent(text);
    if (vendor === 'Firefox') {
      var blob = new Blob([text], {
          type: 'text/plain'
      });
      var url = URL.createObjectURL(blob);
      var downloadParams = {
        url: url,
        filename: filename
      };
      // TODO: specify a version when "saveAs" parameter will be supported in stable Firefox release
      if (chrome.runtime.getManifest().version === '') {
        downloadParams.saveAs = true;
      }
      chrome.downloads.download(
        downloadParams,
        function(downloadId) {}
      );
    }
    else {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        var activeTab = tabs[0];
        var a = document.createElement('a');
        a.href = dataURL;
        a.download = filename;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        a.parentNode.removeChild(a);
        setTimeout(function(){
          chrome.tabs.update(activeTab.id, {active: true});
        }, 0);
      });
    }
  };


  var downloadImage = function(filename, dataURL){
    if (vendor === 'Firefox') {
      var blob = dataURItoBlob(dataURL);
      var url = URL.createObjectURL(blob);
      var downloadParams = {
        url: url,
        filename: filename
      };
      // TODO: specify a version when "saveAs" parameter will be supported in stable Firefox release
      if (chrome.runtime.getManifest().version === '') {
        downloadParams.saveAs = true;
      }
      chrome.downloads.download(
        downloadParams,
        function(downloadId) {}
      );
    }
    else {
      var a = document.createElement('a');
      a.href = dataURL;
      a.download = filename;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      a.parentNode.removeChild(a);
    }
  };


  var dataURItoBlob = function(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    var blob = new Blob([ab], {type: mimeString});
    return blob;
  };


  /**
   * The "Badge" of the icon should show 301, 302, JS, META when it’s a
   * "single redirect hop"
   * Whenever there’s more than one redirect in place
   * AND/OR
   * Whenever there’s additional information from
   *        Rel-canonical parsing
   *        Robots.txt parsing
   *        Cookie parsing
   * I.e. more than just a simple redirect
   * Then
   * 1. the “+” shall signal there’s more to look at - I.e. 301+ or JS+
   * 2. for META we write MET+
   * 3. if there’s no other “redirect code”, but one or more rel-canonical
   *    present, then write REL+
   */
  var getBadge = function(path){
    var badge = '';
    var badgeColor = '#000';
    var plus = false;
    var redirects = path.getRedirectsList();

    var redirectsLen = redirects.length;
    if (redirectsLen) {
      badge = redirects[0];
      if (badge.match(/\d+/)) {
        badgeColor = getColorByStatusCode(badge);
        var hasMore30X = false;
        for (var i = 1, len = redirects.length; i < len; i++) {
          var type = redirects[i];
          if (type.match(/^3\d+/)) hasMore30X = true;
        }
        if (hasMore30X) badge = '30X';
      }
    }
    if (badge === 'client') badge = 'JS';
    if (redirectsLen > 1) plus = true;

    if (!path.hops.length) return;
    var hop = path.hops[ path.hops.length - 1 ];

    if (hop.robotsTxt || hop.cookieCount) {
      plus = true;
    }
    if (!badge && hop.relCan) {
      var relCanLast = hop.relCan[ hop.relCan.length - 1 ];
      if (relCanLast.url !== hop.url) badge = 'rel';
    }
    if (!badge && !redirectsLen) {
      badge = hop.statusCode.toString();
      badgeColor = getColorByStatusCode(hop.statusCode);
    }

    if (plus) badge = badge.substr(0,3) + '+';
    return {
      text: badge,
      color: badgeColor
    };
  };


  var getColorByStatusCode = function( statusCode ){
    var code = parseInt(statusCode);
    var color = '#000';
    if (code >= 500) color = '#A00'; // 'red';
    else if (code >= 400) color = '#A00'; // 'red';
    else if (code >= 300) color = '#AA0'; // 'yellow';
    else if (code >= 200) color = '#0A0'; // 'green';
    else if (code >= 100) color = '#AAA'; // 'gray';
    return color;
  };


  return {
    init: init,
    getSettings: getSettings,
    updatePath: updatePath
  };

})();
