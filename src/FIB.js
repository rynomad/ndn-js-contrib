var binarySearch = require("./binarySearch.js")
  , FIB = function(nameTree){ this.nameTree = nameTree; return this;}
  , ndn


function FibEntry(param){
  this.prefix = (typeof param.prefix == "string") ? new ndn.Name(param.prefix) : param.prefix ;
  this.nextHops = (function(){
    var hops = [];
    function recurse(){
      if (param.nextHops && param.nextHops.length > 0){
        var i = binarySearch(hops, param.nextHops[0], "faceID")
        if (i < 0)
          hops.splice(~i, 0, param.nextHops.shift());
        return recurse();
      } else
        return hops;
    }
    return recurse()
  })()
}

FibEntry.prototype.getNextHops = function(excludingFaceID){
  excludingFaceID = (!(excludingFaceID >= 0)) ? -1 : excludingFaceID
  var q = {faceID: excludingFaceID }
    , i = binarySearch(this.nextHops, q, "faceID")
  if (i < 0)
    return this.nextHops
  else
    return this.nextHops.slice(0,i).concat(this.nextHops.slice(i + 1))
};

FibEntry.prototype.addNextHop = function(nextHop){
  var i = binarySearch(this.nextHops, nextHop, "faceID")
  if (i < 0){
    this.nextHops.splice(~i, 0, nextHop);
    return this;
  } else
    return this;
};

FIB.installNDN = function(NDN){
  ndn = NDN;
}

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


FIB.prototype.findAllFibEntries = function(prefix){

  var inner =  this.nameTree.findAllMatches(prefix, function(match){
    if (match.fibEntry && (match.fibEntry.nextHops.length > 0))
      return true;
    else
      return false;
  })
  var iterouter = {
    hasNext : inner.hasNext
    , next : function(){
      var next = inner.next()
      if (inner.hasNext)
        this.hasNext = true
      else
        this.hasNext = false

      return next.fibEntry
    }
  }
  return iterouter;
}

FIB.prototype.findAllNextHops = function(prefix, excludingFaceID){
  var faceFlag = 0;
  var iterator = this.findAllFibEntries(prefix)

  while (iterator.hasNext){
    var entry = iterator.next()
    var nextHops = entry.getNextHops(excludingFaceID)
    for (var i =0; i < nextHops.length; i ++){
      faceFlag = faceFlag | (1 << nextHops[i].faceID);
    }
  }

  return faceFlag;
}



FIB.prototype.addEntry = function(fibEntry){
  fibEntry = (fibEntry instanceof FibEntry) ? fibEntry : new FibEntry(fibEntry);

  var node = this.nameTree.lookup(fibEntry.prefix);
  if (!node.fibEntry){
    node.fibEntry = fibEntry;
    return this;
  } else {
    for (var i = 0 ; i < fibEntry.nextHops.length; i++ ){
      var j = binarySearch(node.fibEntry.nextHops, fibEntry.nextHops[i], "faceID");
      if (j < 0)
        node.fibEntry.nextHops.splice(~j, 0, fibEntry.nextHops[i]);
    }
    return this;
  }
};

FIB.Entry = FibEntry

module.exports = FIB
