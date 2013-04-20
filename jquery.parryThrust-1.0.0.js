// Adam Scoble presents
// # jquery.parryThrust-1.0.0.js
// Click through transparent areas of images and
// call a function in the context of the bottom most 
// element (this).

/**
 * ## Dependencies
 * - [jQuery](http://docs.jquery.com/)
 */

/**
 * ## Compatibility
 * - IE9+
 * - All other modern browsers
 */
// Uses HTML5's 'Canvas', you can check compatibility here:
// http://caniuse.com/#feat=canvas

/**
 * ## Usage
 */
// Instantiate the plugin on an element containing all
// image elements. e.g.
// 
// ```js
// $('#images').parryThrust();
// ```
// 
// ```html
// <div id="images">
//     <img src="image01.jpg" />
//     <img src="image02.jpg" />
//     <img src="image03.jpg" />
//     <img src="image04.jpg" />
//     <img src="image05.jpg" />
// </div>
// ```
// 
// It is advisable that you create a new parryThrust
// for each group of overlapping images, rather than 
// one for the entire page. While it will work, a lot
// of unnecessary processing will occur.
// 
// You can also use background-images, or a combination.
// In this case, you will need to pass a common selector
// for all image objects to be included, e.g.
// 
// ```js
// $('#images').parryThrust({
//     imgSelector: '.image'
// });
// ```
// 
// ```html
// <div id="images">
//     <img src="image01.jpg" class="image" />
//     <div style="background: url(image02.jpg);" class="image" />
//     <img src="image03.jpg" class="image" />
//     <div style="background: url(image04.jpg);" class="image" />
//     <img src="image05.jpg" class="image" />
// </div>
// ```
// 
// If your images are not sibblings in your hierarchy
// you need to provide a selector for the closest ancestors, e.g.
// 
// ```js
// $('#images').parryThrust({
//     imgSelector: '.image',
//     parentSelector: '.ancestor'
// });
// ```
// 
// ```html
// <div id="images">
//     <div class="ancestor" />
//         <img src="image01.jpg" class="image" />
//     </div>
//     <div class="ancestor" />
//         <img src="image02.jpg" class="image" />
//     </div>
//     <div class="ancestor" />
//         <img src="image03.jpg" class="image" />
//     </div>
// </div>
// ```

