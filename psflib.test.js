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
const Point = psflib.Point;

function expectDist(s) {
  return expect(new Distance(s)._value);
}

describe("dist", () => {
  test("single metric units work", () => {
    expectDist("1 m").toBeCloseTo(1, 3);
    expectDist("2 meter").toBeCloseTo(2, 3);
    expectDist("3.5 meters").toBeCloseTo(3.5, 3);
    expectDist("4 metre").toBeCloseTo(4, 3);
    expectDist("-0.05 metres").toBeCloseTo(-0.05, 5);
    expectDist("1.23 km").toBeCloseTo(1230);
    expectDist("1.34 kilometer").toBeCloseTo(1340);
    expectDist("2.34 kilometers").toBeCloseTo(2340);
    expectDist("3.45 kilometre").toBeCloseTo(3450);
    expectDist("4.567 kilometres").toBeCloseTo(4567);
    expectDist("34.5 cm").toBeCloseTo(0.345, 4);
    expectDist("23 centimeter").toBeCloseTo(0.23, 4);
    expectDist("2 centimeters").toBeCloseTo(0.02, 5);
    expectDist("0.43 centimetre").toBeCloseTo(0.0043, 6);
    expectDist("0.001 centimetres").toBeCloseTo(0.00001, 8);
    expectDist("146 mm").toBeCloseTo(0.146, 4);
    expectDist("89 millimeter").toBeCloseTo(0.089, 5);
    expectDist("3 millimeters").toBeCloseTo(0.003, 6);
    expectDist("63 millimetre").toBeCloseTo(0.063, 5);
    expectDist("1 millimetres").toBeCloseTo(0.001, 6);
  });

  test("single US units work", () => {
    expectDist("2 inch").toBeCloseTo(0.0508, 5);
    expectDist("3 inches").toBeCloseTo(0.0762, 5);
    expectDist("4 in").toBeCloseTo(0.1016, 4);
    expectDist('6"').toBeCloseTo(0.1524, 4);
    expectDist("3.5 foot").toBeCloseTo(1.0668, 3);
    expectDist("2 feet").toBeCloseTo(0.6096, 4);
    expectDist("10 ft").toBeCloseTo(3.048, 3);
    expectDist("4'").toBeCloseTo(1.2192, 3);
    expectDist("0.4 yard").toBeCloseTo(0.36576, 4);
    expectDist("1.7 yards").toBeCloseTo(1.55448, 3);
    expectDist("5 yd").toBeCloseTo(4.572, 3);
    expectDist("1 barleycorn").toBeCloseTo(0.00846667, 6);
    expectDist("2 barleycorns").toBeCloseTo(0.0169333, 5);
    expectDist("3 furlong").toBeCloseTo(603.504);
    expectDist("4 furlongs").toBeCloseTo(804.672);
    expectDist("5 chain").toBeCloseTo(100.584);
    expectDist("6 chains").toBeCloseTo(120.701);
    expectDist("7 rod").toBeCloseTo(35.204);
    expectDist("8 rods").toBeCloseTo(40.2336);
    expectDist("9 link").toBeCloseTo(1.809, 3);
    expectDist("10 links").toBeCloseTo(2.01, 3);
    expectDist("11 cubit").toBeCloseTo(5.0292, 3);
    expectDist("12 cubits").toBeCloseTo(5.4864, 3);
    expectDist("13 fathom").toBeCloseTo(23.7744);
    expectDist("14 fathoms").toBeCloseTo(25.6032);
    expectDist("15 league").toBeCloseTo(83340);
    expectDist("16 leagues").toBeCloseTo(88896);
  });

  test("multiple units and non-spaced work", () => {
    expectDist('1 ft 3"').toBeCloseTo(0.381, 4);
  });

  test("illegal formats detected", () => {
  });
});


describe("Point", () => {
  const p1 = new Point(null, "10 in", "20 in");
  const p2 = new Point(null, "3 ft 5 in", "1 ft 7 in");

  test("point is created", () => {
    expect(p1).toBeInstanceOf(Point);
  });

  test("input coordinates available", () => {
    expect(p1.inX()._value).toBeCloseTo(0.254, 4);
    expect(p1.inY()._value).toBeCloseTo(0.508, 4);
  });

  test("feet-and-inches working", () => {
    expect(p2.inX()._value).toBeCloseTo(1.0414, 3);
    expect(p2.inY()._value).toBeCloseTo(0.4826, 4);
    var p3 = p1.move("3 ft -2 in", "4 ft 0 in");
    expect(p3.inX()._value).toBeCloseTo(1.1176, 3);
    expect(p3.inY()._value).toBeCloseTo(1.7272);
  });

  test("move() produces correct new Point", () => {
    var p3 = p1.move("33 in", "48 in");
    expect(p3.inX()._value).toBeCloseTo(1.0922, 3);
    expect(p3.inY()._value).toBeCloseTo(1.7272, 3);
    var p4 = p1.move("-4 in", "-12 in");
    expect(p4.inX()._value).toBeCloseTo(0.1524, 4);
    expect(p4.inY()._value).toBeCloseTo(0.2032, 4);
    expect(p3._parent).toBe(p4._parent);
  });

  test("output coordinates available", () => {
    expect(p1.outX()._value).toBe(111);
    expect(p1.outY()._value).toBe(222);
  });

  test("bad arguments detected", () => {
    expect(() => (new Point())).toThrow();
    expect(() => (new Point(null, 5))).toThrow();
    expect(() => (p1.move())).toThrow();
    expect(() => (p1.move(1, 2, 3))).toThrow();
  });
});

