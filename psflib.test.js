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
const Measurement = psflib.Measurement;
const WORLD = psflib.WORLD;
const PRINTED = psflib.PRINTED;
const worldM = psflib.worldM;
const printedM = psflib.printedM;
const MeasurementPair = psflib.MeasurementPair;
const POINT = psflib.POINT;
const VECTOR = psflib.VECTOR;
const SIZE = psflib.SIZE;
const point = psflib.point;
const vector = psflib.vector;
const size = psflib.size;
const ConversionFactors = psflib.ConversionFactors;
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

describe("Measurement", () => {
  test("constructor works", () => {
    const three = new Measurement(WORLD, '3 m');
    expect(worldM(three)._toBare()).toEqual(3);
    expect(worldM(0)._toBare()).toEqual(0);
    expect(worldM("0")._toBare()).toEqual(0);
    expect(worldM("125 cm")._toBare()).toBeCloseTo(1.25);
    expect(worldM("5 m 10 cm")._toBare()).toBeCloseTo(5.1);
    expect(worldM([2, "m", 37, "mm"])._toBare()).toBeCloseTo(2.037);
    expect(worldM(["787", "mm"])._toBare()).toBeCloseTo(0.787);

    expect(() => (new Measurement('W'))).toThrow();
    expect(() => (new Measurement('W', 0, 3))).toThrow();
    expect(() => (new Measurement('X', 0))).toThrow();
    expect(() => (new Measurement('P', worldM(0)))).toThrow();
    expect(() => (new Measurement('W', printedM(0)))).toThrow();
    expect(() => (worldM(""))).toThrow();
    expect(() => (worldM([]))).toThrow();
    expect(() => (worldM("ft"))).toThrow();
    expect(() => (worldM("4 ft 5"))).toThrow();
    expect(() => (worldM("ft in"))).toThrow();
    expect(() => (worldM("4 5"))).toThrow();
    expect(() => (worldM({}))).toThrow();
  });

  test("utility functions work", () => {
    expect(worldM("50 cm").toString()).toEqual('worldM("0.5 m")');
    expect(printedM(0)._toBare()).toEqual(0);
    expect(printedM(0).referenceFrame()).toEqual(PRINTED);
    expect(worldM(0)._toBare()).toEqual(0);
    expect(worldM(0).referenceFrame()).toEqual(WORLD);
    expect(Measurement._fromBare(WORLD, 37)._toBare()).toEqual(37);

    expect(() => (Measurement._fromBare(WORLD, "footsie"))).toThrow();
    expect(() => (Measurement._fromBare('X', 77))).toThrow();
  });

  test("arithmetic functions work", () => {
    const m3 = worldM("3 m");
    const m5 = worldM("5 m");
    expect(m3.plus(m5)._toBare()).toEqual(8);
    expect(m3.minus(m5)._toBare()).toEqual(-2);
    expect(m3.times(5)._toBare()).toEqual(15);
    expect(m3.dividedBy(5)._toBare()).toEqual(0.6);
    expect(m3.dividedBy(m5)).toEqual(0.6);

    expect(m3.greaterThan(m5)).toBe(false);
    expect(m3.greaterThan(m3)).toBe(false);
    expect(m5.greaterThan(m3)).toBe(true);
    expect(m3.greaterThanOrEqualTo(m5)).toBe(false);
    expect(m3.greaterThanOrEqualTo(m3)).toBe(true);
    expect(m5.greaterThanOrEqualTo(m3)).toBe(true);
    expect(m3.lessThan(m5)).toBe(true);
    expect(m3.lessThan(m3)).toBe(false);
    expect(m5.lessThan(m3)).toBe(false);
    expect(m3.lessThanOrEqualTo(m5)).toBe(true);
    expect(m3.lessThanOrEqualTo(m3)).toBe(true);
    expect(m5.lessThanOrEqualTo(m3)).toBe(false);
    expect(m3.equalTo(m5)).toBe(false);
    expect(m3.equalTo(m3)).toBe(true);
    expect(m5.equalTo(m3)).toBe(false);
    expect(m3.notEqualTo(m5)).toBe(true);
    expect(m3.notEqualTo(m3)).toBe(false);
    expect(m5.notEqualTo(m3)).toBe(true);

    expect(() => m3.plus(printedM(0))).toThrow();
    expect(() => m3.minus(printedM(0))).toThrow();
    expect(() => m3.times(printedM(0))).toThrow();
    expect(() => m3.times(m5)).toThrow();
    expect(() => m3.dividedBy(printedM(0))).toThrow();
    expect(() => m3.dividedBy(worldM(0))).toThrow();
    expect(() => m3.dividedBy(0)).toThrow();
    expect(() => m3.lessThan(printedM(0))).toThrow();
    expect(() => m3.lessThanOrEqualTo(printedM(0))).toThrow();
    expect(() => m3.greaterThan(printedM(0))).toThrow();
    expect(() => m3.greaterThanOrEqualTo(printedM(0))).toThrow();
    expect(() => m3.equalTo(printedM(0))).toThrow();
    expect(() => m3.notEqualTo(printedM(0))).toThrow();
  });

  test("conversion functions work", () => {
    Measurement._setConversionFactor("S");
    const w = worldM("128 m");
    const p = printedM("500 mm");
    expect(w.toPrinted().referenceFrame()).toEqual(PRINTED);
    expect(w.toPrinted()._toBare()).toEqual(2);
    expect(p.toWorld().referenceFrame()).toEqual(WORLD);
    expect(p.toWorld()._toBare()).toEqual(32);
    expect(p.toPdfMm()).toEqual(500);

    expect(() => w.toWorld()).toThrow();
    expect(() => p.toPrinted()).toThrow();
    expect(() => w.toPdfMm()).toThrow();
  });
});

