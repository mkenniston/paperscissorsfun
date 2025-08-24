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

const psflib = require('./psflib');
const Distance = psflib.Distance;
const distancify = psflib.distancify;
const numerify = psflib.numerify;
const ConversionFactors = psflib.ConversionFactors;
const DPair = psflib.DPair;
const AffineTransformation = psflib.AffineTransformation;
const Resize = psflib.Resize;
const Translate = psflib.Translate;
const Rotate = psflib.Rotate;
const ROT90 = psflib.ROT90;
const ROT180 = psflib.ROT180;
const ROT270 = psflib.ROT270;
const ReflectAroundXAxis = psflib.ReflectAroundXAxis;
const Component = psflib.Component;
const Page = psflib.Page;
const Kit = psflib.Kit;

function expectDV(s) {
  return expect(numerify(new Distance(s)));
}

describe("Distance", () => {
  test("single metric units work", () => {
    expectDV("1 m").toBeCloseTo(1, 3);
    expectDV("2 meter").toBeCloseTo(2, 3);
    expectDV("3.5 meters").toBeCloseTo(3.5, 3);
    expectDV("4 metre").toBeCloseTo(4, 3);
    expectDV("-0.05 metres").toBeCloseTo(-0.05, 5);
    expectDV("1.23 km").toBeCloseTo(1230);
    expectDV("1.34 kilometer").toBeCloseTo(1340);
    expectDV("2.34 kilometers").toBeCloseTo(2340);
    expectDV("3.45 kilometre").toBeCloseTo(3450);
    expectDV("4.567 kilometres").toBeCloseTo(4567);
    expectDV("34.5 cm").toBeCloseTo(0.345, 4);
    expectDV("23 centimeter").toBeCloseTo(0.23, 4);
    expectDV("2 centimeters").toBeCloseTo(0.02, 5);
    expectDV("0.43 centimetre").toBeCloseTo(0.0043, 6);
    expectDV("0.001 centimetres").toBeCloseTo(0.00001, 8);
    expectDV("146 mm").toBeCloseTo(0.146, 4);
    expectDV("89 millimeter").toBeCloseTo(0.089, 5);
    expectDV("3 millimeters").toBeCloseTo(0.003, 6);
    expectDV("63 millimetre").toBeCloseTo(0.063, 5);
    expectDV("1 millimetres").toBeCloseTo(0.001, 6);
  });

  test("single US units work", () => {
    expectDV("2 inch").toBeCloseTo(0.0508, 5);
    expectDV("3 inches").toBeCloseTo(0.0762, 5);
    expectDV("4 in").toBeCloseTo(0.1016, 4);
    expectDV('6"').toBeCloseTo(0.1524, 4);
    expectDV("3.5 foot").toBeCloseTo(1.0668, 3);
    expectDV("2 feet").toBeCloseTo(0.6096, 4);
    expectDV("10 ft").toBeCloseTo(3.048, 3);
    expectDV("4'").toBeCloseTo(1.2192, 3);
    expectDV("0.4 yard").toBeCloseTo(0.36576, 4);
    expectDV("1.7 yards").toBeCloseTo(1.55448, 3);
    expectDV("5 yd").toBeCloseTo(4.572, 3);
    expectDV("1 barleycorn").toBeCloseTo(0.00846667, 6);
    expectDV("2 barleycorns").toBeCloseTo(0.0169333, 5);
    expectDV("3 furlong").toBeCloseTo(603.504);
    expectDV("4 furlongs").toBeCloseTo(804.672);
    expectDV("17 point").toBeCloseTo(0.00599722, 6);
    expectDV("18 points").toBeCloseTo(0.00635, 6);
    expectDV("19 pica").toBeCloseTo(0.0804333333, 5);
    expectDV("20 picas").toBeCloseTo(0.0846666667, 5);
    expectDV("5 chain").toBeCloseTo(100.584);
    expectDV("6 chains").toBeCloseTo(120.701);
    expectDV("7 rod").toBeCloseTo(35.204);
    expectDV("8 rods").toBeCloseTo(40.2336);
    expectDV("9 link").toBeCloseTo(1.810512, 3);
    expectDV("10 links").toBeCloseTo(2.01168, 3);
    expectDV("11 cubit").toBeCloseTo(5.0292, 3);
    expectDV("12 cubits").toBeCloseTo(5.4864, 3);
    expectDV("13 fathom").toBeCloseTo(23.7744);
    expectDV("14 fathoms").toBeCloseTo(25.6032);
    expectDV("15 league").toBeCloseTo(72420.6, 0);
    expectDV("16 leagues").toBeCloseTo(77248.6, 0);
  });

  test("example syntactic forms from doc all work", () => {
    expectDV("1 m").toBeCloseTo(1, 3);
    expectDV('2 m').toBeCloseTo(2, 3);
    expectDV("3 m 46 cm").toBeCloseTo(3.46, 3);
    expectDV("4 m 0 cm").toBeCloseTo(4.0, 3);
    expectDV("5m62cm").toBeCloseTo(5.62, 3);
    expectDV(`3' 6"`).toBeCloseTo(1.0668, 3);
    expectDV(`${2*3} m`).toBeCloseTo(6, 3);
    expectDV("4.56 m").toBeCloseTo(4.56, 3);
    expectDV("-8 m").toBeCloseTo(-8, 3);
    expectDV("+9 m").toBeCloseTo(9, 3);
  });

  test("variations on forms", () => {
    expectDV(new Distance("387 m")).toBeCloseTo(387);
    expectDV(undefined).toBe(undefined);
    expectDV(new Distance(0)).toEqual(0);
    expectDV(new Distance("0")).toEqual(0);
    expect((new Distance("1 in")).toString()).toEqual('Distance("0.0254 m")');
  });

  test("Distance.plus() works", () => {
    const p = new Distance("3 m");
    const z = new Distance("0 m");
    const a = new Distance("  8   m   ");
    expect(numerify(p.plus(a))).toBeCloseTo(11);
    expect(numerify(p.plus(z))).toBeCloseTo(3);
    expect(numerify(p.plus("2 m"))).toBeCloseTo(5);
    expect(numerify(p.plus("-10 m"))).toBeCloseTo(-7);
    expect(() => (p.plus())).toThrow();
    expect(() => (p.plus("xyz"))).toThrow();
  });

  test("Distance.minus() works", () => {
    const p = new Distance("6 m");
    const q = new Distance("7 m");
    expect(numerify(p.minus(q))).toBeCloseTo(-1);
    expect(numerify(p.minus("4 m"))).toBeCloseTo(2);
  });

  test("Distance.times() works", () => {
    const p = new Distance("11 m");
    expect(numerify(p.times(0))).toBe(0);
    expect(numerify(p.times(1))).toBeCloseTo(11);
    expect(numerify(p.times(10))).toBeCloseTo(110);
    expect(numerify(p.times(-2))).toBeCloseTo(-22);
    expect(() => (p.times("foo"))).toThrow();
    expect(() => (p.times())).toThrow();
  });

  test("Distance.divideBy() works", () => {
    const p = new Distance("100 m");
    const q = new Distance("20 m");
    expect(p.divideBy(q)).toBeCloseTo(5);
    expect(numerify(p.divideBy(40))).toBeCloseTo(2.5);
    expect(p.divideBy("2 m")).toBeCloseTo(50);
    expect(() => (p.divideBy("foo"))).toThrow();
  });

  test("illegal formats detected", () => {
    expect(() => (new Distance(5))).toThrow();
    expect(() => (new Distance("4 m cm"))).toThrow();
    expect(() => (new Distance("3 * 8 m"))).toThrow();
    expect(() => (new Distance("m 8"))).toThrow();
    expect(() => (new Distance("10 toes"))).toThrow();
    expect(() => (new Distance("0 m").plus(2))).toThrow();
    expect(() => (new Distance("3 m").plus())).toThrow();
    expect(() => (new Distance("2.5 m").times("5"))).toThrow();
  });
});

