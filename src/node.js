#!/usr/bin/env node
// Stolen from Crayon
let Japt = require('./japt');

let fs = require("fs");

(function(){
  let programArgs = process.argv.slice(2),
      debug = false,
      encoding = 'binary',
      codeFile, inputFile,
      code, args = [];

  function readFile(name, encoding = "utf8") {
    let content;

    try {
      content = fs.readFileSync(name, {encoding});
    } catch (e) {
      console.log('Error: Could not find file at ' + name);
      return null;
    }

    return content.toString().replace(/\r\n/g, "\n");
  }

  for (let i = 0; i < programArgs.length; i++) {
    let item = programArgs[i];
    if (/^-\D+$/.test(item)) {
      if (/u/.test(item))
        encoding = 'utf8';
      if (/i/.test(item))
        inputFile = programArgs[++i];
    }
    else if (!codeFile) {
      codeFile = item;
    }
    else {
      try {
        item = eval(item);
      }
      catch (e) {}
      args.push(item);
    }
  }

  if (codeFile) {
    code = readFile(codeFile, encoding);
    if (code === null) return;
  }
  else {
    console.log("Please provide a program file.");
    return;
  }

  let code_JS = Japt.transpile(code, true);
  let program = eval(code_JS);
  let result = program("", ...args);
  process.stdout.write(result + "");
})();

module.exports = Japt;
