(function(){

  var vendor = (navigator.userAgent.match(/(Chrome|Firefox)/) || [])[1];

  var settings = {};
  var isInTab = false;


  var init = function(){
    fontPreload();
    LRTIcon.init();
    $(function(){
      var tabId = (document.location.search.match(/tabId=(\d+)/) || [])[1];
      if (tabId) {
        var style = document.querySelector('#app').style;
        style.display = 'block';
        style.opacity = 1;
        var expanded = (document.location.search.match(/expanded=([\d,]+)/) || [])[1];
        if (typeof expanded !== 'undefined') expanded = expanded.split(',');
        Screenshot.init();
        generateResults(tabId, expanded);
        isInTab = true;
      }
      else {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
          var tab = tabs[0];
          setTimeout(function(){
            generateResults(tab.id);
            var style = document.querySelector('#app').style;
            style.display = 'block';
            setTimeout(function(){
              style.opacity = 1;
            }, 0);
          }, 200);
        });
      }
    });
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


  var fontPreload = function(){
    var canvas = document.createElement("canvas");
    canvas.width = 19;
    canvas.height = 19;
    var context = canvas.getContext("2d");
    context.font = "bold 10px Dosis";
    context.fillText('x', 0, 0);
  };


  var generateResults = function(tabId, expanded){
    initUI(tabId);
    chrome.runtime.sendMessage({
      cmd: 'ui.getTabData',
      data: {tabId: tabId}
    }, function( data ){
      if (!data) {
        showNoInfo();
        return;
      }
      getSettings(function(){
        processPath(data.path);
        if (expanded) {
          $('.hop-container').map(function(i, node){
            if (expanded.indexOf(i.toString()) !== -1) $(node).click();
          });
        }
      });
      //$('#result').text( JSON.stringify(path, '', '  ') );
    });
  };


  var getSettings = function(cbContinue){
    chrome.runtime.sendMessage({cmd: 'settings.get'}, function(data){
      settings = data;
      if (cbContinue) cbContinue();
    });
  };


  var initUI = function(tabId){
    chrome.runtime.sendMessage({cmd: 'get_short_trace', data: {
      tabId: tabId
    }}, function(text){
      $('.btn-copy').data('text', text);
    });

    if (vendor === 'Firefox') {
      $('#main-logo').attr('href', 'https://lrt.li/rtlogoappfirefox');
      $('#lrt-logo').attr('href', 'https://lrt.li/rtlogofirefox');
      $('#btn-help').attr('href', 'https://lrt.li/rthelpfirefox');
      $('#rate-body a')[0].textContent = 'Give us 5 stars on Mozilla Marketplace';
      $('#see-also a').attr('href', 'https://lrt.li/lrtseealsoff');
      $('.btn-try-lrt').attr('href', 'https://lrt.li/rtfftrial');
    }
    if ( Math.floor(Math.random()*2) == 1 ) $('#rate-container').removeClass('hidden');
    else $('#see-also').removeClass('hidden');

    $('body').on('click', '[data-track]', function(e){
      var action = this.dataset.track;
      chrome.runtime.sendMessage({
        cmd: 'track_event',
        data: action
      });
    });
    $('#result').on('click', '.hop-container', function(e){
      if (e.toElement && e.toElement.className && e.toElement.className.match(/btn-/)) return;
      $(this).toggleClass('hop-expanded');
      chrome.runtime.sendMessage({cmd: 'track_event', data: 'toggle trace details'});
      setTimeout(function(){
        appendExpanders('.relCan-item a');
      }, 0);
    });
    $('#result').on('click', '.btn-expand', function(e){
      e.stopPropagation();
      e.preventDefault();
      $(this).parent().css({
        'white-space': 'normal',
        'max-height': 'none'
      });
      $(this).remove();
    });
    $('#result').on('click', '.btn-nocache', function(e){
      var url = $(this).closest('.hop-container').find('.hop-url a#url-link')[0].href;
      if (url.indexOf('?') === -1) url += '?';
      else url += '&';
      url += Date.now().toString();
      chrome.runtime.sendMessage({
        cmd: 'reload_tab',
        data: {
          tabId: tabId,
          url: url
        }
      });
      window.close();
    });
    $('.btn-copy').click(function(e){
      var text = $(this).data('text');
      var copyNode = document.createElement('textarea');
      document.body.appendChild(copyNode);
      copyNode.value = text;
      copyNode.focus();
      copyNode.select();
      document.execCommand("Copy", false, null);
      document.body.removeChild(copyNode);
      window.close();
    });
    $('.btn-export').click(function(e){
      var filename = getFilename() + '.txt';
      chrome.runtime.sendMessage({cmd: 'export', data: {
        tabId: tabId,
        filename: filename
      }}, function(res){
        downloadFile(filename, res);
        //window.close();
      });
    });
    $('.btn-capture').click(function(e){
      var hops = $.makeArray( $('.hop-container') );
      var expanded = hops
        .map(function(node, i){
          if ($(node).hasClass('hop-expanded')) return i;
          else return '';
        })
        .filter(function(value, j){
          return value !== '';
        }).join(',');
      chrome.runtime.sendMessage({cmd: 'open_in_tab', data: {
        tabId: tabId,
        expanded: expanded
      }}, function(){
        window.close();
      });
    });
    $('#rate-body').hide();
    $('#rate-title').click(function(){
      $('#rate-body').slideDown();
    });
    $('#rate-body a').click(function(e){
      e.preventDefault();
      var url = 'https://lrt.li/rtratingtopleftch';
      if (vendor === 'Firefox') url = 'https://lrt.li/rtratingtopleftff';
      chrome.tabs.create({
        url: url
      });
    });
    $('body').on('click', '#btn-self-relcan-enable', function(e){
      e.preventDefault();
      $('.self-relcan-warn').remove();
      chrome.runtime.sendMessage({
        cmd: 'settings.set',
        data: {key: 'showSelfRelcan', value: true}
      });
      chrome.runtime.sendMessage({
        cmd: 'settings.set',
        data: {key: 'selfRelcanManuallySet', value: true}
      });
    });
    $('body').on('click', '#btn-self-relcan-no', function(e){
      e.preventDefault();
      $('.self-relcan-warn').remove();
      chrome.runtime.sendMessage({
        cmd: 'settings.set',
        data: {key: 'showSelfRelcan', value: false}
      });
      chrome.runtime.sendMessage({
        cmd: 'settings.set',
        data: {key: 'selfRelcanManuallySet', value: true}
      });
    });
  };


  var showNoInfo = function(){
    $('#result').html('<div class="no-info">Sorry, there is currently no information available for this tab. Please load a URL to gather information on your path.</div>');
    $('.footer').hide();
  };


  var processPath = function( path ){
    var prevColor = '';
    var len = path.hops.length;
    var totalTime = path.hops[len-1].tsDOMLoaded - path.hops[0].tsStart;
    for (var i = 0; i < len; i++) {
      var hop = path.hops[i];
      console.log(hop);
      var data = $.extend({}, hop);
      data.singleHop = len === 1;
      data.lastHop = i === len - 1;
      if (!data.lastHop) {
        data.redirectTo = path.hops[i+1].url;
      }
      data.summary = Path.prototype.getIconData.call(path, settings, i);
      data.urlWithoutScheme = data.url.replace(/^.*?:\/\//, '');
      data.domain = Helpers.getHost(data.url);
      data.https = data.url.indexOf('https') === 0;

      processProtocol( data );
      processMeta( data );
      processRelCan( data );
      processCookies( data );
      processRobots( data );
      processRobotsTxt( data );
      processHeaders( data );
      processIP(data);
      if (data.redirectType === '307') process307(data);

      if (i !== len - 1) {
        var diff = path.hops[i+1].tsStart - hop.tsStart;
        data.timeDiff = parseInt(diff);
      }
      else {
        data.timeDiff = parseInt(hop.tsDOMLoaded - hop.tsStart);
      }
      if (!data.timeDiff) data.timeDiff = '';
      data.totalTime = totalTime;
      data.timePercent = parseInt(data.timeDiff*100/totalTime);

      if (!data.indexRed && !data.indexYellow && !data.indexGreen) {
        if (!data.robotsTxtRed && !data.robotsTxtYellow) data.indexGreen = true;
        else if (data.robotsTxtRed) data.indexRed = true;
        else if (data.robotsTxtYellow) data.indexYellow = true;
      }

      if (data.redirectType === 'client') data.redirectType = 'js';
      data.redirectType = data.redirectType.toUpperCase();
      data.prevRedirectColor = prevColor;
      data.redirectColor = getStatusColor(data.redirectType, data.statusCode);

      for (var key in settings) {
        data['setting_' + key] = settings[key];
      }
      var template = $('#hop-main').text();

      if ((data.relCanHTML && data.relCanHTML.length && data.showRelCan) ||
          (data.robotsHTML && data.robotsHTML.length)) {
        data.showHTMLSection = true;
      }
      if ((data.relCanHeader && data.relCanHeader.length && data.showRelCan) ||
          (data.robotsHeader && data.robotsHeader.length) ||
          (data.shortlinks && data.shortlinks.length) ||
          (data.cookieCount)) {
        data.showHTTPSection = true;
      }
      data.statusString = generateStatusString( data );
      var html = Mustache.to_html(template, data);
      var $html = $(html);
      $('#result').append($html);
      appendIconTitles($html, data);
      prevColor = data.redirectColor;
    }
    appendExpanders('.hop-url a, .hop-redirectTo a');
    generateLRTIcons(path);
    getMetrics(path);
    var alerts = Warning.checkPath(path);
    if (alerts.warnings.over5) {
      $('#result').append( Mustache.to_html(
          $('#hops-warn-template').text(),
          {count: path.hops.length}
        )
      );
    }
    if (!settings.selfRelcanManuallySet) {
      $('#result').append( Mustache.to_html(
          $('#self-relcan-warn-template').text(),
          {}
        )
      );
    }
    if (isInTab) {
      $('.footer').hide();
      setTimeout(function(){
        var data = {
          width: $('body').width() * window.devicePixelRatio,
          height: ($('body').height() + 20) * window.devicePixelRatio,
          filename: getFilename() + '.png'
        };
        takeScreenshot(data);
      }, 100);
    }
    else {
      $('body').css({'max-height': '600px'});
    }
  };


  var takeScreenshot = async function(data){
    var width = data.width;
    var height = (data.height + 20);
    Screenshot.take(function(dataURL){
      downloadImage(getFilename() + '.png', dataURL);
    });
  };


  var processProtocol = function(data){
    if (!data.protocol) return;
    var protocol = data.protocol;
    if (protocol === 'h2') protocol = 'HTTP/2';
    data.protocolUC = protocol.toUpperCase();
  };


  var processMeta = function( data ){
    var meta = data.meta;
    if (!meta || !meta.length) return;
    var metaCount = meta.length;
    metaLast = meta[ metaCount - 1 ];
    data.metaStat = {
      count: metaCount,
      timeout: metaLast.timeout,
      url: metaLast.url
    };
    data.redirectType = 'meta';
  };


  var processRelCan = function( data ){
    var relCan = data.relCan;
    if (!relCan || !relCan.length) return;
    var relCanCount = relCan.length;
    relCanLast = relCan[ relCanCount - 1 ];
    data.relCanStat = {
      count: relCanCount,
      url: relCanLast.url
    };
    for (var i = 0, len = relCan.length; i < len; i++) {
      var item = relCan[i];
      if (item.url !== data.url) {
        data.showRelCan = true;
        data.diffRelCan = true;
      }
      if (item.url === data.url && settings.showSelfRelcan) {
        data.showRelCan = true;
        data.selfRelCan = true;
      }
    }
    data.relCanHTML = relCan.filter(function(item){
      if (item.src === 'HTML Rel-Canonical') return true;
    });
    data.relCanHeader = relCan.filter(function(item){
      if (item.src === 'header') return true;
    });
    if (settings.testRelcan) {
      relCan.map(function(item){
        var url = item.url;
        if (!url.match(/^http.*/)) url = (new URL(data.url)).origin + '/' + url;
        chrome.runtime.sendMessage({
          cmd: 'popup.check_url',
          data: url
        }, function( statusObj ){
          updatePopupContent('relCan', {url: item.url, statusObj: statusObj});
        });
      });
    }
  };


  var processRobots = function( data ){
    if (!settings.showRobots) return;
    var robots = data.robots;
    if (!robots || !robots.length) return;
    var robotsCount = robots.length;
    data.robotsStat = {
      count: robotsCount,
    };
    data.robotsHTML = data.robots.filter(function(item){
      if (item.src == 'html') return true;
    });
    data.robotsHeader = data.robots.filter(function(item){
      if (item.src == 'header') return true;
    });
    if (data.summary.noindex && data.summary.majorIndex) data.indexYellow = true;
    else if (data.summary.noindex && !data.summary.majorIndex) data.indexRed = true;
    else if (!data.summary.noindex) data.indexGreen = true;
  };


  var processRobotsTxt = function(data){
    if (!settings.showRobots) return;
    if (!data.robotsTxt) return;

    if (!data.robotsTxt.allAllowed) {
      data.robotsTxtBlocked = true;
      data.robotsTxtBlockedList = data.robotsTxt.blocked.join(', ');
    }
    if (data.robotsTxt.allowed.length) {
      data.robotsTxtAllowed = true;
      data.robotsTxtAllowedList = data.robotsTxt.allowed.join(', ');
    }

    var indexInfo = data.summary.extInfo.robotsTxt;
    if (!indexInfo.index && !indexInfo.major) data.robotsTxtRed = true;
    else if (!indexInfo.index && indexInfo.major) data.robotsTxtYellow = true;
  };


  var processCookies = function( data ){
  };


  var processHeaders = function(data){
    for (var i = data.headers.length - 1; i >= 0; i--) {
      var header = data.headers[i];
      if (header.name.match(/set-cookie/i)) {
        header.icons = ['cookie'];
      }
      else if (header.name.match(/link/i) && header.value.match(/rel="?canonical/i)) {
        header.icons = ['canonical'];
      }
      else if (header.name.match(/x-robots/i)) {
        //data.headers.splice(i, 1);
      }
    }
    // if (data.robotsHeader) {
    //   for (var i = 0, len = data.robotsHeader.length; i < len; i++) {
    //     var robot = data.robotsHeader[i];
    //     var header = $.extend({}, robot);
    //     header.name = 'X-Robots';
    //     header.value = header.rawValue;
    //     header.icons = [];
    //     if (header.noindex) header.icons.push('noindex');
    //     else header.icons.push('index');
    //     if (header.nofollow) header.icons.push('nofollow');
    //     else header.icons.push('follow');
    //     data.headers.unshift(header);
    //   }
    // }
  };


  var processIP = function(data){
    if (!data.ip) return;
    chrome.runtime.sendMessage({
      cmd: 'get_ip_info',
      data: data.ip
    }, function(json){
      if (json && !json.error) {
        var value = data.ip + ' (' + json.data.countryCode + ', ' + json.data.city + ')';
        updatePopupContent('ip', {ip: data.ip, value: value});
      }
    });
  };


  var process307 = function(data){
    data.headers.map(function(header){
      if (header.name.match(/Non-Authoritative-Reason/i) || header.value === 'HSTS') {
        data.footerMessage = 'The server has previously indicated this domain should always be accessed via HTTPS (HSTS Policy per https://tools.ietf.org/html/rfc6797). Chrome has cached this internally, and did not connect to any server for this redirect. Chrome reports this redirect as a "307 Internal Redirect" which simply does not exist per https://tools.ietf.org/html/rfc7231#section-6.4.7 - however this probably would have been a "301 Permanent redirect" originally and the Google guys made fun of the webmaster community maybe. You can verify this by clearing your browser cache and visiting the original URL again. Please note that this is kind of a weird behavior and that Google even calls 307 redirects "a lie" in a post by John Muller titled "A search-engine guide to 301, 302, 307, & other redirects" at https://plus.google.com/+JohnMueller/posts/E4PqAhRJB2V - However server side 307 redirects do exist and we will show them. ;-) - for further details on redirects we recommend you checkout the CEMPER.Academy or the LinkResearchTools LRT Associate Training as all those details are trained in there, and covered in the full LinkResearchTools suite of course.';


        return;
      }
    });
  };


  var generateStatusString = function( data ){
    if (!data.redirect) return data.statusCode;
    var res = '';
    if (data.redirectType.match(/^\d+$/)) {
      res = data.statusCode + ' redirect to:';
    }
    else {
      res = data.statusCode + ' then ';
      if (data.metaStat) {
        res += 'after ' + data.metaStat.timeout + 's ';
      }
      res += data.redirectType + ' redirect to:';
    }
    return res;
  };


  var appendExpanders = function( selectorStr ){
    var links = $(selectorStr);
    for (var i = 0, len = links.length; i < len; i++) {
      var link = links[i];
      var $link = $(link);
      if ($link.hasClass('expandable')) continue;
      if ($link.hasClass('btn-qbl-loader')) continue;
      if (isEllipsisActive(link)) {
        $link.append('<span class="btn-expand">...</span>');
        $link.addClass('expandable');
      }
    }
  };


  var appendIconTitles = function($html, hop){
    var key = '';
    var data = {};
    $html.find('.hop-icon.icon-not-crawlable').attr('title', 'NOT crawlable by any bot');
    $html.find('.hop-icon.icon-major').attr('title', 'indexable by major search engines bots, some minor bots or scrapers blocked');
    $html.find('.hop-icon.icon-major-crawlable').attr('title', 'crawlable by major bots, some minor bots or scrapers blocked');
    var relcan = '';
    if (hop.diffRelCan) {
      relcan += 'page canonicaled to another page (so links on the page may not count)';
      hop.relCan.map(function(rel){
        relcan += '\n' + rel.url;
      });
    }
    if (hop.selfRelCan) {
      relcan += '\npage has self-referencing canonical';
    }
    $html.find('.hop-icon.icon-canonical').attr('title', relcan);
    $html.find('.hop-icon').map(function(i, node){
      var $node = $(node);
      var type = (node.className.match(/icon-(.?.?index|.?.?follow)/) || [])[1];
      if (!type) return;
      if (type.indexOf('index') !== -1) {
        key = 'left';
        data.noindex = type === 'noindex';
      }
      if (type.indexOf('follow') !== -1) {
        key = 'right';
        data.nofollow = type === 'nofollow';
      }
      var title = getHopTitle(key, data);
      $node.attr('title', title);
    });
  };


  var generateLRTIcons = function( path ){
    if (!settings.showLRT) return;
    var urls = [];
    path.hops.map(function(hop, index){
      urls.push(hop.url);
    });
    chrome.runtime.sendMessage({
      cmd: 'lrt.getPowerTrust',
      data: urls
    }, function(response){
      if (response.error) {
        $('.status')
          .text("Can't load Power*Trust metric. Please try again later.")
          .removeClass('hidden');
        return;
      }
      // console.log(response);
      var data = response.data.data;
      for (i = 0, len = urls.length; i < len; i++ ) {
        var url = urls[i];
        if (typeof(data[url]) === 'undefined') {
          //console.log('Unexpected url in LRT response: ' + url, urls);
          continue;
        }
        if (data[url]) {
          $('.hop-container').map(function(index, node){
            var img = LRTIcon.getSVG( data[url] );
            var $hopNode = $(node);
            if ($hopNode.find('.hop-url a#url-link').attr('href') !== url) return;
            if ($hopNode.find('.lrt-icon img')[0]) return;
            $hopNode.find('.lrt-icon').append(img);
            $hopNode.find('.lrt-power .lrt-value').text(data[url].power);
            $hopNode.find('.lrt-trust .lrt-value').text(data[url].trust);
          });
        }
      }
    });
  };


  var getMetrics = function(path){
    var urls = [];
    path.hops.map(function(hop, index){
      urls.push(hop.url);
    });
    chrome.runtime.sendMessage({
      cmd: 'lrt.getMetrics',
      data: urls
    }, function(response){
      if (response.error) {
        $('.status')
          .text("Can't load Power*Trust metric. Please try again later.")
          .removeClass('hidden');
        return;
      }
      var data = response.data.data;
      for (i = 0, len = urls.length; i < len; i++ ) {
        var url = urls[i];
        if (typeof(data[url]) === 'undefined') {
          //console.log('Unexpected url in LRT response: ' + url, urls);
          continue;
        }
        if (data[url]) {
          $('.hop-container').map(function(index, node){
            var backlinks = data[url].bl;
            backlinks = Helpers.getNrString(backlinks);
            var $hopNode = $(node);
            if ($hopNode.find('.hop-url a#url-link').attr('href') !== url) return;
            $hopNode.find('.bl-value a')
              .text(backlinks)
              .attr('href', 'https://lrt.li/start-qbl?link=' + encodeURIComponent(url));
          });
        }
      }
    });
  };


  var getStatusColor = function( type, code ){
    type = (type || '').toLowerCase();
    var res = 'green';
    if (type === 'js' || type === 'meta') res = 'yellow';
    else if (type.match(/^(301|308)$/)) res = 'purple';
    else if (type.match(/^\d+$/)) res = 'gray';
    if (!type) {
      code = parseInt(code);
      if (code.toString().match(/^(302|303|307)$/)) res = 'gray';
      if (code.toString().match(/^(301|308)$/)) res = 'purple';
      if (code >= 400 || code < 200) res = 'red';
    }
    return 'impct-' + res;
  };


  var updatePopupContent = function(type, data){
    if (type === 'relCan') {
      var code = parseInt(data.statusObj.status);
      var className = code >= 200 && code <= 400 ? 'good-url' : 'bad-url';
      var $node = $('.relCan-item a[href="' + data.url + '"]').parent();
      $node.find('a').addClass(className);
      if (className === 'bad-url') {
        $node.find('.text-warning').removeClass('hidden');
        $node.closest('tr').find('.icon-broken').removeClass('hidden');
      }
    }
    else if (type === 'ip') {
      $('[data-ip="' + data.ip + '"]').text(data.value);
    }
  };


  var isEllipsisActive = function(e) {
    var res = false;
    if (e.offsetWidth + 2 < e.scrollWidth) res = true;
    if (e.offsetHeight < e.scrollHeight) res = true;
    return res;
  };


  var getFilename = function(){
    var filename = 'LinkResearchTools-Link-Redirect-Trace-';
    filename += getDate() + '-';
    var url = $('.hop-url a').text().trim().toLowerCase();
    url = url.replace(/^https?:\/\//, '');
    url = url.replace(/\./g, '_').replace(/\//g, '-');
    url = url.replace(/[^\w-]/g, '-');
    url = url.substr(0, 194);
    filename += url;
    return filename;
  };


  var getDate = function(){
    var a = new Date();
    var year = a.getFullYear();
    var month = ('0' + (a.getMonth() + 1)).substr(-2);
    var day = ('0' + a.getDate()).substr(-2);
    var hours = ('0' + a.getHours()).substr(-2);
    var min = ('0' + a.getMinutes()).substr(-2);
    var sec = ('0' + a.getSeconds()).substr(-2);
    var time = year + month + day + '-' + hours + min + sec;
    return time;
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


  return {
    init: init
  };

})().init();



