var Risk = (function(){

  var list = {
    "low": {limit: 100, color: "#0f9d58"},
    "below average": {limit: 250, color: "#eeb211"},
    "average": {limit: 750, color: "#d08d09"},
    "above average": {limit: 900, color: "#ea4333"},
    "high": {limit: 1000, color: "#b51829"},
  };


  var getList = function(){
    return Object.keys(list);
  };


  var getText = function(val){
    if (isNaN(parseInt(val))) return '';
    if (val < 100) return 'low';
    if (val < 250) return 'below average';
    if (val < 750) return 'average';
    if (val < 900) return 'above average';
    if (val <= 1000) return 'high';
  };


  var getColor = function(val){
    if (isNaN(parseInt(val))) return '';
    if (val < 100) return '#0f9d58';
    if (val < 250) return '#eeb211';
    if (val < 750) return '#d08d09';
    if (val < 900) return '#ea4333';
    if (val <= 1000) return '#b51829';
  };


  return {
    getText: getText,
    getColor: getColor,
    getList: getList
  };

})();
