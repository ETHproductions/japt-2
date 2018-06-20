let isnode = typeof window === "undefined";

let Japt = {
  
  transpile: function(code) {
    // TODO: transpile code
    return code;
  }
  
};

if (isnode) module.exports = Japt;
