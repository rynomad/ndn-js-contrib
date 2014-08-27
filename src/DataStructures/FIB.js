var binarySearch = require("./../Utility/binarySearch.js")
  , ndn;

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
        var hop
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
  if(excludingFaceID !== undefined){
    var q = {faceID: excludingFaceID }
      , i = binarySearch(this.nextHops, q, "faceID");
    if (i >= 0){
      return this.nextHops.slice(0,i).concat(this.nextHops.slice(i + 1));
    } else {
      return this.nextHops;
    }
  } else {
    return this.nextHops;
  }
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

  var ent = this.nameTree.lookup(prefix)
    , entry = ent.fibEntry;

  if (entry){
    return entry;
  }else{
    return (ent.fibEntry = new FIB.FibEntry({prefix: prefix, nextHops: []}));
  }
};

/**Return an Iterator that progressively returns longest prefix FIBEntries with 1 or more nextHops
 *@param {Object} prefix the ndn.Name object representing the prefix
 *@returns {Object} Iterator object with .next() and .hasNext = Boolean
 */
FIB.prototype.findAllFibEntries = function(prefix){

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
      var next = inner.next();

      if (inner.hasNext){
        this.hasNext = true;
      } else {
        this.hasNext = false;
      }
      return next.fibEntry;
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
  var faceFlag = 0
    , iterator = this.findAllFibEntries(prefix);

  while (iterator.hasNext){
    var entry = iterator.next()
      , nextHops = entry.getNextHops(excludingFaceID);
    for (var i =0; i < nextHops.length; i ++){
      faceFlag = faceFlag | (1 << nextHops[i].faceID);
    }
  }
  return faceFlag;
};

/**Add a FIBEntry
 *@param {Object} -
 *
 */

FIB.prototype.addEntry = function(prefix, nextHop){
  var fibEntry = new FibEntry(prefix, [nextHop]);

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
