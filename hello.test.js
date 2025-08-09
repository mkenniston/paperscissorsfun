
const build = require('./hello');

kit = build();
test("kit exists", () => {
    expect(kit.name()).toBe("building");
});

