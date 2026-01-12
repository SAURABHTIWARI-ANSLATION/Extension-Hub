var Helpers = (function () {

  var getUrlParameter = function(locationObj, sParam) {
    var sPageURL = locationObj.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++)
    {
      var sParameterName = sURLVariables[i].split('=');
      if (sParameterName[0] == sParam)
      {
        return sParameterName[1];
      }
    }
  };


  var getHost = function(url){
    var aLink = document.createElement("a");
    aLink.href = url;
    return aLink.host;
  };


  var getNrString = function ( n ) {
    var sizes = ['', 'K', 'M', 'G', 'T'];
    if (typeof n !== 'number') return n;
    if (n === 0) return n + '';
    var i = parseInt(Math.floor(Math.log(n) / Math.log(1000)));
    return Math.round(n / Math.pow(1000, i), 2) + sizes[i];
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


  var getCanonicalUrl = function(url){
    if (isYoutube(url)) {
      var ytURL = getYoutubeLink(url);
      if (ytURL) return ytURL;
    }
    url = preprocessUrl( url );
    return url;
  };


  var isYoutube = function(url){
    return !!url.match(/^https?:\/\/www\.youtube.com/);
  };


  var getYoutubeLink = function(url){
    var matches = url.match(/youtube\.com\/watch\?v=([\w-]+)/);
    if (matches) return 'http://www.youtube.com/watch?v=' + matches[1];
    else return '';
  };


  var preprocessUrl = function( url ){
    var stripList = ["track","subid","cp","referer","coupon","member_id","was_dd","domainlink","w3tc_note","v","action","mkt_tok","locale_id","firstname","lastname","email","username","__hstc","__hssc","r","gid","amember_redirect_url","payment_id","replytocom","vcode","payment_with","__hsfp","hsCtaTracking","_hsenc","_hsmi","utm_campaign","utm_content","utm_medium","utm_source"];
    for (var i = 0, len = stripList.length; i < len; i++) {
      var key = stripList[i];
      url = removeParam( key, url );
    }
    return url;
  };


  var removeParam = function(key, sourceURL) {
      var rtn = sourceURL.split("?")[0],
          param,
          params_arr = [],
          queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
      if (queryString !== "") {
          params_arr = queryString.split("&");
          for (var i = params_arr.length - 1; i >= 0; i -= 1) {
              param = params_arr[i].split("=")[0];
              if (param === key) {
                  params_arr.splice(i, 1);
              }
          }
          rtn = rtn + "?" + params_arr.join("&");
      }
      return rtn;
  };


  Object.defineProperty(Array.prototype, 'chunk', {
      value: function(chunkSize) {
          var R = [];
          for (var i=0; i<this.length; i+=chunkSize)
              R.push(this.slice(i,i+chunkSize));
          return R;
      }
  });


  return {
    getHost: getHost,
    getUrlParameter: getUrlParameter,
    getNrString: getNrString,
    getDate: getDate,
    getCanonicalUrl: getCanonicalUrl
  };


})();


