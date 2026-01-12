var RobotsTxt = (function(){


  var checkUrl = function( params, cbProcessResult ){
    var url = params.url;
    var cacheTime = params.settings.robotsCacheTime;
    var suffix = parseInt(Date.now() / 1000 / cacheTime);
    var loc = new URL(url);
    var robotsTxtUrl = loc.origin + '/robots.txt?' + suffix;
    fetch(robotsTxtUrl, {credentials: 'omit'}).then(function(response){
      if (!response.ok) throw new Error(response.statusText);
      return response.text();
    }).then(function(text){
      var data = processRobotsTxtFile(text, url);
      cbProcessResult(data);
    })
    .catch(function(error){
      console.log(error);
      cbProcessResult(false);
    });
  };


  var processRobotsTxtFile = function(text, url){
    var majorList = SearchEngines.getList();
    var robots = new RobotsParser(url, text);
    var allBotsList = (robots.getAllUserAgents() || []).filter(function(bot){
      return bot !== '*';
    });
    var allAllowed = robots.isAllowed(url, '*');

    var allowed = [];
    var blocked = [];
    if (allAllowed) allowed.push('*');
    else blocked.push('*');
    allBotsList.map(function(bot){
      var isAllowed = robots.isAllowed(url, bot);
      if (isAllowed) allowed.push(bot);
      else blocked.push(bot);
    });
    if (blocked.length) allAllowed = false;
    var majorAllowed = true;
    majorList.map(function(bot){
      var isAllowed = robots.isAllowed(url, bot);
      if (!isAllowed) majorAllowed = false;
    });
    var res = {
      allAllowed: allAllowed,
      majorAllowed: majorAllowed,
      allowed: allowed,
      blocked: blocked
    };
    return res;
  };


  return {
    checkUrl: checkUrl
  };

})();