describe("ConversionFactor.scale()", () => {
  function checkEntry(key, ratio) {
    const entry = ConversionFactors.scale(key);
      expect(entry.ratio).toBe(ratio);
      expect(typeof entry.description).toBe('string');
  }

  test("scale factors are correct", () => {
    checkEntry("fullSize", 1);
    checkEntry("F", 20.3);
    checkEntry("G", 22.5);
    checkEntry("#3", 22.5);
    checkEntry("#2", 29);
    checkEntry("#1", 32);
    checkEntry("O", 48);
    checkEntry("S", 64);
    checkEntry("OO", 76.2);
    checkEntry("HO", 87.1);
    checkEntry("TT", 120);
    checkEntry("N", 160);
    checkEntry("Z", 220);
    checkEntry("T", 450);
  });
});

describe("DPair", () => {
  const p1 = new DPair("10 ft", "20 in");
  const p2 = new DPair(new Distance("3 ft 5 in"),
                             new Distance( "1 ft 7 in"));
  
  test("DPair.constructor works", () => {
    expect(p1).toBeInstanceOf(DPair);
    expect(numerify(p1.x())).toBeCloseTo(3.048, 3);
    expect(numerify(p1.y())).toBeCloseTo(0.508, 4);
    const p3 = new DPair("17 m 3 cm", "38 mm");
    expect(p3.toString()).toEqual(
      'DistancePair(Distance("17.03 m"), Distance("0.038 m"))');
  });

  test("DPair.plus() works", () => {
    expect(numerify(p2.x())).toBeCloseTo(1.0414, 3);
    expect(numerify(p2.y())).toBeCloseTo(0.4826, 4);
    var p3 = p1.plus("3 ft -2 in", "4 ft 0 in");
    expect(numerify(p3.x())).toBeCloseTo(3.9116, 3);
    expect(numerify(p3.y())).toBeCloseTo(1.7272);
    p3 = p1.plus(new DPair(new Distance("33 in"), "48 in"));
    expect(numerify(p3.x())).toBeCloseTo(3.8862, 3);
    expect(numerify(p3.y())).toBeCloseTo(1.7272, 3);
    p3 = p1.plus(new DPair("3 ft -2 in", "4 ft 0 in"));
    expect(numerify(p3.x())).toBeCloseTo(3.9116, 3);
    expect(numerify(p3.y())).toBeCloseTo(1.7272);
    var p4 = p1.plus(new Distance("-4 in"), new Distance( "-12 in"));
    expect(numerify(p4.x())).toBeCloseTo(2.9464, 3);
    expect(numerify(p4.y())).toBeCloseTo(0.2032, 4);
    expect(p3._comp).toBe(p4._comp);
    expect(() => (p3.plus())).toThrow();
    expect(() => (p3.plus("foo"))).toThrow();
    expect(() => (p3.plus("foo", "bar", "baz"))).toThrow();
  });

  test("DPair.minus() works", () => {
    var p3 = p1.minus("5 ft", "10 in");
    expect(numerify(p3.x())).toBeCloseTo(1.524, 3);
    expect(numerify(p3.y())).toBeCloseTo(0.254, 4);
    p3 = p1.minus(new DPair("5 ft", "10 in"));
    expect(numerify(p3.x())).toBeCloseTo(1.524, 3);
    expect(numerify(p3.y())).toBeCloseTo(0.254, 4);
    expect(() => (p3.minus("bar"))).toThrow();
  });

  test("DPair.times() works", () => {
    var p3 = p1.times(2);
    expect(numerify(p3.x())).toBeCloseTo(6.096, 3);
    expect(numerify(p3.y())).toBeCloseTo(1.016, 3);
    expect(() => (p3.times("zebra"))).toThrow();
  });

  test("DPair.divideBy() works", () => {
    var p3 = p1.divideBy(2);
    expect(numerify(p3.x())).toBeCloseTo(1.524, 3);
    expect(numerify(p3.y())).toBeCloseTo(0.254,4);
    expect(() => (p3.times("lions"))).toThrow();
  });

  test("bad arguments detected", () => {
    expect(() => (new DPair())).toThrow();
    expect(() => (new DPair(5))).toThrow();
    expect(() => (p1.plus())).toThrow();
    expect(() => (p1.plus(1, 2, 3))).toThrow();
  });
});

