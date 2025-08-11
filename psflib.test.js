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

describe("Point", () => {
    const p1 = new Point(null, 10, 20);
    const p2 = new Point(null, 3, 5, 1, 7);

    test("point is created", () => {
        expect(p1 instanceof Point);
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

