#!/usr/bin/env node
// Stolen from Crayon
let Japt = require('./japt');

let fs = require("fs");

(function(){
'use strict';

let args = process.argv.slice(2),
	debug = false,
    encoding = 'japt',
    codeFile, inputFile;

let code = args.shift();

function readFile(name) {
  let content;

  try {
    content = fs.readFileSync(name);
  } catch (e) {
    console.log('Error: Could not find file at ' + name);
    return null;
  }

  return content.toString().replace(/\r\n/g, "\n");
}

if (code) {
  code = readFile(code);
  if (code === null) return;
}
else {
  console.log("Please provide a program file.");
  return;
}

let code_JS = Japt.transpile(code);
process.stdout.write(eval(code_JS));
})();

module.exports = Japt;
