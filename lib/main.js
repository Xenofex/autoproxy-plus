let data = require('sdk/self').data;
let sp = require("sdk/simple-prefs");

require('./dropdown.js').init();
let x = require('./proxy_rules.js').getParsedRules();

require('./proxy').init();

// let gfwlist = data.load('gfwlist.txt');
// console.log(gfwlist.length);



// let File = require('sdk/io/file'); 

// let parsedRules = require('./proxy_rules.js').getParsedRules();

// var file = File.open('C:\\Users\\Xenofex\\Sandbox\\javascript\\autoproxy\\autoproxyplus\\parsed_rules.json', 'w');

// try {
//     file.write(JSON.stringify(parsedRules, null, '\t'));
//     console.log('parsed_rules.json is written.');
// } finally {
//     file.close();
// }
