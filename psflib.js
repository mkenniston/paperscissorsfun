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

const bpjs = require('./bin-pack.js');
const { jsPDF } = require("jspdf");

/*
    ==== CONVERSION FACTORS ====

The ConversionFactors class is just a parking place where we provide
access to various conversion factors.  We put everything into one
class to avoid cluttering the name space.

*/

/*

Measurement units:

We include lots of measurement units, more than you might see any
need for.  That is to make the program as general as possible.  Although
the primary intended use is for model railraod buildings, it could
also be used to diagram molecules, print play money, or illustrate
aspects of astronomy.  In each case, we want to be able to use the
natural measurement units of the objects being modeled.

*/

const _LONG_PREFIX_TABLE = {  // for SI/metric inits
  quetta:	1e30,
  ronna:	1e27,
  yotta:	1e24,
  zetta:	1e21,
  exa:		1e18,
  peta:		1e15,
  tera:		1e12,
  giga:		1e9,
  mega:		1e6,
  kilo:		1e3,
  hecto:	1e2,
  deca:		1e1,
  '':		1e0,
  deci:		1e-1,
  centi:	1e-2,
  milli:	1e-3,
  micro:	1e-6,
  nano:		1e-9,
  pico:		1e-12,
  femto:	1e-15,
  atto:		1e-18,
  zepto:	1e-21,
  yocto:	1e-24,
  ronto:	1e-27,
  quecto:	1e-30,
};

const _SHORT_PREFIX_TABLE = {  // for SI/metric inits
  Q:	1e30,
  R:	1e27,
  Y:	1e24,
  Z:	1e21,
  E:	1e18,
  P:	1e15,
  T:	1e12,
  G:	1e9,
  M:	1e6,
  k:	1e3,
  h:	1e2,
  da:	1e1,
  '':	1e0,
  d:	1e-1,
  c:	1e-2,
  m:	1e-3,
  u:	1e-6,
  μ:	1e-6,
  n:	1e-9,
  p:	1e-12,
  f:	1e-15,
  a:	1e-18,
  z:	1e-21,
  y:	1e-24,
  r:	1e-27,
  q:	1e-30,
};

const _INCH = 0.0254;
const _FOOT = 12 * _INCH;
const _YARD = 3 * _FOOT;
const _PT = _INCH/72;
const _PICA = _INCH/6;
const _BARLEYCORN = _INCH/3;
const _CHAIN = 22 * _YARD;
const _FURLONG = 10 * _CHAIN;
const _ROD = 0.25 * _CHAIN;
const _LINK = 0.01 * _CHAIN;
const _CUBIT = 18 * _INCH;
const _FATHOM = 6 * _FOOT;
const _MILE = 5280 * _FOOT;
const _LEAGUE = 5280 * _YARD;
const _AU = 1.49597870700e+11;
const _PARSEC = 30856775814913673;
const _LY = 9460730472580.8;

const _UNIT_TABLE = {
  fermi:       1e-15,
  fermis:      1e-15,
  angstrom:    1e-10,
  angstroms:   1e-10,
  A:           1e-10,
  'Å':         1e-10,
  micron:      1e-6,
  microns:     1e-6,
  thou:        _INCH / 1000,
  mil:         _INCH / 1000,
  mils:        _INCH / 1000,
  point:       _PT,
  points:      _PT,
  pica:        _PICA,
  picas:       _PICA,
  inch:        _INCH,
  inches:      _INCH,
  in:          _INCH,
  '"':         _INCH,
  foot:        _FOOT,
  feet:        _FOOT,
  ft:          _FOOT,
  "'":         _FOOT,
  yard:        _YARD,
  yards:       _YARD,
  yd:          _YARD,
  barleycorn:  _BARLEYCORN,
  barleycorns: _BARLEYCORN,
  furlong:     _FURLONG,
  furlongs:    _FURLONG,
  chain:       _CHAIN,
  chains:      _CHAIN,
  rod:         _ROD,
  rods:        _ROD,
  link:        _LINK,
  links:       _LINK,
  cubit:       _CUBIT,
  cubits:      _CUBIT,
  fathom:      _FATHOM,
  fathoms:     _FATHOM,
  mile:        _MILE,
  miles:       _MILE,
  mi:          _MILE,
  league:      _LEAGUE,
  leagues:     _LEAGUE,
  "astronomical-unit": _AU,
  au:          _AU,
  parsec:      _PARSEC,
  parsecs:     _PARSEC,
  pc:          _PARSEC,
  kiloparsec:  1000 * _PARSEC,
  kiloparsecs: 1000 * _PARSEC,
  kpc:         1000 * _PARSEC,
  megaparsec:  1e6 * _PARSEC,
  megaparsecs: 1e6 * _PARSEC,
  Mpc:         1e6 * _PARSEC,
  'light-year':  _LY,
  'light-years': _LY,
  ly:           _LY,
  lyr:          _LY,
};


