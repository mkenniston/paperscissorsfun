
function hello() {
    console.log("Hello, Universe!");
}

hello();

class Component {
    constructor(name) {
        this._name = name
	this._subComps = []
    }

    name() {
        return this._name;
    }

    render() {
        console.log(`rendering ${this._name}`);
        for (const sc of this._subComps) {
            sc.render();
        }
    }

    add(subComp) {
        this._subComps.push(subComp);
    }
}

class Wall extends Component {
}

class Window extends Component {
}

class Door extends Component {
}

function build() {
    front = new Wall("front wall")
    front.add(new Door("front door"));
    front.add(new Door("back door"));
    front.add(new Window("window #1"));
    front.add(new Window("window #2"));
    front.add(new Window("window #3"));
    kit = new Component("building");
    kit.add(front);
    return kit;
}

b = build();
b.render();
console.log(`done with component ${b.name()}`);

module.exports = build;

const { jsPDF } = require("jspdf");

function generatePdf() {
    const doc = new jsPDF(format="letter");
    console.log("generatePdf()");
    doc.polygon = function(points, scale, style, closed) {
        var x1 = points[0][0];
        var y1 = points[0][1];
        var cx = x1;
        var cy = y1;
        var acc = [];
        for(var i=1; i<points.length; i++) {
            var point = points[i];
            var dx = point[0]-cx;
            var dy = point[1]-cy;
            acc.push([dx, dy]);
            cx += dx;
            cy += dy;
        }
        this.lines(acc, x1, y1, scale, style, closed);
    }
    doc.text("Hello, world.", 10, 10);
    doc.text("Hello, continent", 20, 20);
    var points = [ [10, 30], [40, 40], [70, 30], [70, 100], [10, 100]];
    doc.setFillColor(255, 255, 0)
    doc.polygon(points, null, 'FD', true);
    console.log("finished file");
    doc.save("sample.pdf");
    console.log("saved file");
}

generatePdf();