describe("AffineTransformation", () => {
  test("AffineTransformation.constructor", () => {
    var m = [];
    expect(() => (new AffineTransformation(m))).toThrow();
    m = [[1, 2], [1, 2, 3], [1, 2, 3]];
    expect(() => (new AffineTransformation(m))).toThrow();
    m = [[1, 2, 3], [1, 2], [1, 2, 3]];
    expect(() => (new AffineTransformation(m))).toThrow();
    m = [[1, 2, 3], [1, 2, 3], [1, 2]];
    expect(() => (new AffineTransformation(m))).toThrow();
    m = [[11, 22, 33], [44, 55, 66], [77, 88, 99]];
    const transform = new AffineTransformation(m);
    const x = transform._matrix;
    expect(x[0][0]).toBe(11);
    expect(x[0][1]).toBe(22);
    expect(x[0][2]).toBe(33);
    expect(x[1][0]).toBe(44);
    expect(x[1][1]).toBe(55);
    expect(x[1][2]).toBe(66);
    expect(x[2][0]).toBe(77);
    expect(x[2][1]).toBe(88);
    expect(x[2][2]).toBe(99);
    expect(transform.toString()).toEqual(
      "AffineTransformation(11,22,33,44,55,66,77,88,99)");
  });

  test("Resize.constructor", () => {
    const result = new Resize(10)._matrix;
    expect(result).toStrictEqual([[10, 0, 0], [0, 10, 0], [0, 0, 1]]);
  });

  test("Translate.constructor", () => {
    const result = new Translate("3 m", "5 m")._matrix;
    expect(result).toStrictEqual([[1, 0, 3], [0, 1, 5], [0, 0, 1]]);
  });

  test("Rotate.constructor", () => {
    var result = new Rotate(ROT90)._matrix;
    expect(result).toStrictEqual([[0, -1, 0], [1, 0, 0], [0, 0, 1]]);
    result = new Rotate(ROT180)._matrix;
    expect(result).toStrictEqual([[-1, 0, 0], [0, -1, 0], [0, 0, 1]]);
    result = new Rotate(ROT270)._matrix;
    expect(result).toStrictEqual([[0, 1, 0], [-1, 0, 0], [0, 0, 1]]);
  });

  test("ReflectAroundXAxis.constructor", () => {
    const result = new ReflectAroundXAxis()._matrix;
    expect(result).toStrictEqual([[1, 0, 0], [0, -1, 0], [0, 0, 1]]);
  });

  test("AffineTransformation.apply() works", () => {
    const pt = new DPair("3 m", "5 m");

    var result = (new Resize(2)).apply(pt);
    expect(result.x).toBeCloseTo(6, 3);
    expect(result.y).toBeCloseTo(10, 3);

    result = (new Translate("-1 m", "2 m")).apply(pt);
    expect(result.x).toBeCloseTo(2, 3);
    expect(result.y).toBeCloseTo(7, 3);

    result = (new Rotate(ROT90)).apply(pt);
    expect(result.x).toBeCloseTo(-5, 3);
    expect(result.y).toBeCloseTo(3, 3);

    result = (new Rotate(ROT180)).apply(pt);
    expect(result.x).toBeCloseTo(-3, 3);
    expect(result.y).toBeCloseTo(-5, 3);

    result = (new Rotate(ROT270)).apply(pt);
    expect(result.x).toBeCloseTo(5, 3);
    expect(result.y).toBeCloseTo(-3, 3);

    result = (new ReflectAroundXAxis()).apply(pt);
    expect(result.x).toBeCloseTo(3);
    expect(result.y).toBeCloseTo(-5);
  });

  test("AffineTransformation.compose() works", () => {
    function checkOneMultiply(mat1, mat2, mat3) {
      const at1 = new AffineTransformation(mat1);
      const at2 = new AffineTransformation(mat2);
      const at3 = at1.compose(at2);
      expect(at3._matrix).toStrictEqual(mat3);
    }

    var mat1 = [ [2, 1, 3], [3, 4, 1], [5, 2, 3] ];
    var mat2 = [ [1, 2, 0], [4, 1, 2], [3, 2, 1] ];
    var mat3 = [ [15, 11, 5], [22, 12, 9], [22, 18, 7] ];
    checkOneMultiply(mat1, mat2, mat3);

    mat3 = [ [ 8, 9, 5], [21, 12, 19], [17, 13, 14] ];
    checkOneMultiply(mat2, mat1, mat3);

    mat1 = [ [-2, 3, 4], [2, -3, 5], [0, 3, -4] ];
    mat2 = [ [4, 2, -2], [1, 4, 3], [2, 5, 3] ];
    mat3 = [ [3, 28, 25], [15, 17, 2], [-5, -8, -3] ];
    checkOneMultiply(mat1, mat2, mat3);

    mat1 = [ [3, -2, -1], [3, -3, 2], [2, 1, -5] ];
    mat2 = [ [-2, 3, 0], [3, 2, 1], [1, 2, -2] ];
    mat3 = [ [-13, 3, 0], [-13, 7, -7], [-6, -2, 11] ];
    checkOneMultiply(mat1, mat2, mat3);

    const p1 = new DPair("3 m", "5 m");
    const resize2 = new Resize(2);
    const translate21 = new Translate("-2 m", "+1 m");
    var results = resize2.compose(translate21).apply(p1);
    expect(results.x).toBeCloseTo(2, 3);
    expect(results.y).toBeCloseTo(12, 3);

    results = translate21.compose(resize2).apply(p1);
    expect(results.x).toBeCloseTo(4, 3);
    expect(results.y).toBeCloseTo(11, 3);

    expect(() => (translate21.compose(p1))).toThrow();
  });
});

