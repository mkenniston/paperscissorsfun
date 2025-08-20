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
coordinates (e.g. as the argument to DP.plus()).

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
  km:          1000,
  kilometer:   1000,
  kilometers:  1000,
  kilometre:   1000,
  kilometres:  1000,
  m:           1,
  meter:       1,
  meters:      1,
  metre:       1,
  metres:      1,
  cm:          0.01,
  centimeter:  0.01,
  centimeters: 0.01,
  centimetre:  0.01,
  centimetres: 0.01,
  mm:          0.001,
  millimeter:  0.001,
  millimeters: 0.001,
  millimetre:  0.001,
  millimetres: 0.001,
  inch:        INCH,
  inches:      INCH,
  in:          INCH,
  '"':         INCH,
  foot:        FOOT,
  feet:        FOOT,
  ft:          FOOT,
  "'":         FOOT,
  yard:        YARD,
  yards:       YARD,
  yd:          YARD,
  point:       INCH/72,
  points:      INCH/72,
  pica:        INCH/6,
  picas:       INCH/6,
  barleycorn:  0.00846667,
  barleycorns: 0.00846667,
  furlong:     201.168,
  furlongs:    201.168,
  chain:       20.1168,
  chains:      20.1168,
  rod:         5.0292,
  rods:        5.0292,
  link:        0.201,
  links:       0.201,
  cubit:       0.4572,
  cubits:      0.4572,
  fathom:      1.8288,
  fathoms:     1.8288,
  league:      5556,
  leagues:     5556,
  };

const SCALE_FACTORS = {
  "1:1": {ratio: 1,    description: "full size"},
  G:     {ratio: 22.5, description: "German LGB scale"},
  O:     {ratio: 48,   description: "O scale"},
  S:     {ratio: 64,   description: "S scale"},
  HO:    {ratio: 87.1, description: "HO scale"},
  TT:    {ratio: 120,  description: "TT scale"},
  N:     {ratio: 160,  description: "N scale"},
  Z:     {ratio: 220,  description: "Z scale"},
  T:     {ratio: 450,  description: "T scale"},
};

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
      if (! MEASUREMENT_UNITS.hasOwnProperty(unit)) {
        throw new Error(`invalid measurement unit ${unit}`);
      }
      value += Number(num) * MEASUREMENT_UNITS[unit];
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

The "DistancePair" class is used so much that we abbreviate it "DP".

The "DP" class is just a pair of Distance objects.  They are used for
three distinct purposes:
  (1) Represent a point.  This is the most common use.
  (2) Represent a vector (direction and length).  For example, you
    can add a vector to a point to get a new point.
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
of various shapes which we want to appear in the final PDF.  The "out"
coordinates are used only at the point where we call jsPdf methods
to add things to the actual PDF file.

We use "lazy evaluation" to do the actual transformation of coordinates
between the two systems.  This is because when we are originally building
the data structure which represents our whole kit, we cannot decide
where on the page to put things until after we know what all the
components are.  (This gives us at least a chance of packing the different
components onto pages with some degree of efficiency.)
Rather than add the complexity of keeping track of all the points that
exist, we just let each point take care of transforming itself the
first time somebody asks for an "outX" or "outY".

The DP.plus() method treats its argument as a vector which is to be
added to a point, i.e. it means "move": start at the invoking
point, then move a specified distance and direction, and return a
new point at the ending location.  This can be very handy for creating
polygons.

*/

class DistancePair {
  constructor(inX, inY) {
    this._inX = distancify(inX);  // "in" fields are class Distance
    this._inY = distancify(inY);
    this._outX = null;            // "out" fields are type Number
    this._outY = null;
  }

  toString() {
    return `DistancePair(${this._inX.toString()}, ${this._inY.toString()})`;
  }

  inX() {
    return this._inX;
  }

  inWidth() {
    return this._inX;
  }

  inY() {
    return this._inY;
  }

  inHeight() {
    return this._inY;
  }