/*

Scales:

In the table below, note that in a model railroad context we are
talking about "scale", not about "track gauge".  Many gauges can
be modeled in a single scale, but that has nothing to do with making
model buildings so it has no relevance to this program.  We mention it
only to explain why we do NOT have entries for things like On3 or HOn3.
Also, some scale designations are used for multiple ratios, so this
table picks whatever seems to be the most common (with a bias toward US)
usage, e.g. using 1:450 for T-scale instead of 1:480 which is also used.
Another example is "G", which technically designates a gauge used with
many scales, so here we arbitrarily picked LGB usage.

These letter names are just a convenience, so if you want any others
you can force whatever you like by using numbers, e.g. "1:480".

If that's not enough, for more scales than you can shake a stick at, see:
  http://www.gardenstatecentral.com/scale_calc.html
  https://en.wikipedia.org/wiki/List_of_scale_model_sizes

*/

const _SCALE_TABLE = {
  "fullSize": {ratio: 1,    description: "full size"},
  F:          {ratio: 1/20.3, description: "F scale"},
  G:          {ratio: 1/22.5, description: "German LGB scale"},  // same as #3
  "#3":       {ratio: 1/22.5, description: "#3 Gauge"},  // same as G
  "#2":       {ratio: 1/29,   description: "#2 Gauge"},
  "#1":       {ratio: 1/32,   description: "#1 Gauge"},
  O:          {ratio: 1/48,   description: "O scale"},
  S:          {ratio: 1/64,   description: "S scale"},
  OO:         {ratio: 1/76.2, description: "OO scale"},
  HO:         {ratio: 1/87.1, description: "HO scale"},
  TT:         {ratio: 1/120,  description: "TT scale"},
  N:          {ratio: 1/160,  description: "N scale"},
  Z:          {ratio: 1/220,  description: "Z scale"},
  T:          {ratio: 1/450,  description: "T scale"},
};

class ConversionFactors {
  static unit(name) {
    // First we try all the customary US units, and any with irregular names.
    if (_UNIT_TABLE.hasOwnProperty(name)) {
      return _UNIT_TABLE[name];
    }

    // Now we try all the (many!) metric units.
    if (name.slice(-1) == 'm') {
      const prefix = name.slice(0, -1);
      if (_SHORT_PREFIX_TABLE.hasOwnProperty(prefix)) {
        return _SHORT_PREFIX_TABLE[prefix];
      }
    } else { // long-form
      const m = name.match(/met(er|re)s?$/);
      if (m) {
        const prefix = name.slice(0, m.index);
        if (_LONG_PREFIX_TABLE.hasOwnProperty(prefix)) {
          return _LONG_PREFIX_TABLE[prefix];
        }
      }
    }

    throw new Error(`invalid measurement unit "${name}"`);
  }

  static scale(name) {
    if (_SCALE_TABLE.hasOwnProperty(name)) {
      return _SCALE_TABLE[name];  // returns entry w/ ratio and description
    }
    const parts = name.split(':');
    if (parts.length != 2) {
      throw new Error(`invalid scale "${name}"`);
    }
    const numerator = Number(parts[0]);
    const denominator = Number(parts[1]);
    if (isNaN(numerator) |
        isNaN(denominator) |
        numerator == 0 |
        denominator == 0) {
      throw new Error(`invalid scale "${name}"`);
    }
    return {
      ratio: numerator/denominator,
      description: `Custom ${name} scale`,
    };
  }
}

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
coordinates (e.g. for creating points) as well as relative vector
coordinates (e.g. as the argument to DPair.plus()).

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

