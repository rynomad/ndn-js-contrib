var binarySearch = require("./binarySearch.js")
  , FIB = function(){}


function FibEntry(param){
  this.prefix = (typeof param.prefix == "string") ? new ndn.Name(param.prefix) : param.prefix ;
  this.nextHops = (function(){
    var hops = [param.nextHops.shift()];
    function recurse(){
      if (param.nextHops.length > 0){
        var i = binarySearch(hops, param.nextHops[0], "faceID")
        if (i < 0)
          hops.splice(~i, 0, param.nextHops.shift())
      } else
        return hops;
    }
    return recurse()
  })()
}

FibEntry.prototype.getNextHops = function(excludingFaceID){
  var q = {faceID: excludingFaceID}
    , i = binarySearch(this.nextHops, q, "faceID")
  if (i < 0)
    return this.nextHops
  else
    return this.nextHops.slice(0,~i).concat(this.nextHops.slice(~i + 1))
};

FibEntry.prototype.addNextHop = function(nextHop){
  var i = binarySearch(this.nextHops, nextHop, "faceID")
  if (i < 0)
    this.nextHops.splice(~i, 0, nextHop);
  else
    return this.nextHops;
};



FIB.prototype.useNameTree = function(nameTree){
  this.nameTree = nameTree;
  return this;
}

FIB.prototype.lookup = function(prefix){
  prefix = (typeof prefix == "string") ? new ndn.Name(prefix) : prefix;

  var ent = this.nameTree.lookup(prefix)
    , entry = ent.fibEntry;

  if (entry)
    return entry;
  else
    return (ent.fibEntry = new FIB.FibEntry({prefix: prefix, nextHops: []}))
}

FIB.prototype.lookupLongestPrefix = function(prefix) {
  prefix = (typeof prefix == "string") ? new ndn.Name(prefix) : prefix;

  function lookupAncestors(node){
    if (node.fibEntry)
      return node.fibEntry;
    else if (node.prefix.size() > 0)
      return lookupAncestors(node.parent);
    else
      return null;
  }

  var ent = this.nameTree.lookup(prefix);
  var entry = ent.fibEntry;
  if (entry)
    return entry;
  else
    return lookupAncestors(ent.parent);
}

FIB.prototype.addEntry = function(fibEntry){
  fibEntry = (fibEntry instanceof FibEntry) ? fibEntry : new FibEntry(fibEntry);

  var node = this.nameTree.lookup(fibEntry.prefix);
  if (!node.fibEntry){
    node.fibEntry = fibEntry;
  } else {
    for (var i = 0 ; i < fibEntry.nextHops.length; i++ ){
      var i = binarySearch(node.fibEntry.nextHops, fibEntry.nextHops[i], "faceID");
      if (i < 0)
        node.fibEntry.nextHops.splice(~i, 0, fibEntry.nextHops[i]);
    }
  }
};

FIB.FibEntry = FibEntry

module.exports = FIB
