// Chrome Platform Analytics
// https://github.com/GoogleChrome/chrome-platform-analytics/wiki

var ChromePlatformAnalytics = (function(){

  var service;
  var tracker;


  var init = function(appName, ua){
    initMessaging();
    service = analytics.getService(appName);
    tracker = service.getTracker(ua);
  };


  var initMessaging = function(){
    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse)
      {
        if (typeof request !== 'object') return;
        if(request.cmd === 'cpa.sendAppView') {
          sendAppView(request.data);
        }
        else if (request.cmd === 'cpa.sendEvent') {
          sendEvent(request.data);
        }
        else if (request.cmd === 'cpa.toggle') {
          toggle(request.data);
        }
      }
    );
  };


  var sendAppView = function(view){
    tracker.sendAppView(view);
  };


  var sendEvent = function(data){
    tracker.sendEvent.apply(tracker, data);
  };


  var toggle = function(state){
    service.getConfig().addCallback(function(config) {
      config.setTrackingPermitted(!!state);
    });
  };


  return {
    init: init,
    sendAppView: sendAppView,
    sendEvent: sendEvent,
    toggle: toggle
  };

})();