class Distance {
  constructor(input) {
    if (input instanceof Distance) {
      // clone the input
      this._value = input._value;
      return;
    }
    if (input == "0") {  // includes number 0
      this._value = 0;
      return;
    }
    if (input == undefined) {
      this._value = undefined;
      return;
    }
    if (typeof input != 'string') {
      throw new Error("Distance.constructor(): arg must be string or Distance");
    }

    const tokens = this._tokenize(input);
    if (tokens.length % 2 != 0) {
      throw new Error(`${input} has odd number of tokens`);
    }
    this._value = this._parse(tokens);
  }

  toString() {
    return `Distance("${this._value} m")`;
  }

  _tokenize(input) {
    // break the input into tokens
    const tokens = [];
    let index = 0;
    const regexes = {
      number: /^[0123456789\.\+\-]+/,
      units: /^[a-zμA-ZÅ\'\"\-]+/,
      whitespace: /^\s+/,
    };
    while (index < input.length) {
      let matched = false;
      for (const type in regexes) {
        const match = input.substring(index).match(regexes[type]);
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
          `Unexpected character at index ${index} of ${input}`);
      }
    }
    return tokens;
  }

  _parse(tokens) {
    // parse the tokens into an internal distance value

    var index = 0;
    let value = 0;
    while (index < tokens.length) {
      const num = Number(tokens[index].value);
      index += 1;
      value += num * ConversionFactors.unit(tokens[index].value);
      index += 1;
    }
    return value;
  }

  plus(addend) {
    addend = distancify(addend);
    const result = new Distance(this);
    result._value += addend._value;
    return result;
  }

  minus(subtrahend) {
    subtrahend = distancify(subtrahend);
    const result = new Distance(this);
    result._value -= subtrahend._value;
    return result;
  }

  times(factor) {
    if (typeof factor == 'number') {
      const result = new Distance(this);
      result._value *= factor;
      return result;
    }
    throw new Error(`Distance.times() factor is ${typeof factor}, but must be number`);
  }

  dividedBy(divisor) {
    if (typeof divisor == 'number') {
      const result = new Distance(this);
      result._value /= divisor;
      return result;
    }
    divisor = distancify(divisor);
    return this._value / divisor._value;  // dimensionless ratio
  }
}

function distancify(arg) {
  if (arg instanceof Distance) {
    return arg;
  }
  if (typeof arg == 'string' | arg == 0) {
    return new Distance(arg);
  }
  throw new Error(`found ${arg} where string or Distance expected`);
}

function numerify(arg) { // used ONLY internally, not part of API
  if (typeof arg == 'number') {
    return arg;
  }
  if (arg instanceof Distance) {
    return arg._value;
  }
  if (typeof arg == 'string') {
    return (new Distance(arg))._value;
  }
  throw new Error(`found ${arg} where number, Distance, or string expected`);
}

