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

class SimpleHouse extends Kit {

  getDefaultOptions() {
    return {
      houseWidth: "20 ft",
      windowWidth: "3 ft",
      doorWidth: "4 ft",
      houseDepth: "30 ft",
      foundationHeight: "2 ft",
      windowBaseHeight: "3 ft",
      windowHeight: "5 ft",
      storyHeight: "10 ft",
      ridgeHeight: "10 ft",
      atticWindowBaseHeight: "2 ft",
      atticWindowHeight: "2 ft",
      atticWindowWidth: "2 ft",
    };
  }

  build() {
    const southWall = new PeakedWall(this._options, {});
    this.addPiece(southWall);
    const northWall = new PeakedWall(this._options, {});
    this.addPiece(northWall);
    const eastWall = new StraightWall(this._options, {});
    this.addPiece(eastWall);
    const westWall = new StraightWall(this._options, {});
    this.addPiece(westWall);
    const eastRoof = new RoofSlab(this._options, {});
    this.addPiece(eastRoof);
    const westRoof = new RoofSlab(this._options, {});
    this.addPiece(westRoof);
  }
}

class PeakedWall extends Component {
  constructor(oldOptions, newOptions) {
    super(oldOptions, newOptions);
    const g = this._geometry;

    g.windowWidth = worldM(this.get("windowWidth"));
    g.atticWindowWidth = worldM(this.get("atticWindowWidth"));
    g.doorWidth = worldM(this.get("doorWidth"));
    g.houseWidth = worldM(this.get("houseWidth"));
    g.spacing = g.houseWidth.minus(g.windowWidth).minus(g.doorWidth).dividedBy(3);
    g.xMid = g.houseWidth.dividedBy(2);
    g.foundationHeight = worldM(this.get("foundationHeight"));
    g.storyHeight = worldM(this.get("storyHeight"));
    g.ridgeHeight = worldM(this.get("ridgeHeight"));
    g.windowBaseHeight = worldM(this.get("windowBaseHeight"));

    g.xA = worldM(0);
    g.xB = g.xA.plus(g.spacing);
    g.xC = g.xB.plus(g.windowWidth);
    g.xD = g.xMid.minus(g.atticWindowWidth).dividedBy(2);
    g.xE = g.xMid;
    g.xF = g.xD.plus(g.atticWindowWidth);
    g.xG = g.xC.plus(g.spacing);
    g.xH = g.xG.plus(g.doorWidth);
    g.xI = g.xH.plus(g.spacing);

    g.yGround = worldM(0);
    g.yFirstFloor = g.yGround.plus(g.foundationHeight);
    g.ySecondFloor = g.yFirstFloor.plus(g.storyHeight);
    g.yEaves = g.ySecondFloor.plus(g.storyHeight);
    g.yRidge = g.yEaves.plus(g.ridgeHeight);

    g.wallOutline = [
      point(g.xA, g.yGround), point(g.xA, g.yEaves),
      point(g.xE, g.yRidge), point(g.xI, g.yEaves),
      point(g.xI, g.yGround) ];

    g.basementOutline = [
      point(g.xA, g.yGround), point(g.xA, g.foundationHeight),
      point(g.xI, g.foundationHeight), point(g.xI, g.yGround) ];

    const window1 = new Window(this._options, {});
    var position = point(g.xB, g.yFirstFloor.plus(g.windowBaseHeight));
    this.addSubComponent(window1, position);
    const window2 = new Window(this._options, {});
    position = point(g.xB, g.ySecondFloor.plus(g.windowBaseHeight));
    this.addSubComponent(window2, position);
    const window3 = new Window(this._options, {});
    position = point(g.xG, g.ySecondFloor.plus(g.windowBaseHeight));
    this.addSubComponent(window3, position);
    const door1 = new Door(this._options, {});
    position = point(g.xG, g.foundationHeight);
    this.addSubComponent(door1, position);
  }

  getWidth() {
    return this._geometry.houseWidth;
  }

  getHeight() {
    return this._geometry.yRidge;
  }

  render(pen) {
    pen.set({drawColor: "black", fillColor: this.get("wallColor")});
    pen.polygon(this._geometry.wallOutline, "fillAndStroke");
    pen.set({drawColor: "black", fillColor: this.get("basementColor")});
    pen.polygon(this._geometry.basementOutline, "fillAndStroke");
  }
}