describe("MeasurementPair", () => {
  test("constructor works", () => {
    const p = point([4, "ft", 5, "in"], [8, "m"]);
    const v = vector("2 m", "3 m");
    const vp = vector(printedM(0), printedM(0));
    const s = size(worldM(0), worldM(0));

    expect(v.toString()).toEqual('vector(worldM("2 m"), worldM("3 m"))');
    expect(s.referenceFrame()).toEqual(WORLD);
    expect(vp.referenceFrame()).toEqual(PRINTED);
    expect(p.type()).toEqual(POINT);
    expect(v.type()).toEqual(VECTOR);
    expect(s.type()).toEqual(SIZE);
    expect(vector("3 m", "2 m").x()._toBare()).toEqual(3);
    expect(vector("3 m", "2 m").y()._toBare()).toEqual(2);

    expect(() => (new MeasurementPair(p, p))).toThrow();
    expect(() => (new MeasurementPair(WORLD, p, p, p))).toThrow();
    expect(() => (point(worldM(0), printedM(0)))).toThrow();
  });

  test("arithmetic works", () => {
    const p = point("2 m", "3 m");
    const v = vector("4 mm", "5 mm");
    const vp = vector(printedM(0), printedM(0));
    const s = size("60 m", "70 m");

    var res = p.plus(v);
    expect(res.x()._toBare()).toEqual(2.004);
    expect(res.y()._toBare()).toEqual(3.005);
    res = p.minus(v);
    expect(res.x()._toBare()).toEqual(1.996);
    expect(res.y()._toBare()).toEqual(2.995);
    res = p.times(10);
    expect(res.x()._toBare()).toEqual(20);
    expect(res.y()._toBare()).toEqual(30);
    res = p.dividedBy(2);
    expect(res.x()._toBare()).toEqual(1);
    expect(res.y()._toBare()).toEqual(1.5);
    res = point("3 m", "4 m");
    expect(res.length()._toBare()).toEqual(5);

    expect(() => (p.plus(p))).toThrow();
    expect(() => (p.plus(s))).toThrow();
    expect(() => (p.plus(vp))).toThrow();
    expect(() => (p.minus(p))).toThrow();
    expect(() => (p.minus(s))).toThrow();
    expect(() => (p.minus(vp))).toThrow();
    expect(() => (p.times("foo"))).toThrow();
    expect(() => (p.dividedBy("foo"))).toThrow();
    expect(() => (p.dividedBy(0))).toThrow();
  });
});

