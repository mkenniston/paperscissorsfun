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
const distanceBetween = psflib.distanceBetween;
const ConversionFactors = psflib.ConversionFactors;
const dPairify = psflib.dPairify;
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

    g.windowWidth = distancify(this.get("windowWidth"));
    g.atticWindowWidth = distancify(this.get("atticWindowWidth"));
    g.doorWidth = distancify(this.get("doorWidth"));
    g.houseWidth = distancify(this.get("houseWidth"));
    g.spacing = g.houseWidth.minus(g.windowWidth).minus(g.doorWidth).dividedBy(3);
    g.xMid = g.houseWidth.dividedBy(2);
    g.foundationHeight = distancify(this.get("foundationHeight"));
    g.storyHeight = distancify(this.get("storyHeight"));
    g.ridgeHeight = distancify(this.get("ridgeHeight"));
    g.windowBaseHeight = distancify(this.get("windowBaseHeight"));

    g.xA = distancify(0);
    g.xB = g.xA.plus(g.spacing);
    g.xC = g.xB.plus(g.windowWidth);
    g.xD = g.xMid.minus(g.atticWindowWidth).dividedBy(2);
    g.xE = g.xMid;
    g.xF = g.xD.plus(g.atticWindowWidth);
    g.xG = g.xC.plus(g.spacing);
    g.xH = g.xG.plus(g.doorWidth);
    g.xI = g.xH.plus(g.spacing);

    g.yGround = distancify(0);
    g.yFirstFloor = g.yGround.plus(g.foundationHeight);
    g.ySecondFloor = g.yFirstFloor.plus(g.storyHeight);
    g.yEaves = g.ySecondFloor.plus(g.storyHeight);
    g.yRidge = g.yEaves.plus(g.ridgeHeight);

    g.wallOutline = [
      dPairify(g.xA, g.yGround), dPairify(g.xA, g.yEaves),
      dPairify(g.xE, g.yRidge), dPairify(g.xI, g.yEaves),
      dPairify(g.xI, g.yGround) ];

    g.basementOutline = [
      dPairify(g.xA, g.yGround), dPairify(g.xA, g.foundationHeight),
      dPairify(g.xI, g.foundationHeight), dPairify(g.xI, g.yGround) ];

    const window1 = new Window(this._options, {});
    var position = dPairify(g.xB, g.yFirstFloor.plus(g.windowBaseHeight));
    this.addSubComponent(window1, position);
    const window2 = new Window(this._options, {});
    position = dPairify(g.xB, g.ySecondFloor.plus(g.windowBaseHeight));
    this.addSubComponent(window2, position);
    const window3 = new Window(this._options, {});
    position = dPairify(g.xG, g.ySecondFloor.plus(g.windowBaseHeight));
    this.addSubComponent(window3, position);
    const door1 = new Door(this._options, {});
    position = dPairify(g.xG, g.foundationHeight);
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

    g.houseDepth = distancify(this.get("houseDepth"));
    g.foundationHeight = distancify(this.get("foundationHeight"));
    g.windowBaseHeight = distancify(this.get("windowBaseHeight"));
    g.storyHeight = distancify(this.get("storyHeight"));
    g.windowWidth = distancify(this.get("windowWidth"));

    g.xA = distancify(0);
    g.xQ = g.xA.plus(g.houseDepth);
    g.yGround = distancify(0);
    g.yFirstFloor = g.yGround.plus(g.foundationHeight);
    g.ySecondFloor = g.yFirstFloor.plus(g.storyHeight);
    g.yEaves = g.ySecondFloor.plus(g.storyHeight);

    g.wallOutline = [
      dPairify(g.xA, g.yGround), dPairify(g.xA, g.yEaves),
      dPairify(g.xQ, g.yEaves), dPairify(g.xQ, g.yGround) ];

    g.basementOutline = [
      dPairify(g.xA, g.yGround),
      dPairify(g.xA, g.foundationHeight),
      dPairify(g.houseDepth, g.foundationHeight),
      dPairify(g.houseDepth, g.yGround) ];

    const allWindows = g.windowWidth.times(3);
    const spacing = g.houseDepth.minus(allWindows).dividedBy(4);
    const increment = spacing.plus(g.windowWidth);
    for (let row = 0; row < 2; row++) {
      const base = g.yFirstFloor.plus(g.windowBaseHeight);
      const y = g.storyHeight.times(row).plus(base);
      for (let col = 0; col < 3; col++) {
        const x = increment.times(col).plus(spacing);
        const w = new Window(this._options, {});
        const position = dPairify(x, y);
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

    g.windowWidth = distancify(this.get("windowWidth"));
    g.windowHeight = distancify(this.get("windowHeight"));

    g.xLeft = distancify(0);
    g.xRight = g.xLeft.plus(g.windowWidth);
    g.xMid = g.xLeft.plus(g.windowWidth.dividedBy(2));
    g.yBottom = distancify(0);
    g.yTop = g.yBottom.plus(g.windowHeight);
    g.yMid = g.yBottom.plus(g.windowHeight.dividedBy(2));

    g.outline = [
      dPairify(g.xMid, g.yTop), dPairify(g.xMid, g.yBottom),
      dPairify(g.xLeft, g.yBottom), dPairify(g.xLeft, g.yTop),
      dPairify(g.xRight, g.yTop), dPairify(g.xRight, g.yBottom),
      dPairify(g.xLeft, g.yBottom), dPairify(g.xLeft, g.yMid),
      dPairify(g.xRight, g.yMid) ];

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

    g.windowWidth = distancify(this.get("windowWidth"));
    g.windowHeight = distancify(this.get("windowHeight"));
    g.windowBaseHeight = distancify(this.get("windowBaseHeight"));

    g.xLeft = distancify(0);
    g.xRight = g.xLeft.plus(g.windowWidth);
    g.yBottom = distancify(0);
    g.yDoorTop = g.windowHeight.plus(g.windowBaseHeight);

    g.outline = [
      dPairify(g.xLeft, g.yBottom), dPairify(g.xLeft, g.yDoorTop),
      dPairify(g.xRight, g.yDoorTop), dPairify(g.xRight, g.yBottom) ];
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

    g.houseWidth = distancify(this.get("houseWidth"));
    g.houseDepth = distancify(this.get("houseDepth"));
    g.ridgeHeight = distancify(this.get("ridgeHeight"));

    g.x0 = distancify(0);
    g.x1 = g.houseDepth;
    g.y0 = distancify(0);
    const p1 = dPairify(0, 0);
    const p2 = dPairify(g.houseWidth.dividedBy(2), g.ridgeHeight);
    g.y1 = distanceBetween(p1, p2);

    g.outline = [
      dPairify(g.x0, g.y0), dPairify(g.x0, g.y1),
      dPairify(g.x1, g.y1), dPairify(g.x1, g.y0) ];
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
