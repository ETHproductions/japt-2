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

let Japt = {
  
  codepage: "₀₁₂₃₄₅₆₇₈₉₊₋₍₎¼¾⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁽⁾½⅟ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~¶"
          + "ẠḄḌẸḤỊḲḶṂṆỌṚṢṬỤṾẈỴẒȦḂĊḊĖḞĠḢİĿṀṄȮṖṘṠṪẆẊẎŻạḅḍẹḥịḳḷṃṇọṛṣṭụṿẉỵẓȧḃċḋėḟġḣıŀṁṅȯṗṙṡṫẇẋẏżàáâæèéêìíîòóôùúû≈≠≡≢≤≥∧∨................‹›«»“‟”„",
  
  transpile: function(code_Japt, isBinary = false) {
    if (isBinary) {
      code_Japt = code_Japt.replace(/[^]/g, x => Japt.codepage[x.charCodeAt()]);
    }
    
    code_Japt = code_Japt
      .replace(/\n/g, '¶')
      .replace(/\t/g, 'ṭ');
    
    function subtranspile(code) {
      let outp, currObjects = [""], coIndex = 0;
      for ( ; code.length > 0; ) {
        let char = code[0]; code = code.slice(1);
        
        if ("([".includes(char)) {
          currObjects[coIndex] += char;
          currObjects.push("");
          coIndex++;
        }
        else if (char === " ") {
          currObjects[coIndex] += ")";
          if (currObjects.length > 1 && currObjects[coIndex - 1].slice(-1) === "(") {
            coIndex--;
            currObjects[coIndex] += currObjects.pop();
          }
          else {
            currObjects[coIndex] = "(" + currObjects[coIndex];
          }
        }
        else if (char === "]") {
          while (currObjects.length > 1 && currObjects[coIndex - 1].slice(-1) === "(") {
            coIndex--;
            currObjects[coIndex] += currObjects.pop() + ")";
          }
          currObjects[coIndex] += "]";
          if (currObjects.length > 1 && currObjects[coIndex - 1].slice(-1) === "[") {
            coIndex--;
            currObjects[coIndex] += currObjects.pop();
          }
          else {
            currObjects[coIndex] = "[" + currObjects[coIndex];
          }
        }
        else {
          currObjects[coIndex] += char;
        }
      }
      
      while (coIndex > 0) {
        coIndex--;
        currObjects[coIndex] += currObjects.pop() + mirror(currObjects[coIndex].slice(-1));
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
