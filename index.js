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
function addArgument(index) {
  for (let i = numArguments; i > index; i--) {
    let elem = $("#argument-" + i);
    $(elem.children()[0]).attr("placeholder", "Argument " + (i + 1) + " goes here...");
    elem.attr("id", "argument-" + (i + 1));
  }
  
  let newArg = $("#argument-template").clone();
  newArg.attr("id", "argument-" + (index + 1));
  $(newArg.children()[0]).attr("placeholder", "Argument " + (index + 1) + " goes here...");
  newArg.removeClass("hidden");
  newArg.insertAfter($("#argument-" + index));
  
  if (numArguments === 0)
    $("#argument-0").addClass("hidden");
  numArguments += 1;
}

// Runs a Japt program given code, arguments, and input. Uses a Worker if possible.
function runJapt(code_Japt, args, input) {
  $("#output").val("");
  $("#status").css("color", "black");
  $("#status").text("Compiling...");
  
  let code_JS = Japt.transpile(code_Japt);

  $("#status").text("Running...");

  if (window.Worker) {
    let evaluator = new Worker('src/worker.js');
    evaluator.onmessage = function ({data}) {
      console.log(data);

      if (data.status === "finished") {
        $("#output").val(data.result);
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
      $("#output").val(program(input, ...args));
      $("#status").text("Finished.");
    }
    catch (e) {
      $("#status").css("color", "red");
      $("#status").text(e.toString());
    }
  }
}

// Gathers code, arguments, and input, then sends it to runJapt().
function run() {
  let code = $("#code").val();
  let input = $("#input").val();
  
  let args = [];
  for (let elem of $("textarea.argument")) {
    if ($(elem).attr("placeholder") === "") continue;
    console.log(elem);
    let text = elem.value;
    try {
      text = eval(text);
    }
    catch (e) {}
    args.push(text);
  }
  
  runJapt(code, args, input);
}


//////////////// RUNTIME ////////////////

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
});

// Adds the first argument input. When permalinks arrive, will need to add a variable number of arguments and set their values.
addArgument(0);
