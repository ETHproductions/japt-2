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
    if (isBinary) {
      code_Japt = code_Japt.replace(/[^]/g, x => Japt.codepage[x.charCodeAt()]);
    }
    
    code_Japt = code_Japt
      .replace(/\n/g, '¶')
      .replace(/\t/g, 'ṭ');
    
    function subtranspile(code) {
      let outp, currObjects = [""];
      function objectStart() {
        currObjects.push("");
      }
      function objectAppend(str) {
        currObjects.mapAt(-1, obj => obj + str);
      }
      function objectPrepend(str) {
        currObjects.mapAt(-1, obj => str + obj);
      }
      function objectEnd(str = "") {
        str = currObjects.pop() + str;
        objectAppend(str);
      }
      function useJapt(str) {
        code = str + code;
      }
      
      while ( code.length > 0 ) {
        let char = code[0]; code = code.slice(1);
        
        if ("([".includes(char)) {
          objectAppend(char);
          objectStart();
        }
        else if (Japt.methodNames.includes(char)) {
          objectAppend("." + char);
          useJapt("(");
        }
        else if (char === " ") {
          objectAppend(")");
          if (currObjects.length > 1 && currObjects.get(-2).slice(-1) === "(") {
            objectEnd();
          }
          else {
            objectPrepend("(");
          }
        }
        else if (char === ")") {
          useJapt("  ");
        }
        else if (char === "]") {
          while (currObjects.length > 1 && currObjects.get(-2).slice(-1) === "(") {
            objectEnd(")");
          }
          objectAppend("]");
          if (currObjects.length > 1 && currObjects.get(-2).slice(-1) === "[") {
            objectEnd();
          }
          else {
            objectPrepend("[");
          }
        }
        else {
          objectAppend(char);
        }
      }
      
      while (currObjects.length > 1) {
        objectEnd(mirror(currObjects.get(-2).slice(-1)));
      }
      
      return currObjects[0];
    }
    
    let outp = subtranspile(code_Japt);
    
    let returnIndex = outp.lastIndexOf(';') + 1;
    let code_JS = outp.slice(0, returnIndex) + 'return ' + outp.slice(returnIndex);
    
    return '(function program(input, U, V, W, X, Y, Z) {\n' + indent(code_JS) + '\n})';
  }
  
};

if (isnode) module.exports = Japt;