  plus() {
    if (arguments.length == 2) {
      const [dx, dy] = arguments;
      return new DistancePair(
        this._inX.plus(dx),
        this._inY.plus(dy));
    }
    if (arguments.length == 1) {
      const delta = arguments[0];
      if (delta instanceof DistancePair) {
        return new DistancePair(
          this._inX.plus(delta._inX),
          this._inY.plus(delta._inY));
      }
    }
    throw new Error("DistancePair.plus arg must be 1 DP or 2 Distances");
  }

  minus() {
    if (arguments.length == 2) {
      const [dx, dy] = arguments;
      return new DistancePair(
        this._inX.minus(dx),
        this._inY.minus(dy));
    }
    if (arguments.length == 1) {
      const delta = arguments[0];
      if (delta instanceof DistancePair) {
        return new DistancePair(
          this._inX.minus(delta._inX),
          this._inY.minus(delta._inY));
      }
    }
    throw new Error("DistancePair.minus arg must be 1 DP or 2 Distances");
  }

  times(factor) {
    return new DistancePair(
      this._inX.times(factor),
      this._inY.times(factor));
  }

  divideBy(divisor) {
    return new DistancePair(
      this._inX.divideBy(divisor),
      this._inY.divideBy(divisor));
  }

  _applyTransform(xform) {
    if (this._outX == null) {
      // skip if "out" values have already been generated
      const result = xform.apply(this);
      this._outX = result.x;
      this._outY = result.y;
    }
  }

  outX(transform) {
    this._applyTransform(transform);
    return this._outX;
  }

  outY(transform) {
    this._applyTransform(transform);
    return this._outY;
  }
}

const DP = DistancePair;  // to make code more concise and save typing

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

  apply(pt) {
    const a = this._matrix;
    const b = [pt.inX()._value, pt.inY()._value, 1];
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

  addPositionedPiece(record) {
    // convert the output of bin-pack to a more convenient form
    this._positionedPieceList.push( {
      x: distancify(`${record.x} m`),
      y: distancify(`${record.y} m`),
      component: record.datum,
    });
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
  }

  polygon(points) {
    if (points.length < 2) {
      throw new Error("DrawingPen.polygon needs at least 2 points");
    }
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
    pdf.lines(pdfDiffs, x, y, null, 'FD', true);
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
    const ratio = SCALE_FACTORS[this._options.scale].ratio;
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
    this.render(masterXform);
  }

  addPiece(comp) {  // This should NOT be overridden.
    this._pieceList.push(comp);
  }

  build() {  // OVERRIDE this.
  }

  pack() { // This should NOT be overridden.
    for (const comp of this._pieceList) {
      comp.width = distancify(comp.getWidth())._value;
      comp.height = distancify(comp.getHeight())._value;
      comp.area = comp.width * comp.height;
    }
    var notYetPacked = this._pieceList;

    while (notYetPacked.length > 0) {
      var bp = bpjs.BinPack();
      bp.binWidth(this._pageWidth._value);
      bp.binHeight(this._pageHeight._value);
      bp.sort((a, b) => b.area - a.area);
      bp.addAll(notYetPacked);
      const page = new Page();
      if (bp.positioned.length == 0) {
        throw new Error("at least one piece is too big to fit on page");
      }
      for (const rec of bp.positioned) {
        page.addPositionedPiece(rec);
      }
      this._pageList.push(page);
      notYetPacked = [];
      for (const item of bp.unpositioned) {
        notYetPacked.push(item.datum);
      }
    }
  }

  render(xform) {  // This should NOT be overridden.
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
      for (const record of page.allPieces()) {
        const piece = record.component;
        const shift = new Translate(record.x, record.y);
        piece.render(board, xform.compose(shift));
      }
    }
    this._pdf.save("dummy.pdf");
  }
}

/*
     ==== EXPORTS ====
*/

module.exports = {
  Distance,
  SCALE_FACTORS,
  DP,
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

