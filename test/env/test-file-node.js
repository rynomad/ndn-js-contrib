var fs = require("fs")
var buffer = fs.readFileSync(process.cwd() + "/test/Node.js");
console.log(buffer)
module.exports = {
  buffer: buffer,
  file : buffer
}
