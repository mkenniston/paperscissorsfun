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
    ==== CONVERSION FACTOR ====

The ConversionFactor class is just a parking place for static lookup tables.
We put them into a class rather than an object, because that way all the
tables are in one place and we avoid name pollution.
(In fact, we never instantiate the class at all.)

*/

const _M = 1;
const _KM = 1000 * _M;
const _CM = 0.01 * _M;
const _MM = 0.001 * _M;

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
const _LEAGUE = 5280 * _YARD;

class ConversionFactor {
  // used only to hold "static const" lookup tables
}

Object.defineProperty(ConversionFactor, 'UNIT', {
  writable: false,
  configurable: false,
  enumerable: true,
  value: {
    km:          _KM,
    kilometer:   _KM,
    kilometers:  _KM,
    kilometre:   _KM,
    kilometres:  _KM,
    m:           _M,
    meter:       _M,
    meters:      _M,
    metre:       _M,
    metres:      _M,
    cm:          _CM,
    centimeter:  _CM,
    centimeters: _CM,
    centimetre:  _CM,
    centimetres: _CM,
    mm:          _MM,
    millimeter:  _MM,
    millimeters: _MM,
    millimetre:  _MM,
    millimetres: _MM,

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
    league:      _LEAGUE,
    leagues:     _LEAGUE,
  }
});

/*

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
If you want any others you can force whatever you like by using numbers,
e.g. "1:480".

If that's not enough, for more scales than you can shake a stick at, see:
  http://www.gardenstatecentral.com/scale_calc.html
  https://en.wikipedia.org/wiki/List_of_scale_model_sizes

*/

