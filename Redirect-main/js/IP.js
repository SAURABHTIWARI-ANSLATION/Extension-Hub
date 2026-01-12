var IP = (function(){

  var getInfo = async function(ip, cbProcessResponse){
    var url = 'http://ip-api.com/json/' + ip;

    var response;

    try {
      response = await fetch(url);
    } catch (error) {
      cbProcessResponse({error: true, data: error});
      return;      
    }

    if (!response.ok) {
      cbProcessResponse({error: true, data: response.status});
      return;
    }
    var json = await response.json();
    cbProcessResponse({
      error: false,
      data: json
    });
  };


  return {
    getInfo: getInfo
  };

})();
