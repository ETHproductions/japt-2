//////////////// DEFINITIONS ////////////////

// Map of alternates for each char, accessed by pressing <tab> in the code textarea.
let alts
  = "AȦẠA BḂḄB CĊC DḊḌD EĖẸE FḞF GĠG HḢḤH IİỊI JJ KḲK LĿḶL MṀṂM NṄṆN OȮỌO PṖP QQ RṘṚR SṠṢS TṪṬT UỤU VṾV WẆẈW XẊX YẎỴY ZŻẒZ "
  + "aȧạa bḃḅb cċc dḋḍd eėẹe fḟf gġg hḣḥh iıịi jj kḳk lŀḷl mṁṃm nṅṇn oȯọo pṗp qq rṙṛr sṡṣs tṫ\tṭt uụu vṿv wẇẉw xẋx yẏỵy zżẓz "
  + "0⁰₀0 1¹₁1 2²₂2 3³₃3 4⁴₄4 5⁵₅5 6⁶₆6 7⁷₇7 8⁸₈8 9⁹₉9 +⁺₊+ -⁻₋- (⁽₍( )⁾₎) /⅟¼½¾/ =≈≠≡≢= <≤< >≥> &∧& |∨| ?¿? \"“”„‟\" '‼…' {‹{ }›} [«[ ]»] \n¶\n";

// Rotates one or more chars in the string to their next alternates, or defaults.
function tab(string, start = 0, end = string.length, shiftKey = false) {
  let section = string.slice(start, end);
  if (shiftKey === true) {
    section = section.replace(/[^\n -~]/g, function(x) {
      let word = alts.split(" ").find(w => w.includes(x));
      if (!word) return x;
      return word[0];
    });
  }
  else {
    section = section.replace(/[^ ]/g, function(x) {
      let index = alts.indexOf(x);
      if (index < 0)
        return x;
      return alts[index + 1];
    });
  }
  return string.slice(0, start) + section + string.slice(end);
}

// Number of argument inputs in the DOM.
let numArguments = 0;

// Removes an argument input from the DOM and adjusts the others.
function removeArgument(index) {
  $("#argument-" + index).remove();
  for (let i = index + 1; i <= numArguments; i++) {
    let elem = $("#argument-" + i);
    $(elem.children()[0]).attr("placeholder", "Argument " + (i - 1) + " goes here...");
    elem.attr("id", "argument-" + (i - 1));
  }
  
  numArguments -= 1;
  if (numArguments === 0)
    $("#argument-0").removeClass("hidden");
}

// Adds an argument input to the DOM and adjusts the others.
function addArgument(index, content = "") {
  for (let i = numArguments; i > index; i--) {
    let elem = $("#argument-" + i);
    $(elem.children()[0]).attr("placeholder", "Argument " + (i + 1) + " goes here...");
    elem.attr("id", "argument-" + (i + 1));
  }
  
  let newArg = $("#argument-template").clone();
  let newTA = $(newArg.children()[0]);
  newArg.attr("id", "argument-" + (index + 1));
  newTA.attr("placeholder", "Argument " + (index + 1) + " goes here...");
  newTA.val(content);
  newArg.removeClass("hidden");
  newArg.insertAfter($("#argument-" + index));
  
  if (numArguments === 0)
    $("#argument-0").addClass("hidden");
  numArguments += 1;
}

function setVal(element, val) {
  $(element).val(val);
  $(element).get()[0].adjustHeight();
}

// Version of japt.js to use.
let v = new Date().toISOString().slice(0, 16);

// Runs a Japt program given code, arguments, and input. Uses a Worker if possible.
function runJapt(code_Japt, args, input) {
  clearTimeout(timeoutID);
  $("#output").val("");
  $("#status").css("color", "black");
  $("#status").text("Compiling...");
  
  let code_JS;
  try {
    code_JS = Japt.transpile(code_Japt);
    setVal("#js-code", code_JS);
  }
  catch (e) {
    $("#status").css("color", "red");
    $("#status").text("Compilation error: " + e.message);
    throw e;
  }

  $("#status").text("Running...");

  if (window.Worker) {
    let evaluator = new Worker('src/worker.js');
    evaluator.onmessage = function ({data}) {
      console.log(data);

      if (data.status === "finished") {
        setVal("#output", data.result);
        $("#status").text("Finished.");
      }
      else if (data.status === "error") {
        $("#status").css("color", "red");
        $("#status").text(data.error);
      }
    };

    evaluator.postMessage({
      code: code_JS,
      args: args,
      input: input,
      env: { A: 10 }
    });
  }

  else {
    let program;
    try {
      program = eval(code_JS);
    }
    catch (e) {
      $("#status").css("color", "red");
      $("#status").text(e.toString());
    }
    
    try {
      setVal("#output", program(input, ...args));
      $("#status").text("Finished.");
    }
    catch (e) {
      $("#status").css("color", "red");
      $("#status").text(e.toString());
    }
  }
}

