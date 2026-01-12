var Tracer = (function(){

  var LIMIT = 10;
  // for linking webrequest with webnavigation
  var DEFAULT_HOP_TIME_WINDOW = 5000;

  var log = {};


  var init = function(){

  };


  var addWebRequestInfo = function( tabId, details, tsStart ){
    var hop;
    if (!log[tabId]) log[tabId] = [];
    else {
      hop = getLogHop({
        tabId: tabId,
        url: details.url,
        incomplete: true
      });
    }
    if (!hop) {
      hop = {
        url: details.url,
        web: details,
        tsStart: tsStart,
        timestamp: Date.now()
      };
      log[tabId].push(hop);
    }
    else {
      hop.web = details;
      if (!hop.tsStart && tsStart) hop.tsStart = tsStart;
      processLog(tabId);
    }
    processHeaders(hop);
    checkLimits(log[tabId]);
  };


  var addNavigationInfo = function( tabId, details ){
    var hop;
    if (!log[tabId]) log[tabId] = [];
    else {
      hop = getLogHop({
        tabId: tabId,
        url: details.url,
        incomplete: true
      });
    }
    if (!hop) {
      hop = {
        url: details.url,
        nav: details,
        timestamp: Date.now()
      };
      log[tabId].push(hop);
    }
    else {
      hop.nav = details;
      processLog(tabId);
    }
    checkLimits(log[tabId]);
  };


  var processHeaders = function(hop){
    if (!hop.web || !hop.web.responseHeaders) return;
    var headers = hop.web.responseHeaders || [];
    var relCan = [];
    var shortlinks = [];
    var robots = [];
    var cookies = [];
    if (!hop.cookieCount) hop.cookieCount = 0;
    headers.map(function(header){
      //console.log(header.name, header.value);
      var name = header.name.toLowerCase();
      var value = header.value;
      checkLinkHeader(name, value, relCan, shortlinks);
      checkRobotsHeader(name, value, robots);
      checkCookieHeader(name, value, cookies);
      if (name.match(/^set-cookie$/)) hop.cookieCount++;
      if (name === 'status') hop.isHTTP2 = true;
    });
    if (relCan.length) hop.relCan = relCan;
    if (shortlinks.length) hop.shortlinks = shortlinks;
    if (robots.length) hop.robots = robots;
    if (cookies.length) hop.cookies = cookies;
  };


  /**
   * Example:
   * Link: <http://www.httprelcan1.com/>; rel=\"canonical",<http://www.www.httprelcan2.com/>; rel=\"canonical"
   * Link: <https://www.sparkpost.com/pricing>; rel="canonical",<https://www.sparkpost.com/node/726>; rel="shortlink"
   * Link:<http://www.linkdetox.com:80/user-feedback/?>; rel="original", <https://web.archive.org/web/timemap/link/http://www.linkdetox.com:80/user-feedback/?>; rel="timemap"; type="application/link-format", <https://web.archive.org/web/http://www.linkdetox.com:80/user-feedback/?>; rel="timegate", <https://web.archive.org/web/20120823191415/http://www.linkdetox.com:80/user-feedback/?>; rel="first memento"; datetime="Thu, 23 Aug 2012 19:14:15 GMT", <https://web.archive.org/web/20120823191415/http://www.linkdetox.com:80/user-feedback/?>; rel="memento"; datetime="Thu, 23 Aug 2012 19:14:15 GMT", <https://web.archive.org/web/20120825084117/http://www.linkdetox.com:80/user-feedback/>; rel="next memento"; datetime="Sat, 25 Aug 2012 08:41:17 GMT", <https://web.archive.org/web/20170106223624/http://www.linkdetox.com/user-feedback/>; rel="last memento"; datetime="Fri, 06 Jan 2017 22:36:24 GMT"
   *
   * input: header {name, value}
   * output: [{url,src},...]
   */
  var checkLinkHeader = function(name, value, aRelCan, aShortlink){
    if (!name.match(/^link$/)) return;
    if (!value) return;
    var tmpLinks = value.split(/\s*,\s*/);
    var tmpLink = '';
    var links = [];
    tmpLinks.map(function(link){
      if (link.indexOf('<') === 0 ) {
        if (tmpLink) links.push(tmpLink);
        tmpLink = link;
      }
      else {
        tmpLink += link;
      }
    });
    links.push(tmpLink);
    links.map(function(link){
      var pair = link.split(/\s*;\s*/);
      var url = pair[0];
      var rel = pair[1];
      if (url && rel.match(/canonical/)) {
        url = url.replace(/^<(.*)\/?>$/, '$1');
        aRelCan.push({
          url: url,
          src: 'header'
        });
      }
      else if (url && rel.match(/shortlink/)) {
        url = url.replace(/^<(.*)\/?>$/, '$1');
        aShortlink.push({
          url: url,
          src: 'header'
        });
      }
    });
  };


  var checkRobotsHeader = function(name, value, res){
    if (!name.match(/^x-robots/)) return;
    value = value.toLowerCase();
    // TODO: ask about google types: unavailable_after and etc
    // https://developers.google.com/webmasters/control-crawl-index/docs/robots_meta_tag
    // For now just ignore them
    if (!value.match(/(noindex|nofollow|noarchive|none)/)) return;
    var item = {src: 'header'};
    var bot = (value.match(/^([\w. -]+):/) || [])[1];
    if (bot) item.bot = bot;
    item.noindex = value.indexOf('noindex') !== -1;
    item.nofollow = value.indexOf('nofollow') !== -1;
    item.noarchive = value.indexOf('noarchive') !== -1;
    item.index = value.match(/\bindex/);
    item.follow = value.match(/\bfollow/);
    item.archive = value.match(/\barchive/);
    if (value === 'none') {
      item.noindex = true;
      item.nofollow = true;
    }
    item.rawValue = value;
    res.push(item);
  };


  // Set-Cookie: PHPSESS=vecjjcj7bnhtfd8972tiv0dbflesrgej;
  var checkCookieHeader = function(name, value, res){
    if (name !== 'set-cookie') return;
    var cookieStr = value.replace(/^(.*?);.*/, '$1');
    var pair = cookieStr.split('=');
    res.push({
      key: pair[0],
      val: pair[1]
    });
  };


  var processPageData = function(tabId, url, data){
    var hop = getLogHop({
      tabId: tabId,
      url: url,
      timestamp: data.timestamp
    });
    if (hop) {
      hop.tsDOMLoaded = data.timestamp;
      if (data.meta) {
        hop.meta = data.meta;
        hop.redirectType = 'meta';
      }
      if (data.relCan) {
        if (!hop.relCan) hop.relCan = [];
        hop.relCan = hop.relCan.concat(data.relCan);
      }
      if (data.robots && Object.keys(data.robots).length > 1) {
        if (!hop.robots) hop.robots = [];
        hop.robots.push(data.robots);
      }
      if (data.protocol) {
        hop.protocol = data.protocol;
      }
    }
  };


  var addUserClick = function(tabId, url){
    var hop = getLogHop({
      tabId: tabId,
      url: url,
      timeWindow: Infinity
    });
    if (hop) hop.userClick = true;
  };


  /**
   * Find the starting point in the stream of requests.
   * Every hop has webrequest (completed)
   * Server-side redirect hops doesn't have "nav"
   * if nav - check transitionQualifier
   */
  var processLog = function(tabId){
    var hops = log[tabId];
    var startIndex = 0;
    var clientRedirectFlag = false;
    var userActionFlag = false;
    for (var i = hops.length - 1; i >= 0; i--) {
      var hop = hops[i];
      delete hop.debug;
      if (App.getSettings().showRobots &&
          typeof hop.robotsTxt === 'undefined' &&
          !hop.url.match(/^https?:\/\/[^/]+\/robots.txt/)) {
        hop.robotsTxt = false;
        (function(hop){
          RobotsTxt.checkUrl({url: hop.url, settings: App.getSettings()}, function(result){
            // console.log('RobotsTxt result: ', result, hop.url);
            hop.robotsTxt = result;
            App.updatePath(tabId);
          });
        })(hop);
      }

      if (i === hops.length - 1) {
        if (!hop.nav) return;
        else {
          var q = hop.nav.transitionQualifiers || [];
          if (q.indexOf('forward_back') !== -1 ||
             (q.length == 1 && q.indexOf('from_address_bar') !== -1)) {
            startIndex = i;
            hop.debug = 1;
            break;
          }
          if (hop.nav.transitionType === 'reload') {
            startIndex = i;
            hop.debug = 5;
            break;
          }
          if (q.indexOf('client_redirect') !== -1) {
            clientRedirectFlag = true;
            hop.debug = 10;
            continue;
          }
          else continue;
        }
      }
      if (hop.nav && clientRedirectFlag) {
        hop.redirect = true;
        if (!hop.redirectType) hop.redirectType = 'client';
        clientRedirectFlag = false;
        hop.debug = 15;
      }
      if (hop.userClick && !hop.redirect) {
        startIndex = i + 1;
        hop.debug = 20;
        break;
      }
      if (hop.nav) {
        var q = hop.nav.transitionQualifiers || [];
        if (q.indexOf('forward_back') !== -1 ||
          (q.length == 1 && q.indexOf('from_address_bar') !== -1)) {
          userActionFlag = true;
          startIndex = i;
          hop.debug = 25;
          // break;
        }
      }
      if (!hop.web) {
        console.warn('No webrequest for hop. Ivestigate.');
        continue;
      }
      // check server redirect
      if (!hop.nav && hop.web && hop.web.redirectUrl) {
        hop.redirect = true;
        hop.redirectType = hop.web.statusCode.toString();
        hop.debug = 30;
        continue;
      }
      if (hop.redirect) {
        continue;
      }
      startIndex = i + 1;
      break;
    }
    // hops.map(function(item){
    //   console.log('Before splice: ', tabId, item.url, item);
    // });
    // console.log('______', startIndex);

    // clearing requests stack till to starting point
    hops = hops.splice(startIndex);
    log[tabId] = hops;

    // hops.map(function(item){
    //   console.log('After splice: ', tabId, item.url, item);
    // });
    // console.log('\n');
    // console.log('\n');
  };


  var clearTabInfo = function( tabId ){
    delete log[tabId];
  };



  /**
   * Find a hop by url
   * Iterating starting the end of the log
   * What is "incomplete" param? I'm using this function in 2 cases:
   * 1 - when adding new info from request (nav or web)
   * 2 - when adding new info from page data
   * In first case I'm looking for incomplete, second - requests have to be
   * complete
   */
  var getLogHop = function( params ){
    if (!log[params.tabId]) return;
    var timestamp = params.timestamp;
    var timeWindow = params.timeWindow;
    if (!timestamp) timestamp = Date.now();
    if (!timeWindow) timeWindow = DEFAULT_HOP_TIME_WINDOW;
    var hops = log[params.tabId];
    if (!hops) return;
    for (var i = hops.length - 1; i >= 0; i--) {
      var hop = hops[i];
      if (hop.url !== params.url) continue;
      if (params.incomplete && hop.web && hop.nav) continue;
      if (timestamp - hop.timestamp > timeWindow) continue;
      return hop;
    }
    return;
  };


  var checkLimits = function( arr ){
    if (arr.length <= LIMIT) return;
    arr.splice(0, arr.length - LIMIT);
  };


  var getLog = function( tabId ){
    //console.log('Tracer.log: ', log);
    return log[tabId];
  };


  var dump = function(){
    chrome.tabs.query({active: true}, function(tabs){
      var tab = tabs[0];
      var hops = log[tab.id];
      if (!hops) console.log('no log for current tab');
      else {
        for (var i = 0, len = hops.length; i < len; i++) {
          var hop = hops[i];
          console.log(hop.url, hop);
        }
      }
    });
  };


  return {
    init: init,
    addWebRequestInfo: addWebRequestInfo,
    addNavigationInfo: addNavigationInfo,
    processPageData: processPageData,
    addUserClick: addUserClick,
    clearTabInfo: clearTabInfo,
    getLog: getLog,
    dump: dump
  };


})();