function expectWB(s) {
  return expect(worldM(s)._toBare());
}

describe("Measurement units", () => {
  test("single metric units work", () => {
    // base unit (meter)
    expectWB("1 m").toBeCloseTo(1, 3);
    expectWB("2 meter").toBeCloseTo(2, 3);
    expectWB("3.5 meters").toBeCloseTo(3.5, 3);
    expectWB("4 metre").toBeCloseTo(4, 3);
    expectWB("-0.05 metres").toBeCloseTo(-0.05, 5);

    expectWB("3.45 millimetre").toBeCloseTo(0.00345);
    expectWB("4.56 mm").toBeCloseTo(0.00456, -26);

    // prefixed units
    expectWB("1.30 quettameter").toBeCloseTo(1.30e30, -26);
    expectWB("1.03 Qm").toBeCloseTo(1.03e30, -26);
    expectWB("1.27 ronnameter").toBeCloseTo(1.27e27, -23);
    expectWB("1.027 Rm").toBeCloseTo(1.027e27, -23);
    expectWB("1.24 yottametre").toBeCloseTo(1.24e24, -20);
    expectWB("1.024 Ym").toBeCloseTo(1.024e24, -20);
    expectWB("1.21 zettameters").toBeCloseTo(1.21e21, -17);
    expectWB("1.021 Zm").toBeCloseTo(1.021e21, -17);
    expectWB("1.18 exametres").toBeCloseTo(1.18e18, -14);
    expectWB("1.018 Em").toBeCloseTo(1.018e18, -14);
    expectWB("1.15 petameter").toBeCloseTo(1.15e15, -11);
    expectWB("1.015 Pm").toBeCloseTo(1.015e15, -11);
    expectWB("1.12 terametre").toBeCloseTo(1.12e12, -8);
    expectWB("1.012 Tm").toBeCloseTo(1.012e12, -8);
    expectWB("1.09 gigameters").toBeCloseTo(1.09e9, -5);
    expectWB("1.009 Gm").toBeCloseTo(1.009e9, -5);
    expectWB("1.06 megametres").toBeCloseTo(1.06e6, -2);
    expectWB("1.006 Mm").toBeCloseTo(1.006e6, -2);
    expectWB("1.03 kilometer").toBeCloseTo(1.03e3, 1);
    expectWB("1.003 km").toBeCloseTo(1.003e3, 1);
    expectWB("1.02 hectometer").toBeCloseTo(1.02e2, 2);
    expectWB("1.002 hm").toBeCloseTo(1.002e2, 2);
    expectWB("1.01 decameter").toBeCloseTo(1.01e1, 3);
    expectWB("1.001 dam").toBeCloseTo(1.001e1, 3);
    expectWB("2.01 decimeter").toBeCloseTo(2.01e-1, 5);
    expectWB("2.001 dm").toBeCloseTo(2.001e-1, 5);
    expectWB("2.02 centimeter").toBeCloseTo(2.02e-2, 6);
    expectWB("2.002 cm").toBeCloseTo(2.002e-2, 6);
    expectWB("2.03 millimeter").toBeCloseTo(2.03e-3, 7);
    expectWB("2.003 mm").toBeCloseTo(2.003e-3, 7);
    expectWB("2.06 micrometers").toBeCloseTo(2.06e-6, 10);
    expectWB("2.006 um").toBeCloseTo(2.006e-6, 10);
    expectWB("2.006 μm").toBeCloseTo(2.006e-6, 10);
    expectWB("2.09 nanometer").toBeCloseTo(2.09e-9, 13);
    expectWB("2.009 nm").toBeCloseTo(2.009e-9, 13);
    expectWB("2.12 picometer").toBeCloseTo(2.12e-12, 16);
    expectWB("2.012 pm").toBeCloseTo(2.012e-12, 16);
    expectWB("2.15 femtometer").toBeCloseTo(2.15e-15, 19);
    expectWB("2.015 fm").toBeCloseTo(2.015e-15, 19);
    expectWB("2.0015 fermi").toBeCloseTo(2.0015e-15, 19);
    expectWB("2.00015 fermis").toBeCloseTo(2.00015e-15, 19);
    expectWB("2.18 attometer").toBeCloseTo(2.18e-18, 22);
    expectWB("2.018 am").toBeCloseTo(2.018e-18, 22);
    expectWB("2.21 zeptometer").toBeCloseTo(2.21e-21, 25);
    expectWB("2.021 zm").toBeCloseTo(2.021e-21, 25);
    expectWB("2.24 yoctometer").toBeCloseTo(2.24e-24, 28);
    expectWB("2.024 ym").toBeCloseTo(2.024e-24, 28);
    expectWB("2.27 rontometer").toBeCloseTo(2.27e-27, 31);
    expectWB("2.027 rm").toBeCloseTo(2.027e-27, 31);
    expectWB("2.30 quectometer").toBeCloseTo(2.30e-30, 34);
    expectWB("2.030 qm").toBeCloseTo(2.030e-30, 34);


    expectWB("1.23 km").toBeCloseTo(1230);
    expectWB("1.34 kilometer").toBeCloseTo(1340);
    expectWB("2.34 kilometers").toBeCloseTo(2340);
    expectWB("3.45 kilometre").toBeCloseTo(3450);
    expectWB("4.567 kilometres").toBeCloseTo(4567);
    expectWB("34.5 cm").toBeCloseTo(0.345, 4);
    expectWB("23 centimeter").toBeCloseTo(0.23, 4);
    expectWB("2 centimeters").toBeCloseTo(0.02, 5);
    expectWB("0.43 centimetre").toBeCloseTo(0.0043, 6);
    expectWB("0.001 centimetres").toBeCloseTo(0.00001, 8);
    expectWB("146 mm").toBeCloseTo(0.146, 4);
    expectWB("89 millimeter").toBeCloseTo(0.089, 5);
    expectWB("3 millimeters").toBeCloseTo(0.003, 6);
    expectWB("63 millimetre").toBeCloseTo(0.063, 5);
    expectWB("1 millimetres").toBeCloseTo(0.001, 6);
  });

  test("single US units work", () => {
    expectWB("2 inch").toBeCloseTo(0.0508, 5);
    expectWB("3 inches").toBeCloseTo(0.0762, 5);
    expectWB("4 in").toBeCloseTo(0.1016, 4);
    expectWB('6"').toBeCloseTo(0.1524, 4);
    expectWB("3.5 foot").toBeCloseTo(1.0668, 3);
    expectWB("2 feet").toBeCloseTo(0.6096, 4);
    expectWB("10 ft").toBeCloseTo(3.048, 3);
    expectWB("4'").toBeCloseTo(1.2192, 3);
    expectWB("0.4 yard").toBeCloseTo(0.36576, 4);
    expectWB("1.7 yards").toBeCloseTo(1.55448, 3);
    expectWB("5 yd").toBeCloseTo(4.572, 3);
    expectWB("1 barleycorn").toBeCloseTo(0.00846667, 6);
    expectWB("2 barleycorns").toBeCloseTo(0.0169333, 5);
    expectWB("3 furlong").toBeCloseTo(603.504);
    expectWB("4 furlongs").toBeCloseTo(804.672);
    expectWB("100 thou").toBeCloseTo(0.00254, 4);
    expectWB("100 mil").toBeCloseTo(0.00254, 4);
    expectWB("100 mils").toBeCloseTo(0.00254, 4);
    expectWB("17 point").toBeCloseTo(0.00599722, 6);
    expectWB("18 points").toBeCloseTo(0.00635, 6);
    expectWB("19 pica").toBeCloseTo(0.0804333333, 5);
    expectWB("20 picas").toBeCloseTo(0.0846666667, 5);
    expectWB("21 micron").toBeCloseTo(2.1e-5, -2);
    expectWB("22 microns").toBeCloseTo(2.2e-5, -1);
    expectWB("5 chain").toBeCloseTo(100.584);
    expectWB("6 chains").toBeCloseTo(120.701);
    expectWB("7 rod").toBeCloseTo(35.204);
    expectWB("8 rods").toBeCloseTo(40.2336);
    expectWB("9 link").toBeCloseTo(1.810512, 3);
    expectWB("10 links").toBeCloseTo(2.01168, 3);
    expectWB("11 cubit").toBeCloseTo(5.0292, 3);
    expectWB("12 cubits").toBeCloseTo(5.4864, 3);
    expectWB("13 fathom").toBeCloseTo(23.7744);
    expectWB("14 fathoms").toBeCloseTo(25.6032);
    expectWB("15 league").toBeCloseTo(72420.6, 0);
    expectWB("16 leagues").toBeCloseTo(77248.6, 0);
    expectWB("17 mile").toBeCloseTo(27358.8, 0);
    expectWB("18 miles").toBeCloseTo(28968.2, 0);
    expectWB("19 mi").toBeCloseTo(30577.5, 0);
    expectWB("1 astronomical-unit").toBeCloseTo(1.49597879799e+11, -7);
    expectWB("1 au").toBeCloseTo(1.49597879799e+11, -7);
    expectWB("1 parsec").toBeCloseTo(3.0856775814e+16, -12);
    expectWB("1 parsecs").toBeCloseTo(3.0856775814e+16, -12);
    expectWB("1 pc").toBeCloseTo(3.0856775814e+16, -12);
    expectWB("1 kiloparsec").toBeCloseTo(3.0856775814e+19, -15);
    expectWB("1 kiloparsecs").toBeCloseTo(3.0856775814e+19, -15);
    expectWB("1 kpc").toBeCloseTo(3.0856775814e+19, -15);
    expectWB("1 megaparsec").toBeCloseTo(3.0856775814e+22, -18);
    expectWB("1 megaparsecs").toBeCloseTo(3.0856775814e+22, -18);
    expectWB("1 Mpc").toBeCloseTo(3.0856775814e+22, -18);
    expectWB("1 light-year").toBeCloseTo(9.460730e12, -8);
    expectWB("1 ly").toBeCloseTo(9.460730e12, -8);
    expectWB("1 lyr").toBeCloseTo(9.460730e12, -8);
    expectWB("2 angstrom").toBeCloseTo(2e-10);
    expectWB("3 angstroms").toBeCloseTo(3e-10);
    expectWB("4 A").toBeCloseTo(4e-10);
    expectWB("5 Å").toBeCloseTo(5e-10);
  });

  test("example syntactic forms from doc all work", () => {
    expectWB("1 m").toBeCloseTo(1, 3);
    expectWB('2 m').toBeCloseTo(2, 3);
    expectWB("3 m 46 cm").toBeCloseTo(3.46, 3);
    expectWB("4 m 0 cm").toBeCloseTo(4.0, 3);
    expectWB("5m62cm").toBeCloseTo(5.62, 3);
    expectWB(`3' 6"`).toBeCloseTo(1.0668, 3);
    expectWB(`${2*3} m`).toBeCloseTo(6, 3);
    expectWB("4.56 m").toBeCloseTo(4.56, 3);
    expectWB("-8 m").toBeCloseTo(-8, 3);
    expectWB("+9 m").toBeCloseTo(9, 3);
  });

  test("variations on forms", () => {
    expectWB(worldM("387 m")).toBeCloseTo(387);
    expectWB(worldM(0)).toEqual(0);
    expectWB(worldM("0")).toEqual(0);
    expect((worldM("1 in")).toString()).toEqual('worldM("0.0254 m")');
  });

  test("Distance.plus() works", () => {
    const p = worldM("3 m");
    const z = worldM("0 m");
    const a = worldM("  8   m   ");
    expect(p.plus(a)._toBare()).toBeCloseTo(11);
    expect(p.plus(z)._toBare()).toBeCloseTo(3);
    expect(p.plus("2 m")._toBare()).toBeCloseTo(5);
    expect(p.plus("-10 m")._toBare()).toBeCloseTo(-7);
    expect(() => (p.plus())).toThrow();
    expect(() => (p.plus("xyz"))).toThrow();
  });

  test("Distance.minus() works", () => {
    const p = worldM("6 m");
    const q = worldM("7 m");
    expect(p.minus(q)._toBare()).toBeCloseTo(-1);
    expect(p.minus("4 m")._toBare()).toBeCloseTo(2);
  });

  test("Distance.times() works", () => {
    const p = worldM("11 m");
    expect(p.times(0)._toBare()).toBe(0);
    expect(p.times(1)._toBare()).toBeCloseTo(11);
    expect(p.times(10)._toBare()).toBeCloseTo(110);
    expect(p.times(-2)._toBare()).toBeCloseTo(-22);
    expect(() => (p.times("foo"))).toThrow();
    expect(() => (p.times())).toThrow();
  });

  test("Distance.dividedBy() works", () => {
    const p = worldM("100 m");
    const q = worldM("20 m");
    expect(p.dividedBy(q)).toBeCloseTo(5);
    expect(p.dividedBy(40)._toBare()).toBeCloseTo(2.5);
    expect(p.dividedBy("2 m")).toBeCloseTo(50);
    expect(() => (p.dividedBy("foo"))).toThrow();
  });

  test("illegal formats detected", () => {
    expect(() => worldM("4 m cm")).toThrow();
    expect(() => worldM("3 * 8 m")).toThrow();
    expect(() => worldM("m 8")).toThrow();
    expect(() => worldM("10 toes")).toThrow();
    expect(() => worldM("0 m").plus(2)).toThrow();
    expect(() => worldM("3 m").plus()).toThrow();
    expect(() => worldM("2.5 m").times("5")).toThrow();
  });
});

