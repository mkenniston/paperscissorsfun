/* MIT License

Copyright (c) 2025 Michael S. Kenniston

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

// Define all parts of a library for generating graphical PDF files
// which are "kits" to build paper models.  For more info see
// http://paperscissorsfun.com

/*
    ==== POINT ====

The "Point" class encapsulates the representation of 2-D points using
two different coordinate systems:

- The "in" coordinates (X and Y) are the "world" coordinates, e.g. the
height and width of a door in feet/inches or meters.
To maintain consistency with mathematics, this uses standard Cartesian
coordinates:
    - The origin is at the lower left corner of the page.
    - X increases as you move toward the right edge of the page.
    - Y increases as you move toward the top edge of the page.

- The "out" coordinates (X and Y) are the "rendering" coordinates, i.e.
the place on the PDF page where the door appears, which is later the
place on a piece of paper where image of the door is printed.
The jsPdf library dictates that we use a different coordinate system,
similiar to rows and columns but measuring instead of counting:
    - The origin is at the upper left corner of the page.
    - X increases as you move toward the right edge of the page.
    - Y increases as you move toward the bottom edge of the page.

We always use the "in" coordinates when defining the sizes and positions
of various shapes which we want to appear in the final PDF.  The "out"
coordinates are used only at the point where we call jsPdf methods
to add things to the actual PDF file.

We use "lazy evaluation" to do the actual transformation of coordinates
between the two systems.  This is because when we are originally building
the data structure which represents our whole kit, we cannot decide
where on the page to put things until after we know what all the
components are.  (This gives us at least a chance of packing the different
components onto pages with some degree of efficiency.)
Rather than add the complexity of keeping track of all the Points that
exist, we just let each Point take care of transforming itself the
first time somebody asks for an "outX" or "outY".

The Point.move() method is for convenience:  it starts at the invoking
Point, then moves a specified distance and direction, and returns a
new Point at the ending location.  This is very handy for creating
polygons.

*/

class Point {
    constructor() {
        var inX, inY;
        if (arguments.length == 3) {
            // inches
            inX = arguments[1];
            inY = arguments[2];
        } else if (arguments.length == 5) {
            // feet-and-inches
            inX = arguments[1] * 12 + arguments[2];
            inY = arguments[3] * 12 + arguments[4];
        } else {
            throw new Error(`invalid ${arguments.length} args to ctor()`);
        }
        this._parent = arguments[0];
        this._inX = inX;
        this._inY = inY;
        this._outX = null;
        this._outY = null;
    }

    inX() {
        return this._inX;
    }

    inY() {
        return this._inY;
    }

    move() {
        var dx, dy;
        if (arguments.length == 2) {
            // inches
            dx = arguments[0];
            dy = arguments[1];
        } else if (arguments.length == 4) {
            // feet-and-inches
            dx = arguments[0] * 12 + arguments[1];
            dy = arguments[2] * 12 + arguments[3];
        } else {
            throw new Error(`invalid ${arguments.length} args to move()`);
        }
        return new Point(this._parent, this._inX + dx, this._inY + dy);
    }

    _applyTransforms() {
        if (this._outX == null) {
            // generate the "out" coordinates here
            this._outX = 111;  // FIX ME
            this._outY = 222;
        }
    }

    outX() {
        this._applyTransforms();
        return this._outX;
    }

    outY() {
        this._applyTransforms();
        return this._outY;
    }
}

/*
    ==== AFFINE_TRANSFORMATION ====

There is a whole set of classes which define the transformations we
might want to do on our coordinates.  The most obvious is that something
that (e.g. in N-scale) is 120 inches long in real life should be printed as
only 1 inch long.

We define subclasses for each of the types of transformations to make
the code clearer and to simplify the specification of parameters, since
each type uses a limited subset of all available value combinations.

*/

class AffineTransformation {
    constructor(matrix) {
        this._matrix = matrix;
    }
}

class Scale extends AffineTransformation {
    constructor() {
        super();
    }
}

class Translate extends AffineTransformation {
    constructor() {
        super();
    }
}

class Rotate extends AffineTransformation {
    constructor() {
        super();
    }
}

class Reflect extends AffineTransformation {
    constructor() {
        super();
    }
}

module.exports = {
    Point: Point,
    AffineTransformation: AffineTransformation,
    Scale: Scale,
    Translate: Translate,
    Rotate: Rotate,
    Reflect: Reflect,
};