/*
    ==== DISTANCE PAIR ====

The "DistancePair" class is used so much that we abbreviate it "DPair".

The "DPair" class is just a pair of Distance objects.  They are used for
three distinct purposes:
  (1) Represent a point, using standard Cartesian coordinates.  This
    is the most common use.
  (2) Represent a vector (direction and length).  For example, you
    can add a vector to a point to get a new point.  You can also
    add two vectors with the intuitive result.  (But note that
    a point "P" is really just the place that the vector "P" ends up
    when it starts from the origin, so the two uses are closely related.)
  (3) Represent a size.
To match the usual mathematical convention, "X" (width) always comes first,
followed by "Y" (height).

We use two different 2-D coordinate systems:

- The "in" coordinates (X and Y) are the "world" coordinates, e.g. the
width and height of a real-world door in feet/inches or meters.
To maintain consistency with mathematics, this uses standard Cartesian
coordinates:
  - The origin is at the lower left corner of the page.
  - X increases as you move toward the right edge of the page.
  - Y increases as you move toward the top edge of the page.

- The "out" coordinates (X and Y) are the "rendering" coordinates, i.e.
the place on the PDF page where the door appears, which is later the
place on a piece of paper where the image of the door is printed.
The jsPdf library dictates that we use a different coordinate system,
similiar to rows and columns but measuring instead of counting:
  - The origin is at the upper left corner of the page.
  - X increases as you move toward the right edge of the page.
  - Y increases as you move toward the bottom edge of the page.

We always use the "in" coordinates when defining the sizes and positions
of various shapes which we want to appear in the final PDF.

We use "lazy evaluation" to do the actual transformation of coordinates
between the two systems.  This is because when we are originally building
the data structure which represents our whole kit, we cannot decide
where on the page to put things until after we know what all the
components are.  (This gives us at least a chance of packing the different
components onto pages with some degree of efficiency.)

The DPair.plus() method treats its argument as a vector which is to be
added to a point, i.e. it means "move": start at the invoking
point, then move a specified distance and direction, and return a
new point at the ending location.  This can be very handy for creating
polygons.

*/

class DistancePair {
  constructor(x, y) {
    this._x = distancify(x);
    this._y = distancify(y);
  }

  toString() {
    return `DistancePair(${this._x.toString()}, ${this._y.toString()})`;
  }

  x() {
    return this._x;
  }

  y() {
    return this._y;
  }

  plus() {
    const delta = dPairify.apply(this, arguments);
    return new DistancePair(
      this._x.plus(delta._x),
      this._y.plus(delta._y));
  }

  minus() {
    const delta = dPairify.apply(this, arguments);
    return new DistancePair(
      this._x.minus(delta._x),
      this._y.minus(delta._y));
  }

  times(factor) {
    if (typeof factor != 'number') {
      throw new Error(
        `Distance.times(): found ${factor} where number expected`);
    }
    return new DistancePair(
      this._x.times(factor),
      this._y.times(factor));
  }

  dividedBy(divisor) {
    if (typeof divisor != 'number') {
      throw new Error(
        `Distance.dividedBy(): found ${divisor} where number expected`);
    }
    return new DistancePair(
      this._x.dividedBy(divisor),
      this._y.dividedBy(divisor));
  }
}

const DPair = DistancePair;  // to make code more concise and save typing

function dPairify() {
  const numArgs = arguments.length;
  if (numArgs == 1) {
    const dp = arguments[0];
    if (dp instanceof DistancePair) {
      return dp;
    } else {
      throw new Error(`found ${dp} where DistancePair expected`);
    }
  } else if (numArgs == 2) {
    const x = arguments[0];
    const y = arguments[1];
    return new DPair(x, y);
  }
  throw new Error(`${numArgs} args found where 1 DPair or 2 Distances needed`);
}

function distanceBetween(p1, p2) {
  const x1 = numerify(p1.x());
  const x2 = numerify(p2.x());
  const y1 = numerify(p1.y());
  const y2 = numerify(p2.y());
  const dist = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
  return new Distance(`${dist} m`);
}

/*
    ==== PIECE ====

The Piece class is really just a wrapper around a top-level Component, i.e.
something which can be shuffled around on a page to use the page more
efficiently.  We put this functionality in its own class instead of just
incorporating it into Component for two reasons:
(1) Conceptual clarity -- Components which are not top-level don't
need the extra stuff.
(2) Clean interface -- because Piece interfaces with the external bin-sort
library, it has to deal with measurements in "bare" Numbers (not Distances),
and we don't want to pollute the library API (and the rest of the code)
with bare Numbers, nor with the details of the bin-pack record formats.

*/

class Piece {
  constructor(comp) {
    // These fields are required or produced by the bin-pack code.
    // We omit leading underscores because the bin-pack lib wants it that way.
    this.width = numerify(comp.getWidth());
    this.height = numerify(comp.getHeight());
    this.x = null;  // gets filled in by the bin-packer
    this.y = null;  // gets filled in by the bin-packer
    this.area = this.width * this.height;
    this.component = comp;
  }

