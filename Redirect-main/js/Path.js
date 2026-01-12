function Path (log){
  this.hops = [];
  this.processLog(log);
}


Path.prototype.processLog = function(log){
  if (!log) return;
  for (var i = 0, len = log.length; i < len; i++) {
    var logItem = log[i];
    var hop = new Hop(logItem);
    this.hops.push(hop);
  }
};


Path.prototype.getRedirectsList = function(){
  var res = [];
  for (var i = 0, len = this.hops.length; i < len; i++) {
    var hop = this.hops[i];
    if (!hop.redirect) continue;
    res.push(hop.redirectType);
  }
  return res;
};


Path.prototype.getIconData = function( settings, hopIndex ){
  if (typeof hopIndex === 'undefined') hopIndex = this.hops.length - 1;
  var hop = this.hops[hopIndex];
  var follow = true;
  var info = {
    robotsTxt: {index: true, major: true},
    header: {index: true, major: true},
    html: {index: true, major: true}
  };

  var blockedAll = false;
  var relCan;
  var relCanDetails = '';
  var selfRelCan = false;
  var diffRelCan = false;

  /**
   * Cases for major bots (orange icon):
   * 1 - allowed has all major bots and none of them is in "blocked"
   * 2 - blocked has no major bots and has no '*'
   */

  if (!hop) return;
  if (hop.robotsTxt && settings.robotsBlockingNonIndexable) {
    var r = hop.robotsTxt;
    if (!r.allAllowed && !r.majorAllowed) blockedAll = true;
    info.robotsTxt.major = r.majorAllowed;
    info.robotsTxt.index = r.allAllowed;
  }

  /**
   * NOFOLLOW: If any of bots has "nofollow" then result is nofollow:true
   */
  if (hop.robots) {
    var noindexHTMLBots = [];
    var noindexHeaderBots = [];
    hop.robots.map(function(item){
      if (item.src === 'header' && item.noindex) noindexHeaderBots.push( item.bot || '*');
      if (item.src === 'html' && item.noindex) noindexHTMLBots.push( item.bot || '*');
    });
    if (noindexHTMLBots.length == 1 && noindexHTMLBots[0] === '*') {
      info.html.index = false;
      info.html.major = false;
      blockedAll = true;
    }
    if (noindexHeaderBots.length == 1 && noindexHeaderBots[0] === '*') {
      info.header.index = false;
      info.header.major = false;
      blockedAll = true;
    }
    if (noindexHeaderBots.length && SearchEngines.hasOneOrMoreMajor(noindexHeaderBots)) {
      info.header.index = false;
      info.header.major = false;
    }

    // Processing nofollow
    for (var i = 0, len = hop.robots.length; i < len; i++) {
      var robot = hop.robots[i];
      if (robot.nofollow) follow = false;
    }
  }

  if (hop.relCan && typeof hop.relCan === 'object') {
    for (var i = 0, len = hop.relCan.length; i < len; i++) {
      var item = hop.relCan[i];
      if (hop.url !== item.url) {
        relCan = true;
        diffRelCan = true;
      }
      if (hop.url === item.url && settings.showSelfRelcan) {
        relCan = true;
        selfRelCan = true;
      }
    }
    hop.relCan.map(function(rel){
      relCanDetails += '\n' + rel.url;
    });
  }

  var alerts = Warning.checkPath(this);
  var hasWarning = !!(Object.keys(alerts.warnings).length);
  var hasDanger = !!(Object.keys(alerts.dangers).length);
  if (blockedAll) hasDanger = true;

  var res = {
    noindex: !(info.robotsTxt.index && info.header.index && info.html.index),
    majorIndex: (info.robotsTxt.major && info.header.major && info.html.major),
    nofollow: !follow,
    relCan: relCan,
    relCanDetails: relCanDetails,
    selfRelCan: selfRelCan,
    diffRelCan: diffRelCan,
    hasWarning: hasWarning,
    hasDanger: hasDanger,
    extInfo: info
  };
  // Generating summary
  res.summary = getHopTitle('', res);
  return res;
};


var getHopTitle = function(key, params){
  var left = 'indexable by every bot';
  var right = 'links on the page are followed';
  if (params.noindex && params.majorIndex) {
    left = 'indexable by major search engines bots';
  }
  else if (params.noindex) {
    left = 'NOT indexable';
  }
  if (params.relCan) {
    right = '';
    if (params.diffRelCan) {
      right = 'page canonicaled to another page (so links on the page may not count)';
      right += params.relCanDetails;
    }
    if (params.selfRelCan) {
      if (right) right += '\n';
      right += 'page has self-referencing canonical';
    }
  }
  else if (params.nofollow) {
    right = 'links no-follow';
  }
  if (key === 'left') return left;
  else if (key === 'right') return right;
  else return [left, right].join(', ');
};


Path.prototype.getShortTrace = function(){
  var headers = ['Status Code', 'URL', 'IP', 'Page Type', 'Redirect Type', 'Redirect URL'];
  var res = [headers];
  var resHop = [];
  for (var i = 0, len = this.hops.length; i < len; i++) {
    resHop = [];
    var hop = this.hops[i];
    resHop.push(hop.statusCode);
    resHop.push(hop.url);
    resHop.push(hop.ip);
    var pageType = 'normal';
    var redirectType = 'none';
    var redirectUrl = 'none';
    if (hop.redirect) {
      redirectUrl = this.hops[i+1].url;
      if (hop.redirectType == 'meta' || hop.redirectType == 'client') {
        pageType = 'client_redirect';
        redirectType = hop.redirectType === 'client' ? 'javascript' : 'meta';
      }
      else {
        pageType = 'server_redirect';
        if (hop.statusCode.toString().match(/^(301|308)$/)) {
          redirectType = 'permanent';
        }
        else if (hop.statusCode.toString().match(/^(302|303|307)$/)) {
          redirectType = 'temporary';
        }
      }
    }
    resHop.push(pageType);
    resHop.push(redirectType);
    resHop.push(redirectUrl);
    res.push(resHop);
  }
  var resTxt = '';
  res.map(function(arr){
    resTxt += arr.join('\t') + '\n';
  });
  return resTxt;
};


Path.prototype.getFullTrace = function(){
  var cloned = structuredClone(this);
  var res = cloned.hops;
  res.map(function(hop){
    delete hop.logItem;
  });
  return JSON.stringify(res, '', '  ');
};