describe("ConversionFactor.scale()", () => {
  function checkEntry(key, ratio) {
    const entry = ConversionFactors.scale(key);
      expect(entry.ratio).toBe(ratio);
      expect(typeof entry.description).toBe('string');
  }

  test("scale factors are correct", () => {
    checkEntry("10000000:1", 10000000);
    checkEntry("2:1", 2);
    checkEntry("fullSize", 1);
    checkEntry("1:1", 1);
    checkEntry("4:5", 4/5);
    checkEntry("1:2", 1/2);
    checkEntry("1:10.5", 1/10.5);
    checkEntry("F", 1/20.3);
    checkEntry("G", 1/22.5);
    checkEntry("#3", 1/22.5);
    checkEntry("#2", 1/29);
    checkEntry("#1", 1/32);
    checkEntry("O", 1/48);
    checkEntry("S", 1/64);
    checkEntry("OO", 1/76.2);
    checkEntry("HO", 1/87.1);
    checkEntry("TT", 1/120);
    checkEntry("N", 1/160);
    checkEntry("Z", 1/220);
    checkEntry("T", 1/450);
    checkEntry("1:10000000", 0.0000001);
    expect(() => (ConversionFactors.scale("foo"))).toThrow();
    expect(() => (ConversionFactors.scale("0:1"))).toThrow();
    expect(() => (ConversionFactors.scale("a:4"))).toThrow();
    expect(() => (ConversionFactors.scale("3:b"))).toThrow();
    expect(() => (ConversionFactors.scale("2:4:8"))).toThrow();
  });
});

