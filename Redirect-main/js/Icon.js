var Icon = (function(){
  var exports = {};

  var _badgeBgColor = '#333';


  var init = function( settings ){
    if (settings.badgeBgColor) _badgeBgColor = settings.badgeBgColor;
  };


  /**
   * Set icon img, badge and title globally
   * @param {object} params:
   *        {mixed} path|imageData (optional)
   *        {text}  badge (optional)
   *        {text}  title (optional)
   */
  var setGlobal = function(params){
    if (params.path) chrome.action.setIcon({path: params.path});
    else if (params.imageData) chrome.action.setIcon({
      imageData: params.imageData
    });

    if (params.badge) {
      chrome.action.setBadgeText({text: params.badge.toString()});
      chrome.action.setBadgeBackgroundColor({color: _badgeBgColor});
    }

    if (params.title) chrome.action.setTitle({title: params.title});
  };


  /**
   * Set icon img, badge and title for separate tab
   * @param {integer} tabId
   * @param {object} params:
   *        {mixed} path|imageData (optional)
   *        {text}  badge (optional)
   *        {text}  badgeBgColor
   *        {text}  title (optional)
   */
  var setTab = function( tabId, params ){
    if (params.path) chrome.action.setIcon({
      tabId: tabId,
      path: params.path
    });
    else if (params.imageData) chrome.action.setIcon({
      tabId: tabId,
      imageData: params.imageData
    });

    if (params.badge) {
      chrome.action.setBadgeText({
        tabId: tabId,
        text: params.badge.toString()
      });
      chrome.action.setBadgeBackgroundColor({
        tabId: tabId,
        color: params.badgeBgColor || _badgeBgColor
      });
    }
    if (params.title) chrome.action.setTitle({
      tabId: tabId,
      title: params.title
    });
  };


  exports = {
    init: init,
    setTab: setTab,
    setGlobal: setGlobal
  };
  return exports;
})();

