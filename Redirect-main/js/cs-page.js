(function(){

  var init = function(){
    var timestamp = Date.now();
    document.addEventListener("DOMContentLoaded", function(event) {
      addClickEventListener();
      var meta = getMetaRedirects();
      var relCan = getRelCan();
      var robots = getMetaRobots();
      var perf = performance.getEntriesByType('navigation')[0];
      var protocol = perf.nextHopProtocol;
      chrome.runtime.sendMessage({
        cmd: 'page.data',
        data: {
          timestamp: timestamp,
          meta: meta,
          relCan: relCan,
          robots: robots,
          protocol: protocol
        }
      }, function( hop ){
        processHop( hop );
      });
    });
  };


  var processHop = function( hop ){
    chrome.runtime.sendMessage({
      cmd: 'settings.get'
    }, function(settings){
      if (settings.highlightNoFollow) {
        var robotsNofollow = false;
        if (hop.robots) {
          hop.robots.map(function(robot){
            if (robot.nofollow) robotsNofollow = true;
          });
        }
        var selector = 'a[rel~="nofollow"]';
        if (robotsNofollow) selector = 'a[href]';
        var links = document.querySelectorAll(selector);
        for (var i = 0, len = links.length; i < len; i++) {
          var link = links[i];
          link.style.border = 'dotted 1px firebrick';
        }
      }
    });
  };


  var addClickEventListener = function(){
    document.body.addEventListener('click', function(e){
      chrome.runtime.sendMessage({
        cmd: 'page.userClick',
        data: {}
      });
    });
  };


  var getMetaRedirects = function(){
    var nodes = document.querySelectorAll("meta[http-equiv=refresh i]");
    if (!nodes.length) return;
    var res = [];
    for (var i = 0, len = nodes.length; i < len; i++) {
      var node = nodes[i];
      var content = node.getAttribute('content');
      var params = content.split(/;\s?url\s?=\s?/i);
      if (params.length !== 2) continue;
      var url = qualifyURL(params[1]);
      res.push({url: url, timeout: params[0]});
    }
    return res;
  };


  var getRelCan = function(){
    var nodes = document.querySelectorAll('link[rel=canonical i]');
    if (!nodes.length) return;
    var res = [];
    for (var i = 0, len = nodes.length; i < len; i++) {
      var node = nodes[i];
      var href = node.getAttribute('href');
      var url = qualifyURL(href);
      res.push({url: url, src: 'HTML Rel-Canonical'});
    }
    return res;
  };


  var getMetaRobots = function(){
    var nodes = document.querySelectorAll("meta[name=robots i]");
    if (!nodes.length) return;
    var values = [];
    for (var i = 0, len = nodes.length; i < len; i++) {
      var node = nodes[i];
      var content = node.getAttribute('content');
      var noindex = !!content.match(/noindex/i);
      var nofollow = !!content.match(/nofollow/i);
      var none = content === 'none';
      if (none) {
        noindex = true;
        nofollow = true;
      }
      if (!noindex && !nofollow) continue;
      values.push({noindex: noindex, nofollow: nofollow});
    }
    var res = {src: 'html'};
    values.map(function(item){
      if (item.noindex) res.noindex = true;
      if (item.nofollow) res.nofollow = true;
    });
    return res;
  };


  var qualifyURL = function(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.href;
  };


  return {
    init: init
  };

})().init();