class StraightWall extends Component {
  constructor(oldOptions, newOptions) {
    super(oldOptions, newOptions);
    const g = this._geometry;

    g.houseDepth = worldM(this.get("houseDepth"));
    g.foundationHeight = worldM(this.get("foundationHeight"));
    g.windowBaseHeight = worldM(this.get("windowBaseHeight"));
    g.storyHeight = worldM(this.get("storyHeight"));
    g.windowWidth = worldM(this.get("windowWidth"));

    g.xA = worldM(0);
    g.xQ = g.xA.plus(g.houseDepth);
    g.yGround = worldM(0);
    g.yFirstFloor = g.yGround.plus(g.foundationHeight);
    g.ySecondFloor = g.yFirstFloor.plus(g.storyHeight);
    g.yEaves = g.ySecondFloor.plus(g.storyHeight);

    g.wallOutline = [
      point(g.xA, g.yGround), point(g.xA, g.yEaves),
      point(g.xQ, g.yEaves), point(g.xQ, g.yGround) ];

    g.basementOutline = [
      point(g.xA, g.yGround),
      point(g.xA, g.foundationHeight),
      point(g.houseDepth, g.foundationHeight),
      point(g.houseDepth, g.yGround) ];

    const allWindows = g.windowWidth.times(3);
    const spacing = g.houseDepth.minus(allWindows).dividedBy(4);
    const increment = spacing.plus(g.windowWidth);
    for (let row = 0; row < 2; row++) {
      const base = g.yFirstFloor.plus(g.windowBaseHeight);
      const y = g.storyHeight.times(row).plus(base);
      for (let col = 0; col < 3; col++) {
        const x = increment.times(col).plus(spacing);
        const w = new Window(this._options, {});
        const position = point(x, y);
        this.addSubComponent(w, position);
      }
    }
  }

  getWidth() {
    return this._geometry.houseDepth;
  }

  getHeight() {
    return this._geometry.yEaves;
  }

  render(pen) {
    pen.set({drawColor: "black", fillColor: this.get("wallColor")});
    pen.polygon(this._geometry.wallOutline, "fillAndStroke");
    pen.set({drawColor: "black", fillColor: this.get("basementColor")});
    pen.polygon(this._geometry.basementOutline, "fillAndStroke");
  }
}

class Window extends Component {
  constructor(oldOptions, newOptions) {
    super(oldOptions, newOptions);
    const g = this._geometry;

    g.windowWidth = worldM(this.get("windowWidth"));
    g.windowHeight = worldM(this.get("windowHeight"));

    g.xLeft = worldM(0);
    g.xRight = g.xLeft.plus(g.windowWidth);
    g.xMid = g.xLeft.plus(g.windowWidth.dividedBy(2));
    g.yBottom = worldM(0);
    g.yTop = g.yBottom.plus(g.windowHeight);
    g.yMid = g.yBottom.plus(g.windowHeight.dividedBy(2));

    g.outline = [
      point(g.xMid, g.yTop), point(g.xMid, g.yBottom),
      point(g.xLeft, g.yBottom), point(g.xLeft, g.yTop),
      point(g.xRight, g.yTop), point(g.xRight, g.yBottom),
      point(g.xLeft, g.yBottom), point(g.xLeft, g.yMid),
      point(g.xRight, g.yMid) ];

  }

  getWidth() {
    return g.windowWidth;
  }

  getHeight() {
    return g.windowHeight;
  }

  render(pen) {
    pen.set({drawColor: this.get("trimColor")});
    pen.openPath(this._geometry.outline, "stroke");
  }
}

class Door extends Component {
  constructor(oldOptions, newOptions) {
    super(oldOptions, newOptions);
    const g = this._geometry;

    g.windowWidth = worldM(this.get("windowWidth"));
    g.windowHeight = worldM(this.get("windowHeight"));
    g.windowBaseHeight = worldM(this.get("windowBaseHeight"));

    g.xLeft = worldM(0);
    g.xRight = g.xLeft.plus(g.windowWidth);
    g.yBottom = worldM(0);
    g.yDoorTop = g.windowHeight.plus(g.windowBaseHeight);

    g.outline = [
      point(g.xLeft, g.yBottom), point(g.xLeft, g.yDoorTop),
      point(g.xRight, g.yDoorTop), point(g.xRight, g.yBottom) ];
  }

  getWidth() {
    return this._geometry.windowWidth;
  }

  getHeight() {
    return this._geometry.yDoorTop;
  }

  render(pen) {
    pen.set({drawColor: this.get("trimColor")});
    pen.openPath(this._geometry.outline, "stroke");
  }
}

class RoofSlab extends Component {
  constructor(oldOptions, newOptions) {
    super(oldOptions, newOptions);
    const g = this._geometry;

    g.houseWidth = worldM(this.get("houseWidth"));
    g.houseDepth = worldM(this.get("houseDepth"));
    g.ridgeHeight = worldM(this.get("ridgeHeight"));

    g.x0 = worldM(0);
    g.x1 = g.houseDepth;
    g.y0 = worldM(0);
    const p1 = point(0, 0);
    const p2 = point(g.houseWidth.dividedBy(2), g.ridgeHeight);
    g.y1 = (p1.minus(p2)).length();

    g.outline = [
      point(g.x0, g.y0), point(g.x0, g.y1),
      point(g.x1, g.y1), point(g.x1, g.y0) ];
  }

  getWidth() {
    return this._geometry.houseDepth;
  }

  getHeight() {
    return this._geometry.ridgeHeight;
  }

  render(pen) {
    pen.set({drawColor: "black", fillColor: "gray"});
    pen.polygon(this._geometry.outline, "fillAndStroke");
  }
}

function main() {
  const kit = new SimpleHouse();
  kit.generate({wallColor: "peachpuff",
                basementColor: "#BBBBBB",
                trimColor: "red"});
}

main();