  toString() {
    return `Piece(${this.component})`;
  }

  static fromBinPackOutput(record) {
    const piece = record.datum;
    piece.x = distancify(`${record.x} m`);
    piece.y = distancify(`${record.y} m`);
    return piece;
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
    if (matrix.length != 3 | matrix[0].length != 3 |
        matrix[1].length != 3 | matrix[2].length != 3) {
      throw new Error(
        "AffineTransformation.constructor: invalid matrix shape");
    }
    this._matrix = matrix;
  }

  toString() {
    return `AffineTransformation(${this._matrix})`;
  }

  /*
    Because we know that all matrixes start with final row [0,0,1] and
    all vectors are padded to [x,y,1], we could eliminate about
    half of all the multiplications in apply() and compose().
    That would be a tiny bit faster, but it would make the code much
    harder to read, understand, and verify, so we don't do that.
  */

  apply(pt) {
    const a = this._matrix;
    const b = [numerify(pt.x()), numerify(pt.y()), 1];
    const result =
      [ a[0][0]*b[0] + a[0][1]*b[1] + a[0][2]*b[2],
        a[1][0]*b[0] + a[1][1]*b[1] + a[1][2]*b[2],
        a[2][0]*b[0] + a[2][1]*b[1] + a[2][2]*b[2] ];
    return {x: result[0], y: result[1]};
  }

  compose(xform2) {
    if (! (xform2 instanceof AffineTransformation)) {
      throw new Error('AffineTransformation.compose needs another ' +
                      'AffineTransformation');
    }
    const a = this._matrix;
    const b = xform2._matrix;
    const result =
      [
        [ a[0][0]*b[0][0] + a[0][1]*b[1][0] + a[0][2]*b[2][0],
          a[0][0]*b[0][1] + a[0][1]*b[1][1] + a[0][2]*b[2][1],
          a[0][0]*b[0][2] + a[0][1]*b[1][2] + a[0][2]*b[2][2],
        ],
        [ a[1][0]*b[0][0] + a[1][1]*b[1][0] + a[1][2]*b[2][0],
          a[1][0]*b[0][1] + a[1][1]*b[1][1] + a[1][2]*b[2][1],
          a[1][0]*b[0][2] + a[1][1]*b[1][2] + a[1][2]*b[2][2],
        ],
        [ a[2][0]*b[0][0] + a[2][1]*b[1][0] + a[2][2]*b[2][0],
          a[2][0]*b[0][1] + a[2][1]*b[1][1] + a[2][2]*b[2][1],
          a[2][0]*b[0][2] + a[2][1]*b[1][2] + a[2][2]*b[2][2],
        ],
      ];
    return new AffineTransformation(result);
  }
}

// A mathematician would call Resize "Scale", but we already use
// that term for things like "HO scale".  Calling this class "Resize"
// still has a clear, accurate meaning but avoids confusion.

class Resize extends AffineTransformation {
  constructor(factor) {
    super([[factor, 0, 0], [0, factor, 0], [0, 0, 1]]);
  }
}

