exports.ndn = require("ndn-lib");
exports.NameTree = require("./src/NameTree.js").installNDN(exports.ndn);
exports.PIT = require("./src/PIT.js").installNDN(exports.ndn);
exports.FIB = require("./src/FIB.js").installNDN(exports.ndn);
exports.ContentStore = require("./src/ContentStore.js")
exports.Interfaces = require("./src/Interfaces.js").installNDN(exports.ndn);


module.exports = exports;
