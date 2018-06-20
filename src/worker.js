onmessage = function({data}) {
  console.log(data);
  
  let result, status, error;
  try {
    result = eval(data.code);
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
}
