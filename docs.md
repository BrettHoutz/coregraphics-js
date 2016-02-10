# Wrap

Interface for a single image or text.

## changeDepth

**Parameters**

-   `n` **number** new depth

## kill

Stop rendering this Wrap. After this is called, the Wrap is useless.

## move

Move to new position.

**Parameters**

-   `args` **numbers** new position

## moveAnimated

Move to new position over time

**Parameters**

-   `mode` **string** "SMOOTH" for motion that accelerates and decelerates, or "LINEAR"
    for motion  with a constant speed
-   `callback` **Function** called once done moving
-   `steps` **integer** how many steps moving should take
-   `args` **numbers** new  position

# Wrap

CoreGraphics interface 1.0
Copyright 2016 Brett Houtz

CoreGraphics supplies an object-oriented interface for graphics for the HTML5 Canvas.

## changeDepth

**Parameters**

-   `n` **number** new depth

## kill

Stop rendering this Wrap. After this is called, the Wrap is useless.

## move

Move to new position.

**Parameters**

-   `args` **numbers** new position

## moveAnimated

Move to new position over time

**Parameters**

-   `mode` **string** "SMOOTH" for motion that accelerates and decelerates, or "LINEAR"
    for motion  with a constant speed
-   `callback` **Function** called once done moving
-   `steps` **integer** how many steps moving should take
-   `args` **numbers** new  position

# CoreGraphics

Interface for the canvas. Manages all image loading and drawing. Images and text may be made to
automatically persist over frames. Peristant images are managed through Wrap objects.
Before any drawing is done, files must be registered. Then load() must be called. After loading
has finished, each frame follows the cycle of clear(), drawing method calls, and render().
The parameters args in draw, pdraw, text, and ptext follow conventions described here
(excluding img): <http://www.w3schools.com/jsref/canvas_drawimage.asp>

**Parameters**

-   `ctx`  
-   `filenames`   (optional, default `[]`)
-   `extension`   (optional, default `''`)
-   `prefix`   (optional, default `''`)

## clear

Clears the canvas for a new frame.

## constructor

All params except the first are an optional initial call to registerFiles

**Parameters**

-   `ctx` **CanvasRenderingContext2D** 
-   `filenames`   (optional, default `[]`)
-   `extension` **[string]** extension common to all image names (optional, default `''`)
-   `prefix` **[string]** path and/or prefix common to all image names (optional, default `''`)

## draw

Prepares an image to be rendered that won't persist after clear().

**Parameters**

-   `name` **string** the filename of the registered image
-   `depth` **number** depth at which to draw (higher is drawn over lower)
-   `args` **numbers** position

Returns **Wrap** Wrap object for the image. Probably useless to save.

## getLoadProgress

Returns **number** -1: load has not yet started
		0-1: load is in progress
		1: load has completed

## isLoaded

Returns **boolean** whether the load has completed

## killAll

Kills all images and text.

## load

Begins loading the registered images.

## pdraw

Prepares an image to be rendered that will persist after clear() is called.

**Parameters**

-   `name` **string** the filename of the registered image
-   `depth` **number** depth at which to draw (higher is drawn over lower)
-   `args` **numbers** position

Returns **Wrap** Wrap object for the image

## ptext

Just like pdraw, but displays text.

**Parameters**

-   `txt` **string** Text to be drawn.
-   `depth` **number** depth at which to draw (higher is drawn over lower)
-   `args` **numbers** position

Returns **Wrap** Wrap object for the text

## registerFiles

Adds filenames to the roster of images.

**Parameters**

-   `ctx` **CanvasRenderingContext2D** 
-   `filenames`  
-   `extension` **[string]** extension common to all image names (optional, default `''`)
-   `prefix` **[string]** path and/or prefix common to all image names (optional, default `''`)

## render

Actually draws all images and text prepared by pdraw(), draw(), ptext(), and text().

## setText

Determines the properties of text drawn after the call.

**Parameters**

-   `props` **Object** may have keys font, color, align, and baseline.

## text

Just like draw, but displays text.

**Parameters**

-   `txt` **string** Text to be drawn.
-   `depth` **number** depth at which to draw (higher is drawn over lower)
-   `args` **numbers** position

Returns **Wrap** Wrap object for the text