describe("vector", () => {
  const p1 = vector("10 ft", "20 in");
  const p2 = vector(worldM("3 ft 5 in"), worldM( "1 ft 7 in"));
  
  test("vector.constructor works", () => {
    expect(p1).toBeInstanceOf(MeasurementPair);
    expect(p1.x()._toBare()).toBeCloseTo(3.048, 3);
    expect(p1.y()._toBare()).toBeCloseTo(0.508, 4);
    const p3 = vector("17 m 3 cm", "38 mm");
    expect(p3.toString()).toEqual(
      'vector(worldM("17.03 m"), worldM("0.038 m"))');
  });

  test("DPair.plus() works", () => {
    expect(p2.x()._toBare()).toBeCloseTo(1.0414, 3);
    expect(p2.y()._toBare()).toBeCloseTo(0.4826, 4);
    var p3 = p1.plus(["3 ft -2 in", "4 ft 0 in"]);
    expect(p3.x()._toBare()).toBeCloseTo(3.9116, 3);
    expect(p3.y()._toBare()).toBeCloseTo(1.7272);
    p3 = p1.plus(vector(worldM("33 in"), "48 in"));
    expect(p3.x()._toBare()).toBeCloseTo(3.8862, 3);
    expect(p3.y()._toBare()).toBeCloseTo(1.7272, 3);
    p3 = p1.plus(vector("3 ft -2 in", "4 ft 0 in"));
    expect(p3.x()._toBare()).toBeCloseTo(3.9116, 3);
    expect(p3.y()._toBare()).toBeCloseTo(1.7272);
    var p4 = p1.plus([worldM("-4 in"), worldM( "-12 in")]);
    expect(p4.x()._toBare()).toBeCloseTo(2.9464, 3);
    expect(p4.y()._toBare()).toBeCloseTo(0.2032, 4);
    expect(p3._comp).toBe(p4._comp);
    expect(() => (p3.plus())).toThrow();
    expect(() => (p3.plus("foo", "bar"))).toThrow();
    expect(() => (p3.plus("foo", "bar", "baz"))).toThrow();
  });

  test("DPair.minus() works", () => {
    var p3 = p1.minus(["5 ft", "10 in"]);
    expect(p3.x()._toBare()).toBeCloseTo(1.524, 3);
    expect(p3.y()._toBare()).toBeCloseTo(0.254, 4);
    p3 = p1.minus(vector("5 ft", "10 in"));
    expect(p3.x()._toBare()).toBeCloseTo(1.524, 3);
    expect(p3.y()._toBare()).toBeCloseTo(0.254, 4);
    expect(() => (p3.minus("bar"))).toThrow();
  });

  test("DPair.times() works", () => {
    var p3 = p1.times(2);
    expect(p3.x()._toBare()).toBeCloseTo(6.096, 3);
    expect(p3.y()._toBare()).toBeCloseTo(1.016, 3);
    expect(() => (p3.times("zebra"))).toThrow();
  });

  test("DPair.dividedBy() works", () => {
    var p3 = p1.dividedBy(2);
    expect(p3.x()._toBare()).toBeCloseTo(1.524, 3);
    expect(p3.y()._toBare()).toBeCloseTo(0.254,4);
    expect(() => (p3.times("lions"))).toThrow();
  });

  test("bad arguments detected", () => {
    expect(() => (vector())).toThrow();
    expect(() => (vector(5))).toThrow();
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

  test("AffineTransformation.applyToXY() works", () => {
    const pt = vector("3 m", "5 m");

    var result = (new Resize(2)).applyToXY(pt);
    expect(result.x).toBeCloseTo(6, 3);
    expect(result.y).toBeCloseTo(10, 3);

    result = (new Translate("-1 m", "2 m")).applyToXY(pt);
    expect(result.x).toBeCloseTo(2, 3);
    expect(result.y).toBeCloseTo(7, 3);

    result = (new Rotate(ROT90)).applyToXY(pt);
    expect(result.x).toBeCloseTo(-5, 3);
    expect(result.y).toBeCloseTo(3, 3);

    result = (new Rotate(ROT180)).applyToXY(pt);
    expect(result.x).toBeCloseTo(-3, 3);
    expect(result.y).toBeCloseTo(-5, 3);

    result = (new Rotate(ROT270)).applyToXY(pt);
    expect(result.x).toBeCloseTo(5, 3);
    expect(result.y).toBeCloseTo(-3, 3);

    result = (new ReflectAroundXAxis()).applyToXY(pt);
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

    const p1 = point("3 m", "5 m");
    const resize2 = new Resize(2);
    const translate21 = new Translate("-2 m", "+1 m");
    var results = resize2.compose(translate21).applyToXY(p1);
    expect(results.x).toBeCloseTo(2, 3);
    expect(results.y).toBeCloseTo(12, 3);

    results = translate21.compose(resize2).applyToXY(p1);
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
    constructor(oldOptions, newOptions, width, height, drawColor, fillColor) {
      super(oldOptions, newOptions);
      this._width = worldM(width);
      this._height = worldM(height);
      this._drawColor = drawColor;
      this._fillColor = fillColor;
    }

    getWidth() {
      return this._width;
    }

    getHeight() {
      return this._height;
    }

    render(pen) {
      const inc = worldM("1 m");

      const x0 = worldM(0);
      const x2 = x0.plus(this._width.times(0.5));
      const x1 = x2.minus(inc);
      const x3 = x2.plus(inc);
      const x4 = x0.plus(this._width);

      const y0 = worldM(0);
      const y1 = y0.plus(this._height.times(0.25));
      const y3 = y0.plus(this._height.times(0.75));
      const y2 = y3.minus(inc);
      const y4 = y0.plus(this._height);

      const ptA = point(x0, y0);
      const ptB = point(x0, y4);
      const ptC = point(x4, y4);
      const ptD = point(x4, y0);
      const ptE = point(x2, y1);
      const ptF = point(x1, y2);
      const ptG = point(x2, y3);
      const ptH = point(x3, y2);

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
    build(oldOpt) {
      const newOpt = {};
      this.addPiece(new Box(oldOpt, newOpt, "17 m", "5 m", "black", "yellow"));
      this.addPiece(new Box(oldOpt, newOpt, "7 m", "5 m", "black", "orange"));
      this.addPiece(new Box(oldOpt, newOpt, "18 m", "11 m", "black", "red"));
      this.addPiece(new Box(oldOpt, newOpt, "11 m", "13 m", "white", "purple"));
      this.addPiece(new Box(oldOpt, newOpt, "9 m", "12 m", "white", "blue"));
      this.addPiece(new Box(oldOpt, newOpt, "6 m", "18 m", "white", "green"));
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
    expect(k.get("color")).toEqual("red");
    expect(k.get("number")).toEqual(5);
  });

  test("Kit.generate() invokes build()", () => {
    const k = new DummyKit();
    k.generate({planet: "Earth"});
    expect(k._pieceList.length).toEqual(6);
    expect(k.get("planet")).toEqual("Earth");
  });

  test("Kit.generate() invokes pack()", () => {
    const k = new DummyKit();
    k.generate({});
    expect(k._pieceList.length).toEqual(6);
    expect(k._pageList.length).toEqual(2);
    const p0 = k._pageList[0];
    var pieces = p0.allPieces();
    expect(pieces.length).toBe(3);
    expect(pieces[0]._position.toString()).toEqual('point(worldM("0 m"), worldM("0 m"))');
    expect(pieces[1]._position.toString()).toEqual('point(worldM("0 m"), worldM("11 m"))');
    expect(pieces[2]._position.toString()).toEqual('point(worldM("11 m"), worldM("11 m"))');
    const p1 = k._pageList[1];
    pieces = p1.allPieces();
    expect(pieces.length).toBe(3);
    expect(pieces[0]._position.toString()).toEqual('point(worldM("0 m"), worldM("0 m"))');
    expect(pieces[1]._position.toString()).toEqual('point(worldM("9 m"), worldM("0 m"))');
    expect(pieces[2]._position.toString()).toEqual('point(worldM("0 m"), worldM("18 m"))');
  });

  test("Kit.generate() invokes render()", () => {
    const k = new DummyKit();
    k.generate({});
    // FIX ME - add some tests here to verify graphics calls to pdf
  });
});

