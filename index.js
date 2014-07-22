exports.ndn = require("ndn-lib");
exports.NameTree = require("./src/DataStructures/NameTree.js").installNDN(exports.ndn);
exports.PIT = require("./src/DataStructures/PIT.js").installNDN(exports.ndn);
exports.FIB = require("./src/DataStructures/FIB.js").installNDN(exports.ndn);
exports.ContentStore = require("./src/DataStructures/ContentStore.js");
exports.Interfaces = require("./src/DataStructures/Interfaces.js").installNDN(exports.ndn);
exports.Transports = require("./src/Transports/nodeWrapper.js");

module.exports = exports;
