var LRTIcon = (function(){

  var warningIcon = new Image();
  warningIcon.src = '';

  var cartIcon = new Image();
  cartIcon.src = '';

  var SVGTemplate = '';


  var init = function(){
    loadSVGTemplate(chrome.runtime.getURL('img/templatePT.svg'));
  };


  var loadSVGTemplate = function(url){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          SVGTemplate = xhr.responseText;
        }
      }
    };
    xhr.open('GET', url);
    xhr.send();
  };


  function convertImageToCanvas(image) {
    var canvas = document.createElement("canvas");
    canvas.width = 19;
    canvas.height = 19;
    canvas.getContext("2d").drawImage(image, 0, 0, 19, 19);
    return canvas;
  }


  function convertCanvasToImage(canvas) {
    var image = new Image();
    image.src = canvas.toDataURL("image/png");
    return image;
  }

  /**
   * @param  {object} metrics: {powertrust, power, trust}
   */
  var generateCanvas = function( metrics, size, messageCode ){
    var powertrust = metrics.powertrust,
        power = metrics.power,
        trust = metrics.trust;
    if ( isNaN(powertrust) ) powertrust = 'n/a';

    var canvas = document.createElement("canvas");
    size = parseInt(size);
    if (!size) size = 19; // 19px
    canvas.width = size;
    canvas.height = size;

    var context = canvas.getContext("2d");
    var iconW = size;
    var iconH = size;
    var margin = size > 20 ? Math.floor(size/20) : 1;
    var barW = size - 2*margin;
    var barH = size > 20 ? size*0.15 : size*0.1;
    var fontSize = size > 20 ? Math.floor(size/2.5) : 11;

    // background
    context.fillStyle = "#ddd";
    if (size > 20) roundRect(context, 0, 0, size, size, 5, true, false);
    else context.fillRect(0, 0, iconW, iconH);


    // white bars
    context.fillStyle = "#fff";
    context.fillRect(margin, margin, barW, barH);
    context.fillRect(margin, iconH - barH - margin, barW, barH);

    if (messageCode) {
      if (messageCode === 103 || messageCode === 104) {
        context.drawImage(warningIcon, 3, 3, 13, 13);
      }
      else if (messageCode === 602) {
        context.drawImage(cartIcon, 3, 3, 13, 13);
      }
      return canvas;
    }

    // upper bar - power
    var powerW = parseInt( power * barW / 10 );
    context.fillStyle = "#db4437";
    context.fillRect(margin, margin, powerW, barH);

    // lower bar - trust
    var trustW = parseInt( trust * barW / 10 );
    context.fillStyle = "#4285F4";
    context.fillRect(margin, iconH - barH - margin, trustW, barH);

    context.textBaseline="top";
    context.fillStyle = '#000';
    if (size > 20) context.fillStyle = "#666";
    context.font = "bold " + fontSize + 'px "Dosis"';
    var textW = context.measureText(powertrust).width;
    context.fillText(
      powertrust,
      parseInt((iconW - textW)/2),
      parseInt( (iconH - fontSize)/2 - (size > 20?2:1))
    );

    return canvas;
  };


  var getImageData = function( metrics, size, messageCode ){
    var canvas = generateCanvas( metrics, size, messageCode );
    var context = canvas.getContext("2d");
    return context.getImageData(0, 0, 19, 19);
  };


  var getImage = function( metrics, size, messageCode ){
    var canvas = generateCanvas( metrics, size, messageCode );
    var img = convertCanvasToImage(canvas);
    img.title = getTitle(metrics);
    return img;
  };


  var getDataURL = function( metrics, size, messageCode ){
    var canvas = generateCanvas( metrics, size, messageCode );
    return canvas.toDataURL("image/png");
  };


  /**
   * Generate "title" for the image
   * @param  {object} metrics
   * @param  {string} target  icon|page|dom
   *                          icon - title for browserAction icon (depends on
   *                          localStorage value)
   * @return {string}
   */
  var getTitle = function(metrics){
    if (typeof metrics.powertrust === 'undefined' || metrics.powertrust === 'n/a') return 'n/a';
    var title = '';
    return metrics.powertrust + ' = ' + metrics.power + ' * ' + metrics.trust;
  };


  /**
   * http://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
   * Draws a rounded rectangle using the current state of the canvas.
   * If you omit the last three params, it will draw a rectangle
   * outline with a 5 pixel border radius
   * @param {CanvasRenderingContext2D} ctx
   * @param {Number} x The top left x coordinate
   * @param {Number} y The top left y coordinate
   * @param {Number} width The width of the rectangle
   * @param {Number} height The height of the rectangle
   * @param {Number} [radius = 5] The corner radius; It can also be an object
   *                 to specify different radii for corners
   * @param {Number} [radius.tl = 0] Top left
   * @param {Number} [radius.tr = 0] Top right
   * @param {Number} [radius.br = 0] Bottom right
   * @param {Number} [radius.bl = 0] Bottom left
   * @param {Boolean} [fill = false] Whether to fill the rectangle.
   * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
   */
  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke == 'undefined') {
      stroke = true;
    }
    if (typeof radius === 'undefined') {
      radius = 5;
    }
    if (typeof radius === 'number') {
      radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
      var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
      for (var side in defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
      ctx.fill();
    }
    if (stroke) {
      ctx.stroke();
    }
  }


  var getSVG = function(metrics){
    // width of the bar
    var W = 26;
    var data = {};
    data.PWidth = (metrics.power/10)*W;
    data.TWidth = (metrics.trust/10)*W;
    data.PTValue = metrics.powertrust;
    var svg = SVGTemplate;
    for (var key in data) {
      svg = svg.replace('{{' + key + '}}', data[key]);
    }
    return svg;
  };


  return {
    init: init,
    getImageData: getImageData,
    getImage: getImage,
    getDataURL: getDataURL,
    getTitle: getTitle,
    getSVG: getSVG
  };

})();





