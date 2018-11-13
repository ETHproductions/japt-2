import * as utils from "./utils.js"

var isnode = typeof window === "undefined";

var lookbehinds;
try {
  let lookbehindTest = RegExp("b(?<=a.)c");
  lookbehinds = lookbehindTest.test("abc");
} catch (e) {
  lookbehinds = false;
}

var Japt = {
  
  codepage: "₀₁₂₃₄₅₆₇₈₉₊₋₍₎¼¾⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁽⁾½⅟ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~¶"
          + "ẠḄḌẸḤỊḲḶṂṆỌṚṢṬỤṾẈỴẒȦḂĊḊĖḞĠḢİĿṀṄȮṖṘṠṪẆẊẎŻạḅḍẹḥịḳḷṃṇọṛṣṭụṿẉỵẓȧḃċḋėḟġḣıŀṁṅȯṗṙṡṫẇẋẏżàáâæèéêìíîòóôùúû≈≠≡≢≤≥∧∨................‹›«»“‟”„",
  
  methodNames: "abcdefghijklmnopqrstuvwxyzạḅḍẹḥịḳḷṃṇọṛṣṭụṿẉỵẓȧḃċḋėḟġḣıŀṁṅȯṗṙṡṫẇẋẏżàáâæèéêìíîòóôùúû",
  variableNames: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  midOperators: "+-*/%&|^≈≠≡≢<≤>≥∧∨=,?:",
  binaryOpMap: {
    "+": { name: "plus",  lit: "+"   },
    "-": { name: "minus", lit: "-"   },
    "*": { name: "times", lit: "*"   },
    "/": { name: "over",  lit: "/"   },
    "%": { name: "mod",   lit: "%"   },
    "&": { name: "band",  lit: "&"   },
    "|": { name: "bor",   lit: "|"   },
    "^": { name: "bxor",  lit: "^"   },
    "≈": { name: "eq",    lit: "=="  },
    "≠": { name: "neq",   lit: "!="  },
    "≡": { name: "eqq",   lit: "===" },
    "≢": { name: "neqq",  lit: "!==" },
    "<": { name: "lt",    lit: "<"   },
    "≤": { name: "lte",   lit: "<="  },
    ">": { name: "gt",    lit: ">"   },
    "≥": { name: "gte",   lit: ">="  },
  },
  
  tokenise: function(code) {
    let tokens = [], tokenParser = /([“‟«›][^‹»”„]*[‹»”„]?|”[^]|»[^]|0|\d*\.\d+|\d+|[^])(['"]*)/gu, token;
    while (token = tokenParser.exec(code))
      tokens.push(token);

    console.log(tokens.slice());
    return tokens;
  },
  
  transpile: function(code, isBinary = false) {
    // Converts from the Japt codepage to UTF-8 for easier processing.
    if (isBinary) {
      code = code.replace(/[^]/g, x => Japt.codepage[x.charCodeAt()]);
    }
    
    // Replaces literal newlines and tabs for easier processing.
    code = code
      .replace(/\n/g, '¶')
      .replace(/\t/g, 'ṭ');
    
    let tokens = Japt.tokenise(code);
    
    //// TRANSPILATION SETUP ////
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
      let obj = currLevels.pop();
      if (endchar === "}") {
        // If the function didn't contain any semicolons, add one to each line.
        obj = obj.map(x => x.replace(/[^;]$/, "$&;"));

        // Have the function return the last object.
        obj.mapAt(-1, x => "return " + x);

        // Join the statements with newlines to make it pretty.
        obj = obj.join("\n");
      }
      else {
        // Join the objects with commas.
        obj = obj.join(", ") + endchar;
      }

      // Ignore empty statements.
      if (obj === ";") return;

      // If we're closing a statement that hasn't been opened, open it first.
      if (currLevels.length === 0 || currLevels.get(-1).get(-1).slice(-1) !== utils.mirror(endchar)) {
        if (endchar === "}") {
          // Unopened functions are given arguments X, Y, Z. May be changed in the future.
          obj = "function(X, Y, Z) {\n" + utils.indent(obj) + "\n}";

          // Wrap in parentheses if we're not already in them.
          if (currLevels.length === 0 || currLevels.get(-1).get(-1).slice(-1) !== "(")
            obj = "(" + obj + ")";
        }
        // For parens and square brackets, just prepend their mirror.
        else if (endchar !== ";")
          obj = utils.mirror(endchar) + obj;

        // Push it back as its own level to finish the job.
        currLevels.push([obj]);
      }
      else {
        // For second, third, etc. semicolons, add to the level created by the first.
        if (endchar === ";") {
          levelAppend(obj);
        }
        else {
          if (endchar === "}") {
            // Finish the function, indenting the inner section.
            obj = "\n" + utils.indent(obj) + "\n}";

            // Wrap in parentheses if we're not already in them.
            if (currLevels.length < 2 || currLevels.get(-2).get(-1).slice(-1) !== "(") {
              obj += ")";
              objectPrepend("(");
            }
          }

          // Append the result to the previous object to finish the job.
          objectAppend(obj);
        }
      }
    }
    // Ends as many levels as possible with the given closing brackets.
    function levelEndAll(endchars) {
      while (true) {
        if (currLevels.length < 2)
          return;
        let lastchar = utils.mirror(currLevels.get(-2).get(-1).slice(-1));
        if (!endchars.includes(lastchar))
          return;
        levelEnd(lastchar);
      }
    }
    // Makes the transpiler behave as if the given code were next in the source.
    function useJapt(str) {
      tokens.unshift(...Japt.tokenise(str));
    }


    //// MAIN LOOP ////
    while ( tokens.length > 0 ) {
      let [[char], token, modifiers] = tokens.shift();

      if ("([".includes(char)) {
        // Append to the level and start a new one.
        levelAppend(char);
        levelStart();
      }
      else if (char === "{") {
        let args = [];
        while (Japt.variableNames.includes(currLevels.get(-1).get(-1)))
          args.unshift(currLevels.get(-1).pop());
        levelAppend("function (" + args.join(", ") + ") {");
        levelStart();
      }
      else if (char === "“") {
        let litString = '"', restToken = token.slice(1);
        while (true) {
          // Consume the next char; if it doesn't exist, pretend we hit a right-quote.
          if (restToken.length === 0)
            char = '”';
          else
            char = restToken[0], restToken = restToken.slice(1);
          
          // Right-quote ends the string. More options in the near future.
          if (char === '”') {
            litString += '"';
            levelAppend(litString);
            break;
          }
          // Escape backslashes, quotes, newlines, and tabs.
          else if (char === '\\') {
            litString += '\\\\';
          }
          else if (char === '"') {
            litString += '\\"';
          }
          else if (char === '¶') {
            litString += '\\n';
          }
          else if (char === 'ṭ') {
            litString += '\\t';
          }
          // More special cases to be added in the near future.
          // Any (remaining) printable ASCII is added directly to the string.
          else if (/[ -~]/.test(char)) {
            litString += char;
          }
        }
      }
      else if (char === "”") {
        let litString = '"', restToken = token.slice(1);
        
        // Consume the next char; if it doesn't exist, pretend it's a space (may be changed).
        if (restToken.length === 0)
          char = ' ';
        else
          char = restToken;
        
        // Escape backslashes, quotes, newlines, and tabs.
        if (char === '\\') {
          litString += '\\\\';
        }
        else if (char === '"') {
          litString += '\\"';
        }
        else if (char === '¶') {
          litString += '\\n';
        }
        else if (char === 'ṭ') {
          litString += '\\t';
        }
        // More special cases to be added in the near future.
        // Anything else is put directly in the string.
        else  {
          litString += char;
        }
        
        litString += '"';
        levelAppend(litString);
      }
      else if (char === "«") {
        let litRegex = '', inClass = false, restToken = token.slice(1);
        while (true) {
          // Consume the next char; if it doesn't exist, pretend we hit a right arrow-quote.
          if (restToken.length === 0)
            char = '»';
          else
            char = restToken[0], restToken = restToken.slice(1);
          
          // Right arrow-quote ends the regex.
          if (char === '»') {
            if (inClass) {
              litRegex += ']';
            }
            if (litRegex === '')
              litRegex += '.';
            litRegex = '/' + litRegex + '/gu';
            levelAppend(litRegex);
            break;
          }
          else if (char === '₍') {
            inClass = true;
            litRegex += '[';
          }
          else if (char === '₎') {
            if (!inClass)
              litRegex = '[' + litRegex;
            litRegex += ']';
            inClass = false;
          }
          // Escape any special regex chars, plus newline and tab.
          else if ('/\\()[]{}?*+|-^$.'.includes(char)) {
            litRegex += '\\' + char;
          }
          else if (char === '¶') {
            litRegex += '\\n';
          }
          else if (char === 'ṭ') {
            litRegex += '\\t';
          }
          
          else if (char === '₋') {
            litRegex += '-';
          }
          // More features to be added in the near future.
          // Any (remaining) printable ASCII is added directly to the string.
          else if (/[ -~]/.test(char)) {
            litRegex += char;
          }
        }
      }
      else if (char === "»") {
        let litRegex = '/', restToken = token.slice(1);
        
        for (char of restToken.slice(0, -1)) {
          if (char === "") {
            // Special options to be added in the near future.
          }
        }
        
        // Take the last char; if it doesn't exist, pretend it's a period (will be changed).
        if (restToken.length === 0)
          char = '.';
        else
          char = restToken[0], restToken = restToken.slice(1);
        
        // Escape any special regex chars, plus newline and tab.
        if ('/\\()[]{}?*+|^$.'.includes(char)) {
          litRegex += '\\' + char;
        }
        else if (char === '¶') {
          litRegex += '\\n';
        }
        else if (char === 'ṭ') {
          litRegex += '\\t';
        }
        // More features to be added in the near future.
        // Any (remaining) printable ASCII is added directly to the string.
        else if (/[ -~]/.test(char)) {
          litRegex += char;
        }
        else {
          litRegex += '.';
        }
        litRegex += "/g";
        levelAppend(litRegex);
      }
      else if (Japt.methodNames.includes(char)) {
        let currLevel = currLevels.get(-1);
        if (currLevel.length === 0) {
          if (currLevels.length > 1 && currLevels.get(-2).get(-1).slice(-1) === "(") {
            objectAppend('"' + char + '"');
            continue;
          }
          else {
            objectAppend("U");
          }
        }
        // If the last char was a digit, append a space (to avoid 5.toString() syntax errors).
        if (currLevel.length > 0 && /\d$/.test(currLevels.get(-1).get(-1)))
          objectAppend(" ");

        // Turn the letter into a method call and start a new level.
        objectAppend("." + char + modifiers.replace(/./g, c => c === "'" ? 1 : 2) + "(");
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
      else if (char === ";") {
        // Close as many brackets as possible.
        levelEndAll(")]");

        // End with a semicolon.
        levelEnd(";");

        // Start a new level. The previous one will keep track of all statements within this function.
        levelStart();
      }
      else if (char === "}") {
        // Close as many brackets as possible, and a semicolon if one exists.
        levelEndAll(")];");

        // End the level with a curly bracket.
        levelEnd("}");
      }
      else if (Japt.variableNames.includes(char)) {
        // Append it to the level.
        levelAppend(char);
      }
      else if (/\d|\./.test(char)) {
        let litNumber = token;

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
    levelEndAll(")];}");

    // Wrap everything in one big function.
    currLevels.unshift(["function program(input, U, V, W, X, Y, Z) {"]);
    levelEndAll(")}");

    return currLevels[0][0];
  }
  
};

export default Japt;