(function($){
    /**
     * @param {element} elem Element containing all image elements
     * @param {object} options Object containing options for this instance
     */
    function ParryThrust(elem, options){
        this.elem = elem;
        this.$elem = $(elem);
        this.images = [];
        this.$cursorClassElem = null;
        this.$currentImageParent = null;
        this.canvasElems = { canvas: null, context: null };
        this.config = $.extend({}, this.defaults, options || {});
        
        var self = this;

        // Wait for the window to load to ensure images are completely
        // loaded before initialising the plugin. (Drawing them later
        // will break otherwise.)
        $(window).load(function () {
            $.proxy(self._init(), self);
        });
    }

    ParryThrust.prototype = {
        defaults: {
            // Selector for image elements to be processed by the plugin
            imgSelector: 'img',
            // Selector for image elements' closest related ancestor if 
            // they are not sibblings. (See: 'Usage' for explanation)
            parentSelector: null,
            // Updates each relevant property every process if it is
            // set to dynamic. Use these if you are changing any of the
            // appropriate values after the instantiation of this instance.
            dynamicProperties: {width: false,
                                height: false,
                                position: false,
                                bgPosition: false
            },
            // Transparency tolerance, can be set lower to allow mousing
            // through semi-transparency.
            transparentPercent: 100,
            // Class added to the body element when it is over 
            // non-transparency. Set to `''` or `false` to disable.
            cursorClass: 'cursor',
            // Class added to the parent element or result of `parentSelector`,
            // relative to the current non-transparent image. Set to `''` or
            // `false` to disable.
            hoverClass: 'hover',
            // Checks every frame to see if the mouse has left the image items, 
            // use this if you have other items overlapping and hover class isn't 
            // being removed (Processor intensive).
            mouseOffCheck: false,
            // A function to run within the context of the bottom-most clicked 
            // image element.
            callback: null,
            // A function to run within the context of the bottom-most non-valid
            // (not one of the images) clicked element.
            nonImageCallback: null,
            // Logs in the console how long it took to find the bottom most valid 
            // image
            logTimeTaken: false
        },
        _init : function(){
            this._buildImages();
            this._createCanvas();

            var cfg = this.config;

            if(cfg.cursorClass){ 
                this.$cursorClassElem = $('body'); 
            }

            this._bindEvents();
        },
        _buildImages : function(){
            var self = this,
                $elems = self.$elem.find(this.config.imgSelector);

            $elems.each(function(index, element){
                var $element = $(element),
                    imgObj = {  elem: element,
                                $elem: $element
                    };

                imgObj.width = self._getImageWidth(imgObj);
                imgObj.height = self._getImageHeight(imgObj);
                imgObj.offset = self._getImageOffset(imgObj);
                imgObj.src = self._getImageSrc(imgObj);
                imgObj.bgPos = self._getBgPosition(imgObj);
                imgObj.type = imgObj.src ? 'bg' : 'img';

                self.images.unshift(imgObj);
            });
        },
        _createCanvas : function(){
            this.canvasElems.canvas = $('<canvas width="'+ 100 +'" height="'+ 100 +'" />')[0];
            this.canvasElems.context =  this.canvasElems.canvas.getContext('2d');
        },
        _bindEvents : function(){
            var self = this;

            $.each(this.images, function(index, imgObj){
                imgObj.$elem.bind('touchstart', $.proxy(self._handleFirstTouch, self));
                imgObj.$elem.bind('click touchstart', $.proxy(self._handleMouse, self));
                
                if (self.config.cursorClass || self.config.hoverClass){
                    imgObj.$elem.mouseover($.proxy(self._bindMouseOverEvents, self));
                }
            });
        },
        _handleMouse : function(e){
            var $topImage = $(e.currentTarget),
                isTouchstart = e.type === 'touchstart',
                mouseX = isTouchstart ? e.originalEvent.changedTouches[0].pageX : e.pageX,
                mouseY = isTouchstart ? e.originalEvent.changedTouches[0].pageY : e.pageY,
                startTime = this.config.logTimeTaken ? new Date().getTime() : null,
                $btmImg = this._getImageElemAtMouse(e.type, $topImage, mouseX, mouseY),
                cfg = this.config;

            if(startTime !== null && $btmImg){
                var nowTime = new Date().getTime();

                console.log("Found image in", nowTime - startTime + "ms");
            }

            if($btmImg){
                this._handleBottomImage(e.type, $btmImg);   
            } else {
                cfg.cursorClass && this.$cursorClassElem.removeClass(cfg.cursorClass);
                cfg.hoverClass && this.$currentImageParent !== null && this.$currentImageParent.removeClass(cfg.hoverClass);
                
            }
        },
        _getImageElemAtMouse : function(eType, $img, mouseX, mouseY, $transPtImgs){
            var $image = $img,
                imgObj = this._getImageObjectFromElem($image);
            if(!imgObj){
                if(eType === "click" || eType === "touchstart"){
                    typeof this.config.nonImageCallback === 'function' && this.config.nonImageCallback.call($image);
                }

                return false;
            } 

            var isPointTransparent = this._isPointTransparent(imgObj, mouseX, mouseY);

            if(isPointTransparent){
                var $transparentPointImages = $transPtImgs && $transPtImgs.length ? $transPtImgs.add(imgObj.$elem) : imgObj.$elem;

                this._toggleElemsVisibility($transparentPointImages, 'hide');

                var nextElem = document.elementFromPoint(mouseX - window.pageXOffset, mouseY - window.pageYOffset),
                    $nextElem = $(nextElem);

                this._toggleElemsVisibility($transparentPointImages, 'show');

                $image = this._getImageElemAtMouse(eType, $nextElem, mouseX, mouseY, $transparentPointImages);
            } 

            return $image;
        },
        _getImageObjectFromElem : function($element){
            var self = this,
                $elem = $element,
                imageObject = false;

            if( $elem.is(':animated') || 
                self.config.parentSelector && ($elem.closest(self.config.parentSelector).is(':animated') || $elem.is(':animated'))){
                    return false;
            }

            $.each(self.images, function(index, image){
                if(image.elem === $elem[0]){
                    imageObject = self.images[index];
                }
            });

            return imageObject;
        },
        _isPointTransparent : function(img, mouseX, mouseY){
            var imgObj = this._updateImageProperties(img),
                imageToDraw = imgObj.elem,
                canvas = this.canvasElems.canvas,
                context = this.canvasElems.context,
                xPos = mouseX - imgObj.offset.left,
                yPos = mouseY - imgObj.offset.top;

            if(imgObj.type === 'bg'){
                imageToDraw = new Image();
                imageToDraw.src = imgObj.src;
            }

            canvas.width = imgObj.width;
            canvas.height = imgObj.height;

            context.clearRect(0,0, canvas.width, canvas.height);

            context.drawImage(imageToDraw, imgObj.bgPos.x, imgObj.bgPos.y, imgObj.width, imgObj.height);
            
            var mousePos = {x : xPos, y : yPos},
                imageData = context.getImageData(mousePos.x, mousePos.y, 1, 1),
                alpha = imageData.data[3],
                isTransparent = (100*alpha/255) << 0 < this.config.transparentPercent;

            return isTransparent;
        },
        _updateImageProperties : function(imgObj){
            var dProps = this.config.dynamicProperties;

            if(dProps.width){ imgObj.width = this._getImageWidth(imgObj); }
            if(dProps.height){ imgObj.height = this._getImageHeight(imgObj); }
            if(dProps.position){ imgObj.offset = this._getImageOffset(imgObj); }
            if(dProps.bgPosition){ imgObj.bgPos = this._getBgPosition(imgObj); }

            return imgObj;
        },
        _getImageWidth : function(imgObj){
            return imgObj.$elem.width();
        },
        _getImageHeight : function(imgObj){
            return imgObj.$elem.height();
        },
        _getImageOffset : function(imgObj){
            return imgObj.$elem.offset();
        },
        _getImageSrc : function(imgObj){
            var $elem = imgObj.$elem,
                bg = $elem.css('backgroundImage') === 'none' ? null : $elem.css('backgroundImage'),
                src = this._stripBgString(bg);

            return src;
        },
        _stripBgString : function(bgString){
            if(!bgString) { return null; }

            var src = bgString.replace(/url\(['"]*(.*?)['"]*\)/g,'$1');

            return src;
        },
        _getBgPosition : function(imgObj){
            var bgPosition = imgObj.$elem.css('backgroundPosition').split(" ");

            return {x: parseInt(bgPosition[0], 10), y: parseInt(bgPosition[1], 10)};
        },
        _toggleElemsVisibility : function($elems, method){
            this.config.parentSelector ? $elems.closest(this.config.parentSelector)[method]() : $elems[method]();
        },
        _handleFirstTouch : function(){
            var self = this,
                cfg = self.config;

            cfg.cursorClass = null;
            cfg.hoverClass = null;

            $.each(self.images, function(index, imgObj){
                imgObj.$elem
                    .unbind('touchstart', $.proxy(self._handleFirstTouch, self))
                    .unbind('mouseover', $.proxy(self._bindMouseOverEvents, self));
            });
        },
        _bindMouseOverEvents : function(){
            var self = this;

            $.each(this.images, function(index, imgObj){
                imgObj.$elem
                    .mousemove($.proxy(self._handleMouse, self))
                    .mouseout($.proxy(self._unbindMouseOverEvents, self));
            });

            self.config.mouseOffCheck && $(document).mousemove($.proxy(self._handleDocumentMouse, self));
        },
        _unbindMouseOverEvents : function(){
            var self = this,
                cfg = this.config;

            cfg.cursorClass && this.$cursorClassElem.removeClass(cfg.cursorClass);
            this.$currentImageParent !== null && this.$currentImageParent.removeClass(cfg.hoverClass);

            $.each(this.images, function(index, imgObj){
                imgObj.$elem
                    .unbind('mousemove', $.proxy(self._handleMouse, self))
                    .unbind('mouseout', $.proxy(self._unbindMouseOverEvents, self));
            });
              
            $(document).unbind('mousemove', $.proxy(this._handleDocumentMouse, this));
        },
        
        _handleBottomImage : function(eType, $btmImg){
            var eventType = eType,
                $bottomImage = $btmImg,
                cfg = this.config;

            if(eventType === "click" || eventType === "touchstart"){
                typeof cfg.callback === 'function' && cfg.callback.call($bottomImage);
            } else {
                if (cfg.hoverClass) {
                    var $currentParent = this.$currentImageParent;

                    $currentParent !== null && $currentParent.removeClass(cfg.hoverClass);
                    $currentParent = cfg.parentSelector ? $bottomImage.closest(cfg.parentSelector) : $bottomImage.parent();
                    $currentParent.addClass(cfg.hoverClass);

                    this.$currentImageParent = $currentParent;
                }

                cfg.cursorClass && this.$cursorClassElem.addClass(cfg.cursorClass);

            }
        },
        _handleDocumentMouse : function(e){
            var currentTarget = document.elementFromPoint(e.pageX - window.pageXOffset, e.pageY - window.pageYOffset),
                $currentTarget = $(currentTarget);

            !this._getImageObjectFromElem($currentTarget) && this._unbindMouseOverEvents();
        }
        
        
    };

    window.ParryThrust = ParryThrust;

    $.fn.parryThrust = function(options) {
        return this.each(function() {
            var instance = new ParryThrust(this, options);
            $(this).data('parryThrust', instance);
        });
    };
})(jQuery);