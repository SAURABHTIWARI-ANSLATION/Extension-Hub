var Options = (function(){

  var vendor = (navigator.userAgent.match(/(Chrome|Firefox)/) || [])[1];


  var init = function(){
    chrome.runtime.sendMessage({
      cmd: 'settings.get',
      data: {}
    }, function( settings ){
      initSettings(settings);
      initUI();
    });
  };


  var initSettings = function( settings ){
    for (var key in settings) {
      var id = '#input-' + key;
      var $node = $(id);
      if ($node.attr('type') === 'checkbox') $node.prop('checked', settings[key]);
      else if ($node.attr('type') === 'number') $node.val(settings[key]);
    }
  };


  var initUI = function(){
    if (vendor === 'Firefox') {
      $('#main-logo').attr('href', 'https://lrt.li/rtlogoappfirefox');
      $('#lrt-logo').attr('href', 'https://lrt.li/rtlogofirefox');
      $('a.rate-it-container').attr('href', 'https://lrt.li/rtsettingsratingff');
    }
    $('input[type=checkbox').change(function(e){
      if (this.id.indexOf('input-') !== 0) return;
      var key = this.id.replace('input-', '');
      setSetting( key, this.checked);
    });
    $('input[type=number').change(function(e){
      if (this.id.indexOf('input-') !== 0) return;
      var key = this.id.replace('input-', '');
      setSetting( key, parseInt(this.value));
    });
    $('.btn-ok').click(function(e){
      e.preventDefault();
      document.location.href = '/html/popup.html';
    });
  };


  var setSetting = function(key, value){
    chrome.runtime.sendMessage({
      cmd: 'settings.set',
      data: {
        key: key,
        value: value
      }
    });
  };


  return {
    init: init
  };

})();


Options.init();