describe("Component", () => {
  test("Component.constructor", () => {
    const c = new Component(new Resize(1));
    expect(c).toBeInstanceOf(Component);
    expect(c.toString()).toEqual("Component()");
  });
});

describe("Page", () => {
  test("Page.constructor", () => {
    const p = new Page();
    expect(p).toBeInstanceOf(Page);
    expect(p.toString()).toEqual("Page()");
  });
});

describe("Kit", () => {
  test("Kit.constructor", () => {
    const k = new Kit();
    expect(k).toBeInstanceOf(Kit);
    expect(k.toString()).toEqual("Kit()");
    expect(k._options.format).toEqual("letter");
    expect(k._options.scale).toEqual("HO");
  });

  const dummyOptions = {
    color: "blue",
    number: 5,
   };

  class Box extends Component {
    constructor(width, height, drawColor, fillColor) {
      super();
      this._width = distancify(width);
      this._height = distancify(height);
      this._drawColor = drawColor;
      this._fillColor = fillColor;
    }

    build() {
      // no sub-components, so nothing to do
    }
    render(board, xform) {
      const pen = board.getPen(xform);
      const inc = distancify("1 m");

      const x0 = distancify(0);
      const x2 = x0.plus(this._width.times(0.5));
      const x1 = x2.minus(inc);
      const x3 = x2.plus(inc);
      const x4 = x0.plus(this._width);

      const y0 = distancify(0);
      const y1 = y0.plus(this._height.times(0.25));
      const y3 = y0.plus(this._height.times(0.75));
      const y2 = y3.minus(inc);
      const y4 = y0.plus(this._height);

      const ptA = new DPair(x0, y0);
      const ptB = new DPair(x0, y4);
      const ptC = new DPair(x4, y4);
      const ptD = new DPair(x4, y0);
      const ptE = new DPair(x2, y1);
      const ptF = new DPair(x1, y2);
      const ptG = new DPair(x2, y3);
      const ptH = new DPair(x3, y2);

      pen.set({drawColor: "black", fillColor: this._fillColor});
      pen.polygon([ptA, ptB, ptC, ptD], "fillAndStroke");
      pen.set({drawColor: this._drawColor});
      pen.openPath([ptE, ptG, ptF, ptG, ptH]);
    }
  }

  class DummyKit extends Kit {
    getDefaultOptions() {
      return dummyOptions;
    }
    build() {
      this.addPiece(new Box("17 m", "5 m", "black", "yellow"));
      this.addPiece(new Box("7 m", "5 m", "black", "orange"));
      this.addPiece(new Box("18 m", "11 m", "black", "red"));
      this.addPiece(new Box("11 m", "13 m", "white", "purple"));
      this.addPiece(new Box("9 m", "12 m", "white", "blue"));
      this.addPiece(new Box("6 m", "18 m", "white", "green"));
    }
  }

  test("Kit.constructor sets initial values", () => {
    const k = new DummyKit();
    expect(k.toString()).toEqual("DummyKit()");
    expect(k.getDefaultOptions()).toEqual(dummyOptions);
  });

  test("Kit.build updates options()", () => {
    const k = new DummyKit();
    expect(k.getDefaultOptions()).toEqual(dummyOptions);
    k.generate({color: "red"});
    expect(k.getOptionValue("color")).toEqual("red");
    expect(k.getOptionValue("number")).toEqual(5);
  });

  test("Kit.generate() invokes build()", () => {
    const k = new DummyKit();
    k.generate({planet: "Earth"});
    expect(k._pieceList.length).toEqual(6);
    expect(k.getOptionValue("planet")).toEqual("Earth");
  });

  test("Kit.generate() invokes pack()", () => {
    const k = new DummyKit();
    k.generate({});
    expect(k._pieceList.length).toEqual(6);
    expect(k._pageList.length).toEqual(2);
    const p0 = k._pageList[0];
    var pieces = p0.allPieces();
    expect(pieces.length).toBe(3);
    expect([numerify(pieces[0].x), numerify(pieces[0].y)]).toEqual([0, 0]);
    expect([numerify(pieces[1].x), numerify(pieces[1].y)]).toEqual([0, 11]);
    expect([numerify(pieces[2].x), numerify(pieces[2].y)]).toEqual([11, 11]);
    const p1 = k._pageList[1];
    pieces = p1.allPieces();
    expect(pieces.length).toBe(3);
    expect([numerify(pieces[0].x), numerify(pieces[0].y)]).toEqual([0, 0]);
    expect([numerify(pieces[1].x), numerify(pieces[1].y)]).toEqual([9, 0]);
    expect([numerify(pieces[2].x), numerify(pieces[2].y)]).toEqual([0, 18]);
  });

  test("Kit.generate() invokes render()", () => {
    const k = new DummyKit();
    k.generate({});
    // FIX ME - add some tests here to verify graphics calls to pdf
  });
});

