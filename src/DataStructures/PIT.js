var binarySearch = require("./../Utility/binarySearch.js")
  , ndn;


function pubKeyMatch (ar1, ar2){
  if (!ar1){
    return true;
  }

  for(var i = 0; i < ar1.length; i++ ){
    if (ar1[i] !== ar2[i]){
      return false;
    }
  }
  return true;
}

/**PIT Entry
 *@constructor
 *@param {Buffer} element The raw interest data packet
 *@param {Object=} interest the ndn.Interest Object
 *@param {number|function} faceIDorCallback Either the faceID of the face this interest was received on, or a callback function to receive any matching data
 *@returns {PitEntry} - the entry
 */
function PitEntry (element, interest, faceIDorCallback){
  if (typeof interest !== "object"){
    faceIDorCallback = interest;
    interest = new ndn.Interest();
    interest.wireDecode(element);
  }
  if (!interest.nonce){
    interest.wireDecode(element);
  }
  this.nonce = interest.nonce;
  this.uri = interest.name.toUri();
  this.interest = interest;
  this.element = element;
  if (typeof faceIDorCallback === "function" ){
    this.callback = faceIDorCallback;
  } else {
    this.faceID = faceIDorCallback;
  }
  return this;
}

/**Test whether the PitEntry is fulfilled by a data object
 *@param {Object} data the ndn.Data object
 *@returns {Boolean}
 */
PitEntry.prototype.matches = function(data){
  if (this.interest.matchesName(data.name)
     && pubKeyMatch(this.interest.publisherPublicKeyDigest, data.signedInfo.publisher.publisherPublicKeyDigest)
     ){
    return true;
  } else {
    return false;
  }
};

/**Consume the PitEntry (assuming it is attached to a the nameTree)
 *@returns {PitEntry} in case you want to do anything with it afterward
 */
PitEntry.prototype.consume = function() {
  if (this.nameTreeNode){
    var i = binarySearch(this.nameTreeNode.pitEntries, this, "nonce");
    if (i >= 0){
      var removed = this.nameTreeNode.pitEntries.splice(~i, 1)[0];
      if (removed.callback){
        removed.callback(null, removed.interest);
      }
    }
  }
  return this;
};




/**Pending Interest Table
 *@constructor
 *@param {NameTree} nameTree the nameTree to build the table on top of
 *@returns {PIT} a new PIT
 */
var PIT = function PIT(nameTree){
  this.nameTree = nameTree;
  return this;
};

/**Import ndn-lib into the PIT scope
 *@param {Object} NDN the NDN-js library in object form
 */
PIT.installNDN = function(NDN){
  ndn = NDN;
  return this;
};

PIT.Entry = PitEntry;

PIT.prototype.useNameTree = function(nameTree){
  this.nameTree = nameTree;
  return this;
};

/**Create and insert a new {@link PITEntry}
 *@param {Buffer} element The raw interest data packet
 *@param {Object=} interest the ndn.Interest object
 *@param {Number|function} faceIDorCallback either a numerical faceID or a callbackFunction
 *@returns {PIT} the PIT (for chaining)
 */
PIT.prototype.insertPitEntry = function(element, interest, faceIDorCallback){
  var pitEntry = new PIT.Entry(element, interest, faceIDorCallback);

  setTimeout(function(){
    pitEntry.consume();
  }, pitEntry.interest.getInterestLifetimeMilliseconds() || 10);
  var node = this.nameTree.lookup(pitEntry.interest.name);

  var i = binarySearch(node.pitEntries, pitEntry, "nonce");
  if (i < 0){
    pitEntry.nameTreeNode = node;
    node.pitEntries.splice(~i, 0 ,pitEntry);
  }
  return this;
};

/**Lookup the PIT for Entries matching a given data object
 *@param {Object} data The ndn.Data object
 *@returns {Object} results: an object with two properties, pitEntries and faces, which are
 * an array of matching {@link PITEntry}s and
 * an integer faceFlag for use with {@link Interfaces.dispatch}, respectively.
 */
PIT.prototype.lookup = function(data, name, matches, faceFlag){
  name = name || data.name;
  matches = matches || [];
  faceFlag = faceFlag || 0;

  var pitEntries = this.nameTree.lookup(name).pitEntries;

  for (var i = 0; i < pitEntries.length; i++){
    if (pitEntries[i].matches(data)){
      matches.push(pitEntries[i]);
      faceFlag = faceFlag | (1 << pitEntries[i].faceID);
    }
  }

  if (name.size() > 0){
    return this.lookup(data, name.getPrefix(-1), matches, faceFlag);
  } else{
    return {pitEntries : matches, faces : faceFlag};
  }
};

module.exports = PIT;
