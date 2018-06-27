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
    this[index] = f(this[index]);
    return this;
  }
});

let Japt = {
  
  codepage: "₀₁₂₃₄₅₆₇₈₉₊₋₍₎¼¾⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁽⁾½⅟ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~¶"
          + "ẠḄḌẸḤỊḲḶṂṆỌṚṢṬỤṾẈỴẒȦḂĊḊĖḞĠḢİĿṀṄȮṖṘṠṪẆẊẎŻạḅḍẹḥịḳḷṃṇọṛṣṭụṿẉỵẓȧḃċḋėḟġḣıŀṁṅȯṗṙṡṫẇẋẏżàáâæèéêìíîòóôùúû≈≠≡≢≤≥∧∨................‹›«»“‟”„",
  
  methodNames: "abcdefghijklmnopqrstuvwxyzạḅḍẹḥịḳḷṃṇọṛṣṭụṿẉỵẓȧḃċḋėḟġḣıŀṁṅȯṗṙṡṫẇẋẏżàáâæèéêìíîòóôùúû",
  variableNames: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  
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
      let currLevels = [[]];
      
      // Starts a new level.
      function levelStart() {
        currLevels.push([]);
      }
      // Appends JS code to the current object.
      function objectAppend(str) {
        if (currLevels.length === 0)
          currLevels.push([]);
        if (currLevels.get(-1).length === 0) 
          currLevels.get(-1).push("");
        currLevels.mapAt(-1, arr => arr.mapAt(-1, obj => obj + str));
      }
      // Prepends JS code to the current object.
      function objectPrepend(str) {
        if (currLevels.length === 0)
          currLevels.push([]);
        if (currLevels.get(-1).length === 0) 
          currLevels.get(-1).push("");
        currLevels.mapAt(-1, arr => arr.mapAt(-1, obj => str + obj));
      }
      // Appends an object to the current level.
      function levelAppend(obj) {
        currLevels.get(-1).push(obj);
      }
      // Prepends an object to the current level.
      function levelPrepend(obj) {
        currLevels.get(-1).shift(obj);
      }
      // Ends the current level, appending it to the last object in the previous one.
      function levelEnd(endchar) {
        let obj = currLevels.pop().join(", ") + endchar;
        if (currLevels.length === 0 || currLevels.get(-1).get(-1).slice(-1) !== mirror(endchar))
          obj = mirror(endchar) + obj;
        objectAppend(obj);
      }
      // Ends as many levels as possible with the given closing brackets.
      function levelEndAll(endchars) {
        while (true) {
          if (currLevels.length < 2)
            return;
          let lastchar = mirror(currLevels.get(-2).get(-1).slice(-1));
          if (!endchars.includes(lastchar))
            return;
          levelEnd(lastchar);
        }
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
          // If the last char was a digit, append a space (to avoid 5.toString() syntax errors).
          if (/\d/.test(currLevels.get(-1).get(-1).slice(-1)))
            objectAppend(" ");
          
          // Turn the letter into a method call and start a new level.
          objectAppend("." + char + "(");
          levelStart();
        }
        else if (char === " ") {
          // End the level with a paren.
          levelEnd(")");
        }
        else if (char === ")") {
          // Pretend we ran across two spaces.
          useJapt("  ");
        }
        else if (char === "]") {
          // Close as many parens as possible.
          levelEndAll(")");
          
          // End the level with a square bracket.
          levelEnd("]");
        }
        else if (Japt.variableNames.includes(char)) {
          // Append it to the level.
          levelAppend(char);
        }
        else if (/\d|\./.test(char)) {
          let litNumber = char, isDecimal = false;
          if (char === ".") isDecimal = true;
          
          // Leading zeroes become their own literals.
          if (litNumber !== "0")
            // While the next char is a digit, or it's "." and we're not in a decimal, add it to the literal.
            while (/^\d/.test(code) || (code[0] === "." && !isDecimal)) {
              char = code[0]; code = code.slice(1);
              litNumber += char;
              if (char === ".")
                isDecimal = true;
            }
          
          // If it's just ".", turn it into ".1".
          if (litNumber === ".")
            litNumber = ".1";
          
          // Add a leading 0 for decimals.
          if (litNumber[0] === ".")
            litNumber = "0" + litNumber;
          
          // Append to the level.
          levelAppend(litNumber);
        }
        else if (char === ",") {
          // Commas are inserted automatically; don't do anything extra.
        }
        else {
          // Fallback: append directly to the level.
          objectAppend(char);
        }
      }
      
      // Close any levels left open.
      while (currLevels.length > 1) {
        levelEnd(mirror(currLevels.get(-2).get(-1).slice(-1)));
      }
      
      return currLevels[0].join(", ");
    }
    
    let outp = subtranspile(code_Japt);
    
    // Adds a return keyword to the last statement.
    let returnIndex = outp.lastIndexOf(';') + 1;
    let code_JS = outp.slice(0, returnIndex) + 'return ' + outp.slice(returnIndex);
    
    return '(function program(input, U, V, W, X, Y, Z) {\n' + indent(code_JS) + '\n})';
  }
  
};

if (isnode) module.exports = Japt;
