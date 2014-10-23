exports.ndn = require("ndn-js");
exports.NameTree = require("./dist/src/DataStructures/NameTree.js").installNDN(exports.ndn);
exports.PIT = require("./dist/src/DataStructures/PIT.js").installNDN(exports.ndn);
exports.FIB = require("./dist/src/DataStructures/FIB.js").installNDN(exports.ndn);
exports.ContentStore = require("./dist/src/DataStructures/ContentStore.js");
exports.Interfaces = require("./dist/src/DataStructures/Interfaces.js").installNDN(exports.ndn);
exports.Transports = require("./dist/src/Transports/node/export.js");

module.exports = exports;
