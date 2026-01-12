var RobotsImg = (function(){

  var vendor = (navigator.userAgent.match(/(Chrome|Firefox)/) || [])[1];
  var icons = {};


  const prepareImages = async () => {
    ['noindex', 'major', 'index'].map(function(left){
      ['nofollow', 'follow', 'canonical'].map(function(right){
        var key = left + '-' + right;
        var filename = key + '.png';
        if (vendor === 'Firefox') filename = 'ff-' + filename;
        icons[key] = chrome.runtime.getURL('/img/toolbar/' + filename);
      });
    });
    Object.keys(icons).map(async (key) => {
      icons[key] = await getImgBitmap(icons[key]);
    });
  };


  const getImgBitmap = async src => {
    let blob = await fetch(src).then(r => r.blob());
    let bitmap = await createImageBitmap(blob);
    return bitmap;
  };

  prepareImages();


  var generateCanvas = function( params ){
    var noindex = params.data.noindex;
    var majorIndex = params.data.majorIndex;
    var nofollow = params.data.nofollow;
    var relCan = params.data.relCan;

    var size = parseInt( params.size );
    if (!size) size = 19; // 19px
    var canvas = new OffscreenCanvas(size, size);
    var context = canvas.getContext("2d");

    var left = 'index';
    var right = 'follow';
    if (noindex && majorIndex) left = 'major';
    else if (noindex) left = 'noindex';

    if (relCan) right = 'canonical';
    else if (nofollow) right = 'nofollow';

    var key = left + '-' + right;
    var bitmap = icons[key];
    context.drawImage(bitmap, 0, 0, size, size);

    return canvas;
  };


  var convertCanvasToImage = function(canvas) {
    var image = new Image();
    image.src = canvas.toDataURL("image/png");
    return image;
  };


  var getImageData = function(params){
    var canvas = generateCanvas(params);
    var context = canvas.getContext("2d");
    return context.getImageData(0,0,params.size, params.size);
  };


  return {
    getImageData: getImageData
  };

})();
