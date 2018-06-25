let isnode = typeof window === "undefined";

function indent(text, level = 1) {
  return text.replace(/^/gm, "  ".repeat(level));
}

function mirror(text, reverse = true) {
  let mirrorMap = "()[]{}<>\\/", output = "";
  for (let char of text) {
    let index = mirrorMap.indexOf(char);
    if (index > -1)
      char = mirrorMap[index ^ 1];
    
    output = reverse ? char + output : output + char;
  }
  return output;
}

function defProps(target, properties) {
	for (var key in properties) properties[key] = { value: properties[key], writable: true };
	Object.defineProperties(target, properties);
}

defProps(Array.prototype, {
  get: function (index) {
    if (index < 0) index += this.length;
    return this[index];
  },
  set: function (index, item) {
    if (index < 0) index += this.length;
    return this[index] = item;
  },
  mapAt: function (index, f) {
    if (index < 0) index += this.length;
    return this[index] = f(this[index]);
  }
});

let Japt = {
  
  codepage: "₀₁₂₃₄₅₆₇₈₉₊₋₍₎¼¾⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁽⁾½⅟ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~¶"
          + "ẠḄḌẸḤỊḲḶṂṆỌṚṢṬỤṾẈỴẒȦḂĊḊĖḞĠḢİĿṀṄȮṖṘṠṪẆẊẎŻạḅḍẹḥịḳḷṃṇọṛṣṭụṿẉỵẓȧḃċḋėḟġḣıŀṁṅȯṗṙṡṫẇẋẏżàáâæèéêìíîòóôùúû≈≠≡≢≤≥∧∨................‹›«»“‟”„",
  
  methodNames: "abcdefghijklmnopqrstuvwxyzạḅḍẹḥịḳḷṃṇọṛṣṭụṿẉỵẓȧḃċḋėḟġḣıŀṁṅȯṗṙṡṫẇẋẏżàáâæèéêìíîòóôùúû",
  
  transpile: function(code_Japt, isBinary = false) {
    // Converts from the Japt codepage to UTF-8 for easier processing.
    if (isBinary) {
      code_Japt = code_Japt.replace(/[^]/g, x => Japt.codepage[x.charCodeAt()]);
    }
    
    // Replaces literal newlines and tabs for easier processing.
    code_Japt = code_Japt
      .replace(/\n/g, '¶')
      .replace(/\t/g, 'ṭ');
    
    // Handles the actual transpilation of the code.
    function subtranspile(code) {
      let outp, currLevels = [""];
      
      // Starts a new level.
      function levelStart() {
        currLevels.push("");
      }
      // Appends JS code to the current level.
      function levelAppend(str) {
        currLevels.mapAt(-1, obj => obj + str);
      }
      // Prepends JS code to the current level.
      function levelPrepend(str) {
        currLevels.mapAt(-1, obj => str + obj);
      }
      // Ends the current level, appending it to the previous one.
      function levelEnd(str = "") {
        str = currLevels.pop() + str;
        levelAppend(str);
      }
      // Makes the transpiler behave as if the given code were next in the source.
      function useJapt(str) {
        code = str + code;
      }
      
      while ( code.length > 0 ) {
        let char = code[0]; code = code.slice(1);
        
        if ("([".includes(char)) {
          // Append to the level and start a new one.
          levelAppend(char);
          levelStart();
        }
        else if (Japt.methodNames.includes(char)) {
          // Turn it into a method call and start a new level.
          levelAppend("." + char + "(");
          levelStart();
        }
        else if (char === " ") {
          // Append a paren, and end the level if possible, prepend another paren if not.
          levelAppend(")");
          if (currLevels.length > 1 && currLevels.get(-2).slice(-1) === "(")
            levelEnd();
          else
            levelPrepend("(");
        }
        else if (char === ")") {
          // Pretend we ran across two spaces.
          useJapt("  ");
        }
        else if (char === "]") {
          // Close as many parens as possible.
          while (currLevels.length > 1 && currLevels.get(-2).slice(-1) === "(")
            levelEnd(")");
          
          // Append a bracket, and end the level if possible, prepend another bracket if not.
          levelAppend("]");
          if (currLevels.length > 1 && currLevels.get(-2).slice(-1) === "[")
            levelEnd();
          else 
            levelPrepend("[");
        }
        else {
          // Fallback: append directly to the level.
          levelAppend(char);
        }
      }
      
      while (currLevels.length > 1) {
        levelEnd(mirror(currLevels.get(-2).slice(-1)));
      }
      
      return currLevels[0];
    }
    
    let outp = subtranspile(code_Japt);
    
    // Adds a return keyword to the last statement.
    let returnIndex = outp.lastIndexOf(';') + 1;
    let code_JS = outp.slice(0, returnIndex) + 'return ' + outp.slice(returnIndex);
    
    return '(function program(input, U, V, W, X, Y, Z) {\n' + indent(code_JS) + '\n})';
  }
  
};

if (isnode) module.exports = Japt;
