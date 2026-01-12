var RTIcon = (function(){

  var vendor = (navigator.userAgent.match(/(Chrome|Firefox)/) || [])[1];


  const getImgBitmap = async src => {
    let blob = await fetch(src).then(r => r.blob());
    let bitmap = await createImageBitmap(blob);
    return bitmap;
  };


  var redWarningIcon;
  var yellowWarningIcon;

  const prepareImages = async () => {
    redWarningIcon = await getImgBitmap( chrome.runtime.getURL('img/warning-red.png'));
    yellowWarningIcon = await getImgBitmap( chrome.runtime.getURL('img/warning-yellow.png'));
  };
  prepareImages();


  var generateCanvas = function( params ){
    var size = parseInt( params.size );
    if (!size) size = 19; // 19px
    var canvas = new OffscreenCanvas(size, size);
    var context = canvas.getContext("2d");
    var robotsImageData = RobotsImg.getImageData(params);
    context.putImageData(robotsImageData, 0, 0);
    var marginTop = 0;
    if (vendor === 'Firefox') marginTop = 6;
    if (params.data.hasDanger) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(redWarningIcon, 2, marginTop, 15, 14);
    }
    else if (params.data.hasWarning) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(yellowWarningIcon, 2, marginTop, 15, 14);
    }
    // else if (params.data.majorIndex) {
    //   context.clearRect(0, 0, canvas.width, canvas.height);
    //   context.drawImage(yellowWarningIcon, 2, 0, 15, 14);
    // }
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
    return context.getImageData(0, 0, params.size, params.size);
  };


  return {
    getImageData: getImageData
  };

})();
