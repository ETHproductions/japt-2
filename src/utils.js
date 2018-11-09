export function indent(text, level = 1) {
  return text.replace(/^/gm, "  ".repeat(level));
}

export function mirror(text, reverse = true) {
  let mirrorMap = "()[]{}<>‹›«»\\/", output = "";
  for (let char of text) {
    let index = mirrorMap.indexOf(char);
    if (index > -1)
      char = mirrorMap[index ^ 1];
    
    output = reverse ? char + output : output + char;
  }
  return output;
}

export function defProps(target, properties) {
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