// Gathers code, arguments, and input, then updates the URL and sends everything to runJapt().
function run() {
  let code = $("#code").val();
  let input = $("#input").val();
  
  let rawargs = [], args = [];
  for (let elem of $("textarea.argument")) {
    if ($(elem).attr("placeholder") === "") continue;
    let text = elem.value;
    rawargs.push(text);
    try {
      text = eval(text);
    }
    catch (e) {}
    args.push(text);
  }
  
  let queryString = '';
  queryString += '?v=' + v;
  queryString += '&code=' + escapedBtoA(code);
  queryString += '&args=' + escapedBtoA(JSON.stringify(rawargs));
  queryString += '&input=' + escapedBtoA(input);
  history.replaceState(null, "Japt 2 interface", location.origin + location.pathname + queryString);
  
  runJapt(code, args, input);
}

function escapedBtoA(text) {
  return btoa(
    text.replace(/[^]/g, function(x) {
      if (x === "\\")
        return "\\\\";
      if (x.charCodeAt(0) < 256)
        return x;
      return "\\u" + x.charCodeAt(0).toString(16).padStart(4, "0");
    })
  );
}

function escapedAtoB(text) {
  return atob(text).replace(/\\u[0-9A-Fa-f]{4}/g, x => String.fromCharCode(parseInt(x.slice(2), 16))).replace(/\\\\/g, "\\");
}


//////////////// RUNTIME ////////////////

// ID for the timeout event controlling transpilation.
let timeoutID = -1;

// Handles auto-height adjustment on textareas.
for (let textarea of $("textarea")) {
  textarea.oninput = textarea.adjustHeight = function() {
    let lineHeight = parseInt($(textarea).css("lineHeight"));
    let lines = textarea.value.split("\n").length;
    lines = Math.max(lines, $(textarea).hasClass("argument") ? 1 : 2);
    let height = Math.min(lineHeight * lines + 6, 120);
    textarea.style.height = height + "px";
  };
  textarea.adjustHeight();
}

// Handles tab being pressed in the code textarea.
// Adapted from https://stackoverflow.com/a/6637396
$(document).delegate('#code', 'keydown', function(e) {
  var keyCode = e.keyCode || e.which;
  if (keyCode === 9) {
    e.preventDefault();
    let start = this.selectionStart,
        end = this.selectionEnd,
        val = $(this).val();
    
    if (start === end) {
      $(this).val(tab(val, start - 1, start, e.shiftKey));
    }
    else {
      $(this).val(tab(val, start, end, e.shiftKey));
    }
    
    this.selectionStart = start;
    this.selectionEnd = end;
  }
  
  clearTimeout(timeoutID);
  timeoutID = setTimeout(function () {
    let code_JS = Japt.transpile($("#code").val());
    setVal("#js-code", code_JS);
  }, 1000);
});

{
  let code, args, input;
  let queries = location.search.match(/[&?][^&?=]+=[^&?]+/g) || [];
  for (let item of queries) {
    let key = item.slice(1, item.indexOf('='));
    let val = item.slice(item.indexOf('=') + 1);
    if (key === "code")
      code = escapedAtoB(val);
    else if (key === "input")
      input = escapedAtoB(val);
    else if (key === "args")
      args = eval(escapedAtoB(val));
    else if (key === "v")
      v = val;
  }
  if (code && !$("#code").val())
    $("#code").val(code);
  if (input && !$("#input").val())
    $("#input").val(input);
  if (!args || args.length === 0)
    args = [""];
  if (v === "dev" || v === "master")
    v += "@{" + new Date().toISOString().slice(0, 16) + "}";
  for (let i = 0; i < args.length; i++)
    addArgument(i, args[i]);
  let realv = /^\d{4}-/.test(v) ? "@{" + v + "Z}" : /^\d\./.test(v) ? "v" + v : v;
  var script = document.createElement('script');
  script.setAttribute("src", "https://rawgit.com/ETHproductions/japt-2/" + realv + "/src/japt.js");
  document.getElementsByTagName('head')[0].appendChild(script);
}
