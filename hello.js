
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
