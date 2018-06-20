let isnode = typeof window === "undefined";

function indent(text, level = 1) {
  return text.replace(/^/gm, "  ".repeat(level));
}

let Japt = {
  
  transpile: function(code_Japt) {
    let code_JS;
    // TODO: transpile code
    let returnIndex = code_Japt.lastIndexOf(';') + 1;
    code_JS = code_Japt.slice(0, returnIndex) + 'return ' + code_Japt.slice(returnIndex);
    return '(function program(input, U, V, W, X, Y, Z) {\n' + indent(code_JS) + '\n})';
  }
  
};

if (isnode) module.exports = Japt;
