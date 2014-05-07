let data = require('sdk/self').data;
let sp = require("sdk/simple-prefs");

require('./ui.js').init();
require('./proxy').init();

var system = require("sdk/system");
// PATH environment variable
console.log(system.env.PATH);
// operating system
console.log("platform = " + system.platform);
// processor architecture
console.log("architecture = " + system.architecture);
// compiler used to build host application
console.log("compiler = " + system.compiler);
// host application build identifier
console.log("build = " + system.build);
// host application UUID
console.log("id = " + system.id);
// host application name
console.log("name = " + system.name);
// host application version
console.log("version = " + system.version);
// host application vendor
console.log("vendor = " + system.vendor);
// host application profile directory
console.log("profile directory = " + system.pathFor("ProfD"));
