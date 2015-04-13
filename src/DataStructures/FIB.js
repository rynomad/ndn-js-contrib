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
    fibEntry.addNextHop(face);
    resolve();
  });
};

FIB.prototype.lookup = function FIB_lookup(interest, face){
  return new Promise(function FIB_lookup_Promise(resolve, reject){
    reject()
  });
};

FIB.Entry = function FIB_Entry(){
  this._nextHops = [];
};

FIB.Entry.prototype.getNextHops = functiopn FIB_Entry_getNextHops(){
  return this._nextHops;
};

FIB.Entry.prototype.addNextHop = function FIB_Entry_addNextHop(face){
  this.removeFace(face);
  this._nextHops.push({
    face: face
    , measurements: {}
  });
}

FIB.Entry.prototype.removeFace = function FIB_Entry_removeFace(face){
  for (var i in this._nextHops)
    if this._nextHops[i].face === face){
      this._nextHops.splice(i,1);
      break;
    }
}

/**A Forwarding Entry
 *@constructor
 *@param {Object|string} prefix - the ndn.Name object representing the prefix for this forwarding entry
 *@param {Array} - an array of nextHop objects, each with a "faceID" integer property, or just an array of the faceIDs
 *@returns {FibEntry}
 */
function FibEntry(prefix, nextHops){
  this.prefix = (typeof prefix === "string") ? new ndn.Name(prefix) : prefix ;

  this.nextHops = (function(){
    var hops = [];
    function recurse(){
      if (nextHops && nextHops.length > 0){
        var hop;
        if (typeof nextHops[0].faceID !== "undefined" ){
          hop = nextHops.shift();
        } else {
          hop = {
            faceID: nextHops.shift()
          };
        }

        var i = binarySearch(hops, hop, "faceID");
        if (i < 0){
          hops.splice(~i, 0, hop);
        }
        return recurse();
      } else{
        return hops;
      }
    }
    return recurse();
  })();
  return this;
}

FibEntry.type = "FibEntry";

/**get all nextHops, excluding a given faceID
 *@param {Number=} excludingFaceID the faceID to exclude
 *@returns {Array} an array of nextHops
 */
FibEntry.prototype.getNextHops = function(excludingFaceID){
  debug.debug("Entry getting next hops excluding: %s", excludingFaceID);
  var returns;
  if(excludingFaceID !== undefined){
    var q = {faceID: excludingFaceID }
      , i = binarySearch(this.nextHops, q, "faceID");
    if (i >= 0){
      returns = this.nextHops.slice(0,i).concat(this.nextHops.slice(i + 1));
    } else {
      returns = this.nextHops;
    }
  } else {
    returns = this.nextHops;
  }
  debug.debug("returning array of %s nextHops", returns.length);
  return returns;
};

/**Remove a nextHop (will do nothing if a nextHop with the given faceID does not exist)
 *@param {Object} nextHop an object with faceID Number property
 *@returns {FIBEntry} for chaining
 */
FibEntry.prototype.removeNextHop = function(nextHop){
  var i = binarySearch(this.nextHops, nextHop, "faceID");

  if (i < 0){
    return this;
  } else{
    this.nextHops.splice(i,1);
    return this;
  }
};

/**Add a nextHop (will replace if a nextHop with the same faceID exists)
 *@param {Object} nextHop an object with faceID Number property
 *@returns {FIBEntry}
 */
FibEntry.prototype.addNextHop = function(nextHop){
  var i = binarySearch(this.nextHops, nextHop, "faceID");

  if (i < 0){
    this.nextHops.splice(~i, 0, nextHop);
    return this;
  } else{
    this.nextHops.splice(i,1,nextHop);
    return this;
  }
};

/**Forwarding Interest Base
 *@constructor
 *@param {@link NameTree} nameTree the nameTree to build the FIB on.
 */
function FIB (nameTree){
  this.nameTree = nameTree; return this;
}

/**Install ndn-lib into the FIB scope. only necessary if you require("ndn-Classes/src/DataStructures/FIB.js"), done for you if require("ndn-Classes").FIB
 *@private
 *@param {Object} NDN ndn-js library as exported by npm
 */
FIB.installNDN = function(NDN){
  ndn = NDN;
  return this;
};

/**find the exact match fibEntry for a given prefix, creating it if not found
 *@param {Object} prefix the ndn.Name object representing the prefix
 *@returns {FIBEntry}
 */