class Identity extends AffineTransformation {
  constructor() {
    super([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
  }
}

class Translate extends AffineTransformation {
  constructor(dx, dy) {
    dx = numerify(dx);
    dy = numerify(dy);
    super([[1, 0, dx], [0, 1, dy], [0, 0, 1]]);
  }
}

const ROT90 = 90;
const ROT180 = 180;
const ROT270 = 270;

class Rotate extends AffineTransformation {
  constructor(which) {
    var m;
    if (which == ROT90) {
      m = [[0, -1, 0], [1, 0, 0], [0, 0, 1]];
    } else if (which == ROT180) {
      m = [[-1, 0, 0], [0, -1, 0], [0, 0, 1]];
    } else if (which == ROT270) {
      m = [[0, 1, 0], [-1, 0, 0], [0, 0, 1]];
    } else {
      throw new Error(`invalid rotation ${which}`);
    }
    super(m);
  }
}

class ReflectAroundXAxis extends AffineTransformation {
  constructor() {
    super([[1, 0, 0], [0, -1, 0], [0, 0, 1]]);
  }
}

/*
    ==== COMPONENT ====

The Component class is intended to be used as a parent class.  Each type
of separate part (or sub-part) of a model should have its own class which
extends Component.  For example you can have a Wall class used to create
multiple walls, and a different Roof class to draw a roof.  You will
need to decide which things are sufficiently similar to be handled by a
single class and which are sufficiently different to require their own
class -- that is a design judgement; the library doesn't care.

Note that only the methods listed below (constructor, getWidth, getHeight,
and render), and marked "OVERRIDE this" in the code, should be overridden.
The other Component methods are for internal use only.

-- Constructor --

Each child class needs its own constructor, whose primary jobs are:

(1) Call the parent constructor with super().

(2) Set up the geometry, i.e. use the options as appropriate to figure
out where the interesting points are.  Stash all the points in
instance variables of the Component object; by convention we put
all that stuff in "this._geometry".

(3) Figure out the total width and height of the component.  These are
needed later by getWidth() and getHeight(), which in turn are used to
figure out what page to put each Piece (which is a component) on and
where on the page it will fit.

(4) Create and position any (optional) sub-components.

In other words, the constructor does pretty much everything
except for the actual drawing.  (That final step must be deferred
until the Pieces are all sized and positioned onto pages.)
Since the logic may be long and complex, it is perfectly reasonable
to have the constructor call helper methods to do most of the work.

-- getWidth and getHeight --

The getWidth() and getHeight() methods should also be overrideen by
each child class.  These expose the results of any computation
done by the constructor to determine the overall sizes of things.

-- render --

The "render()" method should also be overridden.  This is where
the code should actually draw lines, paint colors, etc.  This is
typically relatively straightforward, because all the interesting
information is already stored in "this._geometry".

A component's render method need only draw the graphic elements at
that level, i.e. it need NOT draw the children (subComponents).  The
library will automatically call render() for each subComponent later.
That means children are drawn "on top of" parents, so for example
when you draw a wall you don't need to leave "holes" for the 
subComponent windows to fit into.

Each component must be created and drawn as if it has its own
coordinate system, with the component representation drawn in the
first quadrant (positive x and y) and nestled against the origin.
For example, when you are rendering a window, you put the lower
left corner of the window at (0, 0) regardless of where the window is
actually going to end up on the containing wall or on the physical page.
All that mapping is handled automatically by the library.

*/

function mergeDicts(baseDict, newEntries) {
  for (const key in newEntries) {
    if (newEntries.hasOwnProperty(key)) {
      baseDict[key] = newEntries[key];
    }
  }
}

class Component {
  constructor(oldOptions, newOptions) {  // OVERRIDE this, but call super().
    this._options = {};
    mergeDicts(this._options, oldOptions);
    mergeDicts(this._options, newOptions);
    this._width = null;
    this._height = null;
    this._shift = null;
    this._subComponents = [];
    this._geometry = {};

    // When overriding:
    // Do all computations, set up the geometry, compute size of component,
    // create any subComponents and position them in the parent.
    // Do NOT render anything yet.
  }

  toString() {
    return `${this.constructor.name}()`;
  }

  getWidth() {  // OVERRIDE this.
    throw new Error('"Component.getWidth()" must be overridden.');
  }

  getHeight() { // OVERRIDE this.
    throw new Error('"Component.getHeight()" must be overridden.');
  }

  set(optionName, optionValue) {
    this._options[optionName] = optionValue;
  }

  get(optionName) {
    return this._options[optionName];
  }

  _setShift(position) {
    this._shift = new Translate(position.x(), position.y());
  }

  addSubComponent(subComponent, position) {
    subComponent._setShift(position);
    this._subComponents.push(subComponent);
    // someday add code here to verify that subcomponent bounding box
    // fits inside parent component bounding box
  }

  render(/*pen*/) {  // OVERRIDE this.
    throw new Error('"Component.render(pen)" must be overridden.');
  }
}

/*
    ==== PAGE ====

*/

class Page {
  constructor() {
    this._positionedPieceList = [];
  }

  toString() {
    return "Page()";
  }

  addPositionedPiece(piece) {
    this._positionedPieceList.push(piece);
  }

  allPieces() {
    return this._positionedPieceList;
  }
}

/*
    ==== DRAWING PEN ====

When you want to actually lay down digital ink, you use a DrawingPen
to add the ink to the pdf page(s).

There is a new DrawingPen object created for each Component because
each Component has its own xform (AffineTransformation).

A DrawingPen is basically a wrapper around the jsPDF methods, and the
pen is where the transformation matrix is finally applied to the
actual coordinates.  This matrix contains all the information needed
about the shapes and sizes of graphics in a Comnponent, the locations
of subComponents, the scaling necessary (O, HO, N, Z, etc.), the
conversion from internal units ("m") to pdf units ("mm"), and the
inversion of the Y-axis to make Y go up instead of down.
The beauty of the matrix is that everything is wrapped into a single
(matrix X vector) multiplication.

*/

class DrawingPen {
  constructor(pdf, xform) {
    this._pdf = pdf;
    this._xform = xform;
  }

  set(props) {  // maybe fold this into ctor
    if (props.hasOwnProperty("fillColor")) {
      this._pdf.setFillColor(props.fillColor);
    }
    if (props.hasOwnProperty("drawColor")) {
      this._pdf.setDrawColor(props.drawColor);
    }
  }

  openPath(points) {
    if (points.length < 2) {
      throw new Error("DrawingPen.openPath needs at least 2 points");
    }
    this._lines(points, 'S', false);
  }

  polygon(points, style) {
    if (points.length < 2) {
      throw new Error("DrawingPen.polygon needs at least 2 points");
    }
    if (style == "stroke") {
      this._lines(points, 'S', true);
    } else if (style == "fill") {
      this._lines(points, 'F', true);
    } else if (style == "fillAndStroke") {
      this._lines(points, 'FD', true);
    } else {
      throw new Error(`invalid style ${style} in DrawingPen.polygon()`);
    }
  }

  _lines(points, style, closed) {
    // convert from world coordinates to PDF coordinates
    const pdfPoints = [];
    for (const point of points) {
      pdfPoints.push(this._xform.apply(point));
    }
    const x = pdfPoints[0].x;
    const y = pdfPoints[0].y;
    const pdfDiffs = [];
    for (let i = 1; i < points.length; i++ ) {
      // jsPDF wants deltas, not points
      const cur = pdfPoints[i];
      const prev = pdfPoints[i-1];
      pdfDiffs.push([cur.x - prev.x, cur.y - prev.y]);
    }
    this._pdf.lines(pdfDiffs, x, y, null, style, closed);
  }
}

/*
    ==== KIT ====

A "kit" is a collection of "Pieces" (which are just top-level Components)
which are all printed on the same set of pages.  The class "Kit" is
intended as a parent class, for example:

class SimpleHouse extends Kit {
  getDefaultOptions() {
    return {
      houseWidth: "20 ft",
      houseDepth: "35 ft",
      roofPitch:  0.5,
    };
  }

  build() {
    ... create all the Components here and add each to this Kit ...
  }
}

*/

class Kit {
  constructor() {  // This should NOT be overridden.
    // A few options are essential for internal needs.
    this._options = {
      format: "letter",
      scale:  "HO",
      pdfFileName: `${this.constructor.name}.pdf`,
    };
    mergeDicts(this._options, this.getDefaultOptions());

    // For other valid formats, see:
    // https://github.com/parallax/jsPDF/blob/ddbfc0f0250ca908f8061a72fa057116b7613e78/jspdf.js#L59
  }

  toString() {  // This should NOT be overridden.
    return `${this.constructor.name}()`;
  }

  // "getDefaultOptions" returns a list of all available user-selectable
  // options and their default values.  This is needed when using the
  // web interface, so the browser code can set up selection
  // boxes/pulldowns/checkboxes.  When running from node, this method
  // is called automatically by the constructor.

  getDefaultOptions() {  // OVERRIDE this.
    return {};
  }

  set(optionName, optionValue) {
    this._options[optionName] = optionValue;
  }

  get(optionName) {
    return this._options[optionName];
  }

  generate(userOptions) {  // This should NOT be overridden.
    mergeDicts(this._options, userOptions);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: this._options.format,
    });
    this._pdf = pdf;
    // convert PDF "mm" to world "m"
    const ratio = ConversionFactors.scale(this._options.scale).ratio;
    const adjust = 0.001 / ratio;
 
    // computer size of page in real-world meters
    const rawWidth = pdf.internal.pageSize.getWidth();  // in PDF "mm"
    this._pageWidth = new Distance(`${rawWidth * adjust} m`);  // in world "m"
    const rawHeight = pdf.internal.pageSize.getHeight();  // in PDF "mm"
    this._pageHeight = new Distance(`${rawHeight * adjust} m`);  // in world "m"

    // invert Y-axis
    const flip = new ReflectAroundXAxis();
    // slide from 4th quandrant back to 1st
    const shift = new Translate(0, this._pageHeight);
    // convert world "m" to PDF "mm"
    const shrink = new Resize(1000 * ratio);
    const masterXform = shrink.compose(shift).compose(flip);

    this._pieceList = [];
    this.build(this._options);
    this._pageList = [];
    this.pack();
    this.render(masterXform, this._options.pdfFileName);
  }

