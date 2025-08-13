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
    ==== DISTANCE ====

The Distance class encapsulates the conversion of various units of
distance (e.g. US Customary and SI/metric) into the single standard
unit used internally by psflib.  (The standard unit happens to be "meter",
but that is hidden inside the class.)  Having a specific class for
distances also reinforces the conceptual distinction between dimensioned
quantities like "12 feet" and dimensionless quantities like "12".
It also enables code that manipulates distances to use "instanceof Distance"
to verify that every distance has been properly converted, thus detecting
accidental attempts to use an unconverted (and dimensionless) Number object.
Note that distances can be used to specify both absolute position
coordinates (e.g. for the Point constructor) as well as relative vector
coordinates (e.g. for Point.move()).

Since different people in different countries and different contexts prefer
to specify distances using different units and different notations, it is
very desirable for the Distance() constructor and other methods to
accept their argument in a natural, uniform, easy-to-read way.  Rather
than inventing complex new syntax, this implementation simply uses a
string as the argument.  The allowed format is fairly flexible, so for
example the following are all acceptable inputs:

  "1 ft"       // double-quotes work fine
  '1 ft'       // single-quotes also work fine
  "1 ft 2 in"  // multiple parts will be added together
  "1 ft 0 in"  // zero is allowed
  "1ft2in"     // spacing is ignored
  `1' 2"`      // the usual abbreviation, note the use of backticks
               // to avoid any need for escaping ' or "
  `${len} ft`  // backticks also allow variable interpolation
  "4 m 23 cm"  // metric is supported
  "4.56 feet"  // decimal values are allowed
  "3 meters"   // plural units are allowed
  "3 metre"    // alternate spellings are allowed
  "-5 m"       // negative values are allowed
  "+3 cm"      // a plus sign is redundant but allowed

Whenever any method takes a Distance object as a paramter, you can also
just pass a string.  The method will still build a Distance object out of
that string, but it keeps your code more concise and easier to read.

*/

const INCH = 0.0254;
const FOOT = 0.3048;
const YARD = 0.9144;

const MEASUREMENT_UNITS = {
  'km':          1000,
  'kilometer':   1000,
  'kilometers':  1000,
  'kilometre':   1000,
  'kilometres':  1000,
  'm':           1,
  'meter':       1,
  'meters':      1,
  'metre':       1,
  'metres':      1,
  'cm':          0.01,
  'centimeter':  0.01,
  'centimeters': 0.01,
  'centimetre':  0.01,
  'centimetres': 0.01,
  'mm':          0.001,
  'millimeter':  0.001,
  'millimeters': 0.001,
  'millimetre':  0.001,
  'millimetres': 0.001,
  'inch':        INCH,
  'inches':      INCH,
  'in':          INCH,
  '"':           INCH,
  'foot':        FOOT,
  'feet':        FOOT,
  'ft':          FOOT,
  '\'':          FOOT,
  'yard':        YARD,
  'yards':       YARD,
  'yd':          YARD,
  'barleycorn':  0.00846667,
  'barleycorns': 0.00846667,
  'furlong':     201.168,
  'furlongs':    201.168,
  'chain':       20.1168,
  'chains':      20.1168,
  'rod':         5.0292,
  'rods':        5.0292,
  'link':        0.201,
  'links':       0.201,
  'cubit':       0.4572,
  'cubits':      0.4572,
  'fathom':      1.8288,
  'fathoms':     1.8288,
  'league':      5556,
  'leagues':     5556,
  };

const SCALE_FACTORS = {
  "1:1": {ratio: 1,    description: "full size"},
  "G":   {ratio: 22.5, description: "German LGB scale"},
  "O":   {ratio: 48,   description: "O scale"},
  "S":   {ratio: 64,   description: "S scale"},
  "HO":  {ratio: 87.1, description: "HO scale"},
  "TT":  {ratio: 120,  description: "TT scale"},
  "N":   {ratio: 160,  description: "N scale"},
  "Z":   {ratio: 220,  description: "Z scale"},
  "T":   {ratio: 450,  description: "T scale"},
};

class Distance {
  constructor(input) {
    if (input instanceof Distance) {
      // clone the input
      this._value = input._value;
      return;
    }
    if (input == undefined) {
      // create an undefined Distance (mostly used inside class methods)
      this._value = undefined;
      return;
    }
    if ( typeof input != 'string') {
      throw new Error("Distance.constructor(): arg must be string or Distance");
    }

    const tokens = this._tokenize(input);
    if (tokens.length % 2 != 0) {
      throw new Error(`${input} has odd number of tokens`);
    }
    this._value = this._parse(tokens);
  }

  _tokenize(input) {
    // break the input into tokens
    const stringRep = input.toLowerCase();
    const tokens = [];
    let index = 0;
    const regexes = {
      number: /^[0123456789\.\+\-]+/,
      units: /^[a-z\'\"]+/,
      whitespace: /^\s+/,
    };
    while (index < stringRep.length) {
      let matched = false;
      for (const type in regexes) {
        const match = stringRep.substring(index).match(regexes[type]);
        if (match) {
          if (type !== 'whitespace') { // Ignore whitespace tokens
            tokens.push({ type: type, value: match[0] });
          }
          index += match[0].length;
          matched = true;
          break;
        }
      }
      if (! matched) {
        throw new Error('Distance.constructor(): ' +
          `Unexpected character at index ${index}: ${stringRep[index]}`);
      }
    }
    return tokens;
  }

  _parse(tokens) {
    // parse the tokens into an internal distance value

    var index = 0;
    let value = 0;
    while (index < tokens.length) {
      const num = tokens[index].value;
      index += 1;
      const unit = tokens[index].value;
      index += 1;
      if (! MEASUREMENT_UNITS.hasOwnProperty(unit)) {
        throw new Error(`invalid measurement unit ${unit}`);
      }
      value += Number(num) * MEASUREMENT_UNITS[unit];
    }
    return value;
  }

  plus(addend) {
    addend = distantize(addend);
    const result = new Distance(this);
    result._value += addend._value;
    return result;
  }

  times(multiplier) {
    if (typeof multiplier != 'number') {
      throw new Error("Distance.times() arg must be number");
    }
    const result = new Distance(this);
    result._value *= multiplier;
    return result;
  }
}

function distantize(arg) {
  if (typeof arg == 'string') {
    return new Distance(arg);
  }
  if (arg instanceof Distance) {
    return arg;
  }
  throw new Error(`found ${arg} where string or Distance expected`);
}

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
  constructor(parent, inX, inY) {
    this._parent = parent;
    this._inX = distantize(inX);
    this._inY = distantize(inY);
    this._outX = null;
    this._outY = null;
  }

  inX() {
    return this._inX;
  }

  inY() {
    return this._inY;
  }

  move(dx, dy) {
    return new Point(this._parent, this._inX.plus(dx), this._inY.plus(dy));
  }

  _applyTransforms() {
    if (this._outX == null) {
      // generate the "out" coordinates here
      this._outX = new Distance("111 m");  // FIX ME
      this._outY = new Distance("222 m");
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
  Distance: Distance,
  SCALE_FACTORS: SCALE_FACTORS,
  Point: Point,
  AffineTransformation: AffineTransformation,
  Scale: Scale,
  Translate: Translate,
  Rotate: Rotate,
  Reflect: Reflect,
};

