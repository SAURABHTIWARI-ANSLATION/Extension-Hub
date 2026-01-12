var DTOXIcon = (function(){

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


  function toRadians(deg) {
      return deg * Math.PI / 180;
  }


  /**
   * params: {
   *   height: 300,
   *   dtoxrisk: 123,
   *   bgColor: '#f1f1f1',
   *   scaleBgColor: '#fff',
   *   scaleActiveColor: '#f00',
   *   // optional
   *   width: 400
   * }
   */
  var generateCanvas = function( params ){
    var height = params.height;
    var width = params.width;
    if (!params.width) width = Math.floor(height*1.25);
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var scaleStroke = height/6;
    // circle center: x, y
    var cx = width/2;
    var cy = height/2 + scaleStroke/2;
    var outerRadius = height/2;
    var innerRadius = outerRadius - scaleStroke;
    var angle = 180 + (params.dtoxrisk/1000)*180;
    var fontSize = innerRadius;

    var context = canvas.getContext("2d");
    // background
    context.fillStyle = params.bgColor;
    if (height > 20) roundRect(context, 0, 0, width, height, 5, true, false);
    else context.fillRect(0, 0, width, height);

    // outer circle
    context.fillStyle = params.scaleBgColor;
    context.beginPath();
    context.arc(cx, cy, outerRadius, 0, Math.PI, true);
    context.fill();

    // active sector
    context.fillStyle = params.scaleActiveColor;
    context.beginPath();
    context.moveTo(cx, cy);
    context.arc(cx, cy, outerRadius, toRadians(180), toRadians(angle));
    context.lineTo(cx, cy);
    context.closePath();
    context.fill();

    // inner circle
    context.fillStyle = params.bgColor;
    context.beginPath();
    context.arc(cx, cy, innerRadius, 0, Math.PI, true);
    context.fill();

    // risk
    context.fillStyle = "#666";
    context.font = "bold " + fontSize + 'px "Dosis"';
    context.textAlign = "center";
    context.fillText(params.dtoxrisk, cx, cy + scaleStroke/2);

    // logo
    context.fillStyle = "#bcbcbc";
    var logoFontSize = Math.floor(fontSize * 0.8);
    context.font = "normal " + logoFontSize + 'px "Source Sans Pro"';
    context.textAlign = "center";
    context.fillText("DTOXRISK®", cx, cy + logoFontSize + scaleStroke/2);

    return canvas;
  };


  var getImageData = function( params, size ){
    var canvas = generateCanvas( params, size );
    var context = canvas.getContext("2d");
    return context.getImageData(0, 0, 19, 19);
  };


  var getImage = function( params, size ){
    var canvas = generateCanvas( params, size );
    var img = convertCanvasToImage(canvas);
    return img;
  };


  var getDataURL = function( metrics, size, messageCode ){
    var canvas = generateCanvas( metrics, size, messageCode );
    return canvas.toDataURL("image/png");
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


  return {
    getImage: getImage,
    getImageData: getImageData,
    getDataURL: getDataURL
  };

})();