Object.defineProperty(ConversionFactor, 'SCALE', {
  writable: false,
  configurable: false,
  enumerable: true,
  value: {
    "1:1": {ratio: 1,    description: "full size"},
    F:     {ratio: 20.3, description: "F scale"},
    G:     {ratio: 22.5, description: "German LGB scale"},  // same as #3
    "#3":  {ratio: 22.5, description: "#3 Gauge"},  // same as G
    "#2":  {ratio: 29,   description: "#2 Gauge"},
    "#1":  {ratio: 32,   description: "#1 Gauge"},
    O:     {ratio: 48,   description: "O scale"},
    S:     {ratio: 64,   description: "S scale"},
    OO:    {ratio: 76.2, description: "OO scale"},
    HO:    {ratio: 87.1, description: "HO scale"},
    TT:    {ratio: 120,  description: "TT scale"},
    N:     {ratio: 160,  description: "N scale"},
    Z:     {ratio: 220,  description: "Z scale"},
    T:     {ratio: 450,  description: "T scale"},
  }
});

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
      if (! ConversionFactor.UNIT.hasOwnProperty(unit)) {
        throw new Error(`invalid measurement unit ${unit}`);
      }
      value += Number(num) * ConversionFactor.UNIT[unit];
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
    throw new Error("Distance.times() factor must be number");
  }

  divideBy(divisor) {
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

  divideBy(divisor) {
    if (typeof divisor != 'number') {
      throw new Error(
        `Distance.divideBy(): found ${divisor} where number expected`);
    }
    return new DistancePair(
      this._x.divideBy(divisor),
      this._y.divideBy(divisor));
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
    this.width = distancify(comp.getWidth())._value;
    this.height = distancify(comp.getHeight())._value;
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
    const b = [pt.x()._value, pt.y()._value, 1];
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

class Scale extends AffineTransformation {
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
    dx = distancify(dx);
    dy = distancify(dy);
    super([[1, 0, dx._value], [0, 1, dy._value], [0, 0, 1]]);
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
      m = [[0, 1, 0], [-1, 0, 0], [0, 0, 0]];
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

The Component class is intended to be used as a parent class.
Each separate part (or sub-part) of a model should have its own
class which extends Component.

The "build()" method should be overridden by each child class.
It is used only to figure out the size of each component, so that
the library can figure out what page to put it on and where on the
page it will fit.  The build() method should also create any
sub-components, so that they can be found later.

The "render()" method should also be overridden.  This is where
the code should actually draw lines, paint colors, etc.  This need
only be done for top-level components, as the library will automatially
call "render()" on all the sub-components.

Each component must be created and drawn as if it has its own
coordinate system, with the component representation drawn in the
first quadrant (positive x and y) and nestled against the origin.
The library will automatically take care of mapping as needed.

*/

class Component {
  constructor() {  // OVERRIDE this.
    this._width = null;
    this._height = null;
  }

  toString() {  // This may optionally be overridden.
    return "Component()";
  }

  getWidth() {  // This should NOT be overridden.
    return this._width;
  }

  getHeight() {  // This should NOT be overridden.
    return this._height;
  }

  build() {  // OVERRIDE this.
    // compute size and store it
    // create any subcomponents, and position them in parents
  }

  render(board, xform) {  // OVERRIDE this.
    xform = xform; // shush jshint
    // draw all the shapes (but not the sub-components)
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
    ==== DRAWING BOARD ====

A DrawingBoard is basically a wrapper around the jsPDF object, with
some extra useful information tagging along for the ride.

Note the use of the factory method to create DrawingPen objects.  There is
only single DrawingBoard object for an entire Kit, but there is a
new DrawingPen object created for each Component because each Component
has its own xform (AffineTransformation).

*/

class DrawingBoard {
  constructor(pdf) {
    this._pdf = pdf;
  }

  getPen(xform) {
    return new DrawingPen(this, xform);
  }
}

/*
    ==== DRAWING PEN ====

When you want to actually lay down digital ink, you use a DrawingPen
to add the ink to a DrawingBoard.

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
  constructor(board, xform) {
    this._board = board;
    this._xform = xform;
  }

  set(props) {
    if (props.hasOwnProperty("fillColor")) {
      this._board._pdf.setFillColor(props.fillColor);
    }
    if (props.hasOwnProperty("drawColor")) {
      this._board._pdf.setDrawColor(props.drawColor);
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
    const pdf = this._board._pdf;
    pdf.lines(pdfDiffs, x, y, null, style, closed);
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

  generate() {
    ... create all the Components here ...
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
    Object.assign(this._options, this.getDefaultOptions());

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
  // can be skipped.

  getDefaultOptions() {  // OVERRIDE this.
    return {};
  }

  getOptionValue(key) {  // This should NOT be overriden.
    return this._options[key];
  }

  generate(options) {  // This should NOT be overridden.
    for (const key in options) {
      if (options.hasOwnProperty(key)) {
        this._options[key] = options[key];
      }
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: this._options.format,
    });
    this._pdf = pdf;
    // convert PDF "mm" to world "m"
    const ratio = ConversionFactor.SCALE[this._options.scale].ratio;
    const adjust = ratio / 1000;
 
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
    const shrink = new Scale(1000 / ratio);
    const masterXform = shrink.compose(shift).compose(flip);

    this._pieceList = [];
    this.build();
    this._pageList = [];
    this.pack();
    this.render(masterXform, this._options.pdfFileName);
  }

  addPiece(comp) {  // This should NOT be overridden.
    this._pieceList.push(new Piece(comp));
  }

  build() {  // OVERRIDE this.
  }

  pack() { // This should NOT be overridden.
    var notYetPacked = this._pieceList;
    while (notYetPacked.length > 0) {
      var bp = bpjs.BinPack();
      bp.binWidth(this._pageWidth._value);
      bp.binHeight(this._pageHeight._value);
      bp.sort((a, b) => b.area - a.area);
      bp.addAll(notYetPacked);
      if (bp.positioned.length == 0) {
        throw new Error("at least one piece is too big to fit on page");
      }
      const page = new Page();
      for (const record of bp.positioned) {
        const piece = Piece.fromBinPackOutput(record);
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
    const testOptions = {
      animal: "dog",
      name: "Rover",
      ears: "floppy",
      tail: "wags",
      size: "giant",
      };

    this._pdf.createAnnotation({
      type: 'text',
      title: 'Origination Data',
      bounds: {x: 1, y: 1, w: 50, h: 50 },
      contents: `File created at ${timestamp}\n` +
        `with class ${this.constructor.name} using these options:\n` +
        JSON.stringify(testOptions, null, 2) +
        '\nSee http://paperscissorsfun.com for more information.',
      color: "#FF0000",
      open: false // Set to true to open the pop-up by default
    });
    const board = new DrawingBoard(this._pdf);
    var first = true;
    for (const page of this._pageList) {
      if (first) {
        first = false;
      } else {
        this._pdf.addPage(this._options.format, "portrait");
      }
      for (const piece of page.allPieces()) {
        const shift = new Translate(piece.x, piece.y);
        piece.component.render(board, xform.compose(shift));
      }
    }
    this._pdf.save(pdfFileName);
  }
}

/*
     ==== EXPORTS ====
*/

module.exports = {
  Distance,
  distancify,
  ConversionFactor,
  DPair,
  AffineTransformation,
  Scale,
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