FIB.prototype.lookup = function(prefix){
  prefix = (typeof prefix === "string") ? new ndn.Name(prefix) : prefix;
 debug.debug("lookup %s", prefix.toUri());
  var ent = this.nameTree.lookup(prefix)
    , entry = ent.fibEntry;


  if (entry){
   debug.debug("found existing fib Entry with ", ent.fibEntry.nextHops.length, " next hops");
    return entry;
  }else{
   debug.debug("no entry found at that node, creating empty");
    return (ent.fibEntry = new FibEntry({prefix: prefix, nextHops: []}));
  }
};

/**Return an Iterator that progressively returns longest prefix FIBEntries with 1 or more nextHops
 *@param {Object} prefix the ndn.Name object representing the prefix
 *@returns {Object} Iterator object with .next() and .hasNext = Boolean
 */
FIB.prototype.findAllFibEntries = function(prefix){
 debug.debug("findAllFibEntries: constructing iterator for entries matching ", prefix.toUri());
  var inner =  this.nameTree.findAllMatches(prefix, function(match){
    if (match.fibEntry && (match.fibEntry.nextHops.length > 0)){
      return true;
    }  else {
      return false;
    }
  })
  , iterouter = {
    hasNext : inner.hasNext
    , next : function(){
      if (inner.hasNext){
        var next = inner.next();
       debug.debug("returning fibEntry at prefix %s", next.prefix.toUri());
        if (inner.hasNext){
         debug.debug("more fib entries exist for %s", prefix.toUri());
          this.hasNext = true;
        } else {
         debug.debug("no more fib entries exist for %s", prefix.toUri());
          this.hasNext = false;
        }
        return next.fibEntry;
      } else {
        return null;
      }
    }
  };

  return iterouter;
};

/**Convenience method to get a faceFlag representing all nextHop faces for all prefixes of a given prefix
 *@param {Object|String} prefix ndn.Name Object or NDN URI string to lookup
 *@param {Number=} excludingFaceID faceID to exclude from results
 *@returns {Number} - a faceFlag for use with {@link Interfaces.dispatch}
 */
FIB.prototype.findAllNextHops = function(prefix, excludingFaceID){
  prefix = (typeof prefix === "string") ? new ndn.Name(prefix) : prefix;
  var faceIDs = []
    , iterator = this.findAllFibEntries(prefix);

  while (iterator.hasNext){
    var entry = iterator.next()
      , nextHops = entry.getNextHops(excludingFaceID);
    for (var i =0; i < nextHops.length; i++){
      if ((faceIDs.length === 0) || (faceIDs[faceIDs.length - 1] > nextHops[i].faceID)){
        faceIDs.push(nextHops[i].faceID);
      } else {
        for (var j = 0; j < faceIDs.length; j++){

          if (nextHops[i].faceID === faceIDs[j]){
            break;
          } else if (nextHops[i].faceID > faceIDs[j]){
            faceIDs.splice(j,0, nextHops[i].faceID);
            break;
          }
        }
      }
    }
  }
  return faceIDs;
};

/**Add a FIBEntry
 *@param {String} prefix the nameSpace for the fibEntry
 *@param {Number| Number_Array | nextHop | nextHop_Array} nextHops the nextHop info for the fibEntry
 *@returns {this} FIB for chaining
 */

FIB.prototype.addEntry = function(prefix, nextHops){
  var fibEntry;

  if (
    (typeof nextHops === "number")
    || (
      (typeof nextHops === "object")
      && (nextHops.faceID)
    )
  ) {
    fibEntry = new FibEntry(prefix, [nextHops]);
  } else {
    fibEntry = new FibEntry(prefix, nextHops);
  }
  var node = this.nameTree.lookup(fibEntry.prefix);
  if (!node.fibEntry){
    node.fibEntry = fibEntry;
    return this;
  } else {
    for (var i = 0 ; i < fibEntry.nextHops.length; i++ ){
      var j = binarySearch(node.fibEntry.nextHops, fibEntry.nextHops[i], "faceID");
      if (j < 0){
        node.fibEntry.nextHops.splice(~j, 0, fibEntry.nextHops[i]);
      }
    }
    return this;
  }
};

FIB.Entry = FibEntry;

module.exports = FIB;
