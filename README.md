## Adam Scoble presents
# jquery.parryThrust-1.0.0.js
Click through transparent areas of images and call a function in the context of the bottom most element (this).

## Dependencies
* [jQuery](http://docs.jquery.com/)

## Compatibility
* IE9+
* All other modern browsers

Uses HTML5's 'Canvas', you can check compatibility here:
http://caniuse.com/#feat=canvas

## Usage
Instantiate the plugin on an element containing all image elements. e.g.

    $('#images').parryThrust();
    
    <div id="images">
        <img src="image01.jpg" />
        <img src="image02.jpg" />
        <img src="image03.jpg" />
        <img src="image04.jpg" />
        <img src="image05.jpg" />
    </div>

It is advisable that you create a new parryThrust for each group of overlapping images, rather than one for the entire page. While it will work, a lot of unnecessary processing will occur.

You can also use background-images, or a combination. In this case, you will need to pass a common selector for all image objects to be included, e.g.

	$('#images').parryThrust({
    	imgSelector: '.image'
	});

	<div id="images">
	    <img src="image01.jpg" class="image" />
	    <div style="background: url(image02.jpg);" class="image" />
	    <img src="image03.jpg" class="image" />
	    <div style="background: url(image04.jpg);" class="image" />
	    <img src="image05.jpg" class="image" />
	</div>

If your images are not sibblings in your hierarchy you need to provide a selector for the closest ancestors, e.g.

	$('#images').parryThrust({
	    imgSelector: '.image',
	    parentSelector: '.ancestor'
	});

	<div id="images">
	    <div class="ancestor" />
	        <img src="image01.jpg" class="image" />
	    </div>
	    <div class="ancestor" />
	        <img src="image02.jpg" class="image" />
	    </div>
	    <div class="ancestor" />
	        <img src="image03.jpg" class="image" />
	    </div>
	</div>

## Options
`imgSelector: 'img'` Selector for image elements to be processed by the plugin  

`parentSelector: null` Selector for image elements' closest related ancestor if they are not sibblings. (See: 'Usage' for explanation)  

`dynamicProperties: { width: false, height: false, position: false, bgPosition: false }` Updates each relevant property every process if it is set to dynamic. Use these if you are changing any of the appropriate values after the instantiation of this instance.

`transparentPercent: 100` Transparency tolerance, can be set lower to allow mousing through semi-transparency.  

`cursorClass: 'cursor'` Class added to the body element when it is over non-transparency. Set to `''` or `false` to disable.  

`hoverClass: 'hover'` Class added to the parent element or result of `parentSelector`, relative to the current non-transparent image. Set to `''` or `false` to disable.  

`mouseOffCheck: false` Checks every frame to see if the mouse has left the image items, use this if you have other items overlapping and hover class isn't  being removed (Processor intensive).  

`callback: null` A function to run within the context of the bottom-most clicked image element.  

`nonImageCallback: null` A function to run within the context of the bottom-most non-valid (not one of the images) clicked element.
  
`logTimeTaken: false` Logs in the console how long it took to find the bottom most valid image  
