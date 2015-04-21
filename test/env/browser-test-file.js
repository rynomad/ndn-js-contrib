var buffer = new Buffer(100000)
module.exports = {
  buffer:  buffer,
  file: new Blob([buffer], {type:"test/type"})
};
