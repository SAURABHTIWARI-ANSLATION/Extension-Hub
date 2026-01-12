var Screenshot = {
  /**
   * @description ID of current tab
   * @type {Number}
   */
  tabId: null,

  /**
   * @description Canvas element
   * @type {Object}
   */
  screenshotCanvas: null,

  /**
   * @description 2D context of screenshotCanvas element
   * @type {Object}
   */
  screenshotContext: null,

  /**
   * @description Number of pixels by which to move the screen
   * @type {Number}
   */
  scrollBy: 0,

  /**
   * @description Sizes of page
   * @type {Object}
   */
  size: {
    width: 0,
    height: 0
  },

  /**
   * @description Keep original params of page
   * @type {Object}
   */
  originalParams: {
    overflow: "",
    scrollTop: 0
  },

  devicePixelRatio: 1,

  /**
   * @description Initialize plugin
   */
  init: function () {
    this.screenshotCanvas = document.createElement("canvas");
    this.screenshotContext = this.screenshotCanvas.getContext("2d");
  },


  take: function(onCaptured){
    this.onCaptured = onCaptured;
    this.getPageDetails();
    // set width & height of canvas element
    this.screenshotCanvas.width = this.size.width*devicePixelRatio;
    this.screenshotCanvas.height = this.size.height*devicePixelRatio;
    this.scrollTo(0);
  },


  getPageDetails: function(){
    var size = {
      width: Math.max(
        // document.documentElement.clientWidth,
        document.body.scrollWidth,
        // document.documentElement.scrollWidth,
        document.body.offsetWidth,
        // document.documentElement.offsetWidth
      ),
      height: Math.max(
        // document.documentElement.clientHeight,
        document.body.scrollHeight,
        // document.documentElement.scrollHeight,
        document.body.offsetHeight,
        // document.documentElement.offsetHeight
      )
    };
    this.size = size;
    this.scrollBy = window.innerHeight;
    this.originalParams = {
      overflow: document.querySelector("body").style.overflow,
      scrollTop: document.body.scrollTop,
    };
    this.devicePixelRatio = window.devicePixelRatio;
  },

  /**
   * @description Send request to scroll page on given position
   * @param {Number} position
   */
  scrollTo: function (position) {
    this.lastCapture = false;
    window.scrollTo(0, position);
    // first scrolling
    if (position === 0) {
      document.querySelector("body").style.overflow = "hidden";
    }
    // last scrolling
    if (this.size.height <= Math.ceil(window.scrollY) + this.scrollBy) {
      this.lastCapture = true;
      position = Math.max(0, this.size.height - this.scrollBy);
    }
    this.capturePage(position);
  },

  /**
   * @description Takes screenshot of visible area and merges it
   * @param {Number} position
   * @param {Boolean} lastCapture
   */
  capturePage: function (position) {
    var self = this;

    setTimeout(function () {
      chrome.tabs.captureVisibleTab(null, {
        "format": "png"
      }, function (dataURI) {
        if (typeof dataURI !== "undefined") {
          var image = new Image();
          image.onload = function() {
            self.screenshotContext.drawImage(image, 0, position*devicePixelRatio);
            if (self.lastCapture) {
              self.resetPage();
              if (self.onCaptured) {
                var dataURL = self.screenshotCanvas.toDataURL("image/png");
                self.onCaptured(dataURL);
              }
              else {
                newWindow = window.open();
                newWindow.document.write("<style type='text/css'>body {margin: 0;}</style>");
                newWindow.document.write("<img src='" + self.screenshotCanvas.toDataURL("image/png") + "'/>");
              }
            } else {
              self.scrollTo(position + self.scrollBy);
            }
          };
          image.src = dataURI;
        } else {
          showError();
        }
      });
    }, 500);
  },

  showError: function(){
    var errorEl = document.createElement("div");
    errorEl.innerHTML = "<div style='position: absolute; top: 10px; right: 10px; z-index: 9999; padding: 8px; background-color: #fff2f2; border: 1px solid #f03e3e; border-radius: 2px; font-size: 12px; line-height: 16px; transition: opacity .3s linear;'>An internal error occurred while taking pictures.</div>";
    document.body.appendChild(errorEl);
    setTimeout(function () {
      errorEl.firstChild.style.opacity = 0;
    }, 3000);
    resetPage(this.originalParams);
  },

  /**
   * @description Send request to set original params of page
   */
  resetPage: function (originalParams) {
    window.scrollTo(0, this.originalParams.scrollTop);
    document.querySelector("body").style.overflow = this.originalParams.overflow;  }
};
