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

const bpjs = require('./bin-pack.js');

describe("bin-pack", () => {
  // bin-pack is 3rd-party software that came without unit tests,
  // so this just does a basic sanity check.

  function comparator(a, b) {
    return (a.width * a.height, b.width * b.height);
  }

  var boxList = [
    {width: 2, height: 2, name: "box4"},
    {width: 1, height: 3, name: "box2"},
    {width: 4, height: 1, name: "box3"},
    {width: 3, height: 4, name: "box1"},
    {width: 4, height: 2, name: "box5"},
    {width: 3, height: 3, name: "box6"},
    {width: 4, height: 1, name: "box7"},
    {width: 1, height: 4, name: "box8"},
  ];

  function setupPagePacker(boxList) {
    var pp = bpjs.BinPack();
    pp.binWidth(4).binHeight(5);
    pp.sort(comparator);
    pp.addAll(boxList);
    return pp;
  }

  const pageList = [];
  while (boxList.length > 0) {
    const pp = setupPagePacker(boxList);
    const filled = pp.positioned;
    const unfilled = pp.unpositioned;

    const page = [];
    for (const item of filled) {
      page.push(item.datum);
    }
    pageList.push(page);

    boxList = [];
    for (const item of unfilled) {
      boxList.push(item.datum);
    }
  }

  test("rectangles bin-packed into pages correctly", () => {
    expect(pageList.length).toBe(3);
    expect(pageList[0].length).toBe(3);
    expect(pageList[0][0].name).toEqual("box4");
    expect(pageList[0][1].name).toEqual("box2");
    expect(pageList[0][2].name).toEqual("box6");
    expect(pageList[1].length).toBe(3);
    expect(pageList[1][0].name).toEqual("box3");
    expect(pageList[1][1].name).toEqual("box1");
    expect(pageList[1][2].name).toEqual("box8");
    expect(pageList[2].length).toBe(2);
    expect(pageList[2][0].name).toEqual("box5");
    expect(pageList[2][1].name).toEqual("box7");
  });
});

