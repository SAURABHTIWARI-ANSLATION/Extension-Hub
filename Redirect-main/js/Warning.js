var Warning = (function(){

  var init = function(){

  };


  var checkPath = function(path){
    // Over 5 hops
    var warnings = {};
    var dangers = {};

    if (path.hops.length > 5) {
      warnings.over5 = true;
    }
    for (var i = 0, len = path.hops.length; i < len; i++) {
      var hop = path.hops[i];
      if (hop.statusCode < 200 || hop.statusCode >= 400) {
        hop.statusLineWarning = true;
        warnings.hop = true;
      }
      if (hop.statusCode >= 500) {
        dangers.hop = true;
      }
    }
    return {
      warnings: warnings,
      dangers: dangers
    };
  };


  return {
    init: init,
    checkPath: checkPath
  };

})();
