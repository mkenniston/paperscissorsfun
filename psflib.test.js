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
const Point = psflib.Point;
const toSI = psflib.toSI;

describe("toSI", () => {
  test("single metric units work", () => {
    expect(toSI("1 m")).toBeCloseTo(1);
    expect(toSI("2 meter")).toBeCloseTo(2);
    expect(toSI("3.5 meters")).toBeCloseTo(3.5);
    expect(toSI("4 metre")).toBeCloseTo(4);
    expect(toSI("-0.05 metres")).toBeCloseTo(-0.05, 4);
    expect(toSI("1.23 km")).toBeCloseTo(1230);
    expect(toSI("1.34 kilometer")).toBeCloseTo(1340);
    expect(toSI("2.34 kilometers")).toBeCloseTo(2340);
    expect(toSI("3.45 kilometre")).toBeCloseTo(3450);
    expect(toSI("4.567 kilometres")).toBeCloseTo(4567);
    expect(toSI("34.5 cm")).toBeCloseTo(0.345, 3);
    expect(toSI("23 centimeter")).toBeCloseTo(0.23, 3);
    expect(toSI("2 centimeters")).toBeCloseTo(0.02, 4);
    expect(toSI("0.43 centimetre")).toBeCloseTo(0.0043, 5);
    expect(toSI("0.001 centimetres")).toBeCloseTo(0.00001, 7);
    expect(toSI("146 mm")).toBeCloseTo(0.146, 3);
    expect(toSI("89 millimeter")).toBeCloseTo(0.089, 4);
    expect(toSI("3 millimeters")).toBeCloseTo(0.003, 5);
    expect(toSI("63 millimetre")).toBeCloseTo(0.063, 4);
    expect(toSI("1 millimetres")).toBeCloseTo(0.001, 5);
  });

  test("single US units work", () => {
    expect(toSI("2 inch")).toBeCloseTo(0.0508, 4);
    expect(toSI("3 inches")).toBeCloseTo(0.0762, 4);
    expect(toSI("4 in")).toBeCloseTo(0.1016, 3);
    expect(toSI('6"')).toBeCloseTo(0.1524, 3);
    expect(toSI("3.5 foot")).toBeCloseTo(1.0668);
    expect(toSI("2 feet")).toBeCloseTo(0.6096, 3);
    expect(toSI("10 ft")).toBeCloseTo(3.048);
    expect(toSI("4'")).toBeCloseTo(1.2192);
    expect(toSI("0.4 yard")).toBeCloseTo(0.36576, 3);
    expect(toSI("1.7 yards")).toBeCloseTo(1.55448);
    expect(toSI("5 yd")).toBeCloseTo(4.572);
    expect(toSI("1 barleycorn")).toBeCloseTo(0.00846667, 5);
    expect(toSI("2 barleycorns")).toBeCloseTo(0.0169333, 4);
    expect(toSI("3 furlong")).toBeCloseTo(603.504);
    expect(toSI("4 furlongs")).toBeCloseTo(804.672);
    expect(toSI("5 chain")).toBeCloseTo(100.584);
    expect(toSI("6 chains")).toBeCloseTo(120.701);
    expect(toSI("7 rod")).toBeCloseTo(35.204);
    expect(toSI("8 rods")).toBeCloseTo(40.2336);
    expect(toSI("9 link")).toBeCloseTo(1.809);
    expect(toSI("10 links")).toBeCloseTo(2.01168);
    expect(toSI("11 cubit")).toBeCloseTo(5.0292);
    expect(toSI("12 cubits")).toBeCloseTo(5.4864);
    expect(toSI("13 fathom")).toBeCloseTo(23.7744);
    expect(toSI("14 fathoms")).toBeCloseTo(25.6032);
    expect(toSI("15 league")).toBeCloseTo(83340);
    expect(toSI("16 leagues")).toBeCloseTo(88896);
  });

  test("multiple units and non-spaced work", () => {
    expect(toSI('1 ft 3"')).toBeCloseTo(0.381, 3);
  });

  test("illegal formats detected", () => {
  });
});


describe("Point", () => {
  const p1 = new Point(null, 10, 20);
  const p2 = new Point(null, 3, 5, 1, 7);

  test("point is created", () => {
    expect(p1).toBeInstanceOf(Point);
  });

  test("input coordinates available", () => {
    expect(p1.inX()).toBe(10);
    expect(p1.inY()).toBe(20);
  });

  test("feet-and-inches working", () => {
    expect(p2.inX()).toBe(41);
    expect(p2.inY()).toBe(19);
    var p3 = p1.move(3, -2, 4, 0);
    expect(p3.inX()).toBe(44);
    expect(p3.inY()).toBe(68);
  });

  test("move() produces correct new Point", () => {
    var p3 = p1.move(33, 48);
    expect(p3.inX()).toBe(43);
    expect(p3.inY()).toBe(68);
    var p4 = p1.move(-4, -12);
    expect(p4.inX()).toBe(6);
    expect(p4.inY()).toBe(8);
    expect(p3._parent).toBe(p4._parent);
  });

  test("output coordinates available", () => {
    expect(p1.outX()).toBe(111);
    expect(p1.outY()).toBe(222);
  });

  test("bad arguments detected", () => {
    expect(() => (new Point())).toThrow();
    expect(() => (new Point(null, 5))).toThrow();
    expect(() => (p1.move())).toThrow();
    expect(() => (p1.move(1, 2, 3))).toThrow();
  });
});

