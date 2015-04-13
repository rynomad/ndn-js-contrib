var NameTree = require("./NameTree.js");

function FIB (){
  this._nameTree = new NameTree();
}

FIB.prototype.insert = function FIB_insert(prefix, face){
  var self = this;
  return new Promise(function FIB_insert_Promise(resolve,reject){
    var node = self._nameTree.get(prefix);

    if (!node.getItem())
      node.setItem(new FIB.Entry())

    var fibEntry = node.getItem();
    if (fibEntry.addNextHop(face))
      resolve(face);
    else
      reject(new Error("FIB.insert(prefix, face): duplicate prefix and face combination"));
  });
};

FIB.prototype.lookup = function FIB_lookup(interest, face){
  var self = this;
  return new Promise(function FIB_lookup_Promise(resolve, reject){
    self._nameTree.up(interest.name);

    self._nameTree.skip(function(node){
      var fibEntry = node.getItem();
      return (!fibEntry
          || (fibEntry.getNextHops().length === 0)
          || ((fibEntry.getNextHops().length === 1) && (fibEntry.getNextHops[0].face === face)));
    });

    var results = [];

    for (var node of self._nameTree){
      var nexthops = node.getItem().getNextHops();
      for (var i in nexthops){
        var dup = false;
        for (var j in results)
          if (nexthops[i].face === results[j].face){
            dup = true;
            break;
          }
        if (!dup && (nexthops[i].face !== face))
          results.push(nexthops[i]);
      }
    }
    if (results.length)
      resolve(results);
    else
      reject(new Error("FIB.lookup(interest, face): no valid nexthops for that interest"));
  });
};

FIB.Entry = function FIB_Entry(){
  this._nextHops = [];
};

FIB.Entry.prototype.getNextHops = functiopn FIB_Entry_getNextHops(){
  return this._nextHops;
};

FIB.Entry.prototype.addNextHop = function FIB_Entry_addNextHop(face){
  for (var i in this._nextHops)
    if (this._nextHops[i].face === face)
      return false;

  this._nextHops.push({
    face: face
    , measurements: {}
  });

  return true;
}

FIB.Entry.prototype.removeFace = function FIB_Entry_removeFace(face){
  for (var i in this._nextHops)
    if (this._nextHops[i].face === face){
      this._nextHops.splice(i,1);
      break;
    }
}

module.exports = FIB;
