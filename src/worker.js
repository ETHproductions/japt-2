/* globals postMessage, onmessage: true */

onmessage = function({data}) {
  console.log(data);
  
  let { code, args, input, env } = data;
  
  for (let key in env)
    eval("var " + key + " = " + env[key]);
  
  let result, status, error, program;
  try {
    program = eval(code);
    result = program(input, ...args);
    status = "finished";
  }
  catch (e) {
    status = "error";
    error = e.toString();
  }
  postMessage({
    result,
    status,
    error
  });
};
