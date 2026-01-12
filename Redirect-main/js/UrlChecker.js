var UrlChecker = (function(){


  var getStatus = function(url, cbProcessResponse){
    fetch(url, {credentials: 'omit'}).then(function(response){
      cbProcessResponse({status: response.status, statusText: response.statusText});
    });
  };


  return {
    getStatus: getStatus
  };

})();
