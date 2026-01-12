function Hop( logItem ){
  var data = {
    url: '',
    ip: '',
    isHTTP2: false,
    protocol: '',
    redirect: false,
    redirectType: '',
    statusCode: -1,
    statusLine: '',
    headers: [],
    cookieCount: 0,
    cookies: [],
    meta: [],
    relCan: [],
    shortlinks: [],
    robots: [],
    robotsTxt: false,
    debug: ''
  };
  for (var key in data) {
    this[key] = data[key];
  }
  this.processLogItem( logItem );
  return this;
}


Hop.prototype.processLogItem = function( logItem ){
  this.logItem = logItem;
  this.url = logItem.url;
  this.isHTTP2 = logItem.isHTTP2;
  this.protocol = logItem.protocol;
  this.debug = logItem.debug;
  this.tsStart = logItem.tsStart;
  this.tsDOMLoaded = logItem.tsDOMLoaded;
  var web = logItem.web;
  var nav = logItem.nav;
  if (web) {
    this.statusCode = web.statusCode;
    this.statusLine = web.statusLine;
    this.headers = web.responseHeaders;
    this.ip = web.ip;
    this.fromCache = web.fromCache;
  }
  if (logItem.redirect) {
    this.redirect = true;
    this.redirectType = logItem.redirectType;
  }

  this.cookieCount = logItem.cookieCount;
  this.cookies = logItem.cookies;
  this.meta = logItem.meta;
  this.relCan = logItem.relCan;
  this.shortlinks = logItem.shortlinks;
  this.robots = logItem.robots;
  this.robotsTxt = logItem.robotsTxt;
};