  addPiece(comp) {  // This should NOT be overridden.
    this._pieceList.push(new Piece(comp));
  }

  build() {  // OVERRIDE this.
    throw new Error('"Kit.build()" must be overridden.');
  }

  pack() { // This should NOT be overridden.
    var notYetPacked = this._pieceList;
    while (notYetPacked.length > 0) {
      var bp = bpjs.BinPack();
      bp.binWidth(numerify(this._pageWidth));
      bp.binHeight(numerify(this._pageHeight));
      bp.sort((a, b) => b.area - a.area);
      bp.addAll(notYetPacked);
      if (bp.positioned.length == 0) {
        throw new Error("at least one piece is too big to fit on page");
      }
      const page = new Page();
      for (const record of bp.positioned) {
        const piece = Piece.fromBinPackOutput(record);
        piece._position = dPairify(
          distancify(`${record.x} m`),
          distancify(`${record.y} m`));
        page.addPositionedPiece(piece);
      }
      this._pageList.push(page);
      notYetPacked = [];
      for (const record of bp.unpositioned) {
        const piece = Piece.fromBinPackOutput(record);
        notYetPacked.push(piece);
      }
    }
  }

  render(xform, pdfFileName) {  // This should NOT be overridden.
    const timestamp = (new Date()).toUTCString();
    this._pdf.createAnnotation({
      type: 'text',
      title: 'Origination Data',
      bounds: {x: 1, y: 1, w: 50, h: 50 },
      contents: `File created at ${timestamp}\n` +
        `with class ${this.constructor.name} using these options:\n` +
        JSON.stringify(this._options, null, 2) +
        '\nSee http://paperscissorsfun.com for more information.',
      color: "#FF0000",
      open: false // Set to true to open the pop-up by default
    });
    var first = true;
    for (const page of this._pageList) {
      if (first) {
        first = false;
      } else {
        this._pdf.addPage(this._options.format, "portrait");
      }
      for (const piece of page.allPieces()) {
        const component = piece.component;
        component._setShift(piece._position);
        this._renderTreeNodes(this._pdf, xform, component);
      }
    }
    this._pdf.save(pdfFileName);
  }

  _renderTreeNodes(pdf, xform, component) {
    const currentXform = xform.compose(component._shift);
    component.render(new DrawingPen(pdf, currentXform));
    for (const subComponent of component._subComponents) {
      this._renderTreeNodes(pdf, currentXform, subComponent);
    }
  }
}

/*
     ==== EXPORTS ====
*/

module.exports = {
  Distance,
  distancify,
  numerify,
  dPairify,
  distanceBetween,
  ConversionFactors,
  DPair,
  AffineTransformation,
  Resize,
  Identity,
  Translate,
  Rotate,
  ROT90,
  ROT180,
  ROT270,
  ReflectAroundXAxis,
  Component,
  Page,
  Kit,
};

