

var NameTree = require("./NameTree.js")

function PIT(){
  this._nameTree = new NameTree()
}

PIT.prototype.insert = function PIT_insert(interest, onData){
  var self = this;
  return new Promise(function PIT_insert_Promise(resolve,reject){
    var node = self._nameTree.get(interest.name)
    if (!node.getItem())
      node.setItem(new PIT.Node())

    var pitNode = node.getItem();
    if (pitNode.addEntry(interest, onData ))
      resolve(interest)
    else
      reject(new Error("PIT.insert(interest, onData): interest is duplicate"))

  })
};

PIT.prototype.lookup = function PIT_lookup(data){
  return new Promise(function PIT_lookup_Promise(resolve,reject){
    reject(data);
  })
};

PIT.Node = function PIT_Node(){
  this._entries = [];
};

PIT.Node.prototype.timeout = function PIT_Node_timeout(interest){
  for (var index in this._entries)
    if (this._entries[index].getNonce().equals(interest.getNonce()))
      return this._entries.splice(index, 1);
}

PIT.Node.prototype.addEntry = function PIT_Node_addEntry(interest, onData){
  var self = this;
  for (var entry of this._entries)
    if (entry.interest.getNonce().equals(interest.getNonce()))
      return false;

  this._entries.push({
    interest: interest
    , onData: onData
    , timeID: setTimeout(function PIT_Node_entry_timeout(){
      self.timeout(interest);
    },interest.getInterestLifetimeMilliseconds())
  });
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
  debug.debug("constructing entry for %s", interest.toUri());
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
  debug.debug("checking if %s matches %s", this.interest.name.toUri(), data.name.toUri());
  if (this.interest.matchesName(data.name)
     && pubKeyMatch(this.interest.publisherPublicKeyDigest, data.signedInfo.publisher.publisherPublicKeyDigest)
     ){
    debug.debug("entry matches");
    return true;
  } else {
    debug.debug("entry does not match");
    return false;
  }
};

/**Consume the PitEntry (assuming it is attached to a the nameTree)
 *@returns {PitEntry} in case you want to do anything with it afterward
 */
PitEntry.prototype.consume = function(callbackCalled) {
  debug.debug("consuming entry %s", this.uri);
  if (this.nameTreeNode){
    var i = binarySearch(this.nameTreeNode.pitEntries, this, "nonce");
    if (i >= 0){
      var removed = this.nameTreeNode.pitEntries.splice(~i, 1)[0];
      if (removed.callback && !callbackCalled){
        debug.debug("executing PITEntry Callback %s", removed.callback.toString());
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

  //console.log(new Error("pitConstructStackCheck").stack)
  debug.debug("inserting pit entry %s with lifetime milliseconds %s",pitEntry.interest.toUri(), pitEntry.interest.getInterestLifetimeMilliseconds() );
  setTimeout(function(){
    debug.debug("entry %s expired after %s ms", pitEntry.uri, pitEntry.interest.getInterestLifetimeMilliseconds());
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

PIT.prototype.checkDuplicate = function(interest){
  debug.debug("checking interest %s for duplicate", interest.toUri());
  var node = this.nameTree.lookup(interest.name);

  var i = binarySearch(node.pitEntries, interest, "nonce");

  if (i < 0){
    debug.debug("%s is not duplicate", interest.toUri());
    return false;
  } else {
    debug.debug("%s is duplicate", interest.toUri());
    return true;
  }

};

/**Lookup the PIT for Entries matching a given data object
 *@param {Object} data The ndn.Data object
 *@returns {Object} results: an object with two properties, pitEntries and faces, which are
 * an array of matching {@link PITEntry}s and
 * an sorted array of faceIDs for use with {@link Interfaces.dispatch}, respectively.
 */
PIT.prototype.lookup = function(data, name, matches, faceIDs){
  name = name || data.name;
  matches = matches || [];
  faceIDs = faceIDs || [];
  debug.debug("lookup entries for %s", name.toUri());

  var pitEntries = this.nameTree.lookup(name).pitEntries;

  for (var i = 0; i < pitEntries.length; i++){
    if (pitEntries[i].matches(data)){
      debug.debug("found match %s", pitEntries[i].uri);
      matches.push(pitEntries[i]);
      if (pitEntries[i].faceID !== (null || undefined)){
        if ((faceIDs.length === 0) || (faceIDs[faceIDs.length - 1] > pitEntries[i].faceID)){
          faceIDs.push(pitEntries[i].faceID);
        } else {
          for (var j = faceIDs.length - 1; j >= 0; j--){
            if (faceIDs[j] > pitEntries[i].faceID){
              faceIDs.splice(j+1,0, pitEntries[i].faceID);
            } else if (faceIDs[j] === pitEntries[i].faceID){
              break;
            }
          }
        }
      }
    }
  }

  if (name.size() > 0){
    return this.lookup(data, name.getPrefix(-1), matches, faceIDs);
  } else{
    return {pitEntries : matches, faces : faceIDs};
  }
};

module.exports = PIT;
