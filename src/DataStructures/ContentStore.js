var debug = false;

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


/** Default EntryClass for ContentStore
 *@constructor
 *@private
 *@param {Buffer} element the raw data packet.
 *@param {Data} data the ndn.Data object
 */
function csEntry (element, data){
  var freshnessPeriod = data.getMetaInfo().getFreshnessPeriod();
  this.name = data.name;
  this.element = element;
  this.freshnessPeriod = freshnessPeriod;
  this.uri = data.name.toUri();
  this.publisherPublicKeyDigest = data.signedInfo.publisher.publisherPublicKeyDigest;
  return this;
}

/**
 *@property {String} type a type string describing the type of entry
 */
csEntry.type = "csEntry";

/** sync/async getter for the element
 *@private
 *@param {function} callback Recieves element as only argument
 *@returns {Buffer} element the raw data packet
 */
csEntry.prototype.getElement = function(callback){
  callback = callback || function(e){return e;};
  return callback(this.element);
};

/**
 *@private
 *@param {NameTreeNode} node the node to remove this entry from
 *@returns {csEntry} entry the csEntry in case you want to do something other than throw it away
 */
csEntry.prototype.stale = function(node){
  delete node.csEntry;
  return this;
};

/**A ContentStore constructor for building cache's and database indexes
 *@constructor
 *@param {NameTree} nameTree the nameTree to build upon
 *@param {constructor} entryClass a constructor class conforming to the same API as {@link csEntry}.
 *@returns {ContentStore} - a new store
 */
function ContentStore(nameTree, entryClass){
  this.nameTree = nameTree;
  this.EntryClass = entryClass || csEntry;
  return this;
}

/**check the ContentStore for data matching a given interest (including min/max suffix, exclude, publisherKey)
 *@param {ndn.Interest} interest the interest to match against
 *@param {function=} callback for asynchronous cases (like levelDB). recieves return value as only argument
 *@returns {Buffer | null}
 */
ContentStore.prototype.check = function(interest, callback, node, suffixCount, childTracker, stack){
  callback = callback || function(element){return element;};
  node = node || this.nameTree.lookup(interest.name);
  stack = stack || 1;
  stack++;
  if (stack++ > Object.keys(this.nameTree).length * 2){
    console.log("stack over");
    return callback(null);
  }

  var self = this;

  if (node[this.EntryClass.type]
      && interest.matchesName(node[this.EntryClass.type].name)
      && pubKeyMatch(interest.publisherPublicKeyDigest, node[this.EntryClass.type].publisherPublicKeyDigest)
     ){
    return node[this.EntryClass.type].getElement(callback);
  }



  suffixCount = suffixCount || 0;
  childTracker = childTracker || [];

  var maxSuffix = interest.getMaxSuffixComponents()
    , minSuffix = interest.getMinSuffixComponents()
    , childSelector = interest.getChildSelector()
    , atMaxSuffix = (maxSuffix && (suffixCount === maxSuffix))
    , hasChildren = (node.children.length > 0)
    , hasMoreSiblings = function(node){
      if (debug) {console.log(childTracker.length, node.parent.children.length, childTracker[childTracker.length - 1] );}
      return  (!!childTracker.length && !!node.parent && (node.parent.children.length > childTracker[childTracker.length - 1] + 1));
    };

  if (debug) {console.log(node.prefix.toUri(), interest.name.toUri(), childTracker, hasMoreSiblings(node));}

  function toChild(node){
    if (debug) {console.log("toChild", childTracker);}
    suffixCount++;
    childTracker.push(0);
    if (!childSelector){ //leftmost == 0 == falsey

      return self.check(interest, callback, node.children[0], suffixCount, childTracker , stack++);
    } else {

      return self.check(interest, callback, node.children[node.children.length - 1], suffixCount, childTracker, stack++);
    }
  }

  function toSibling(node){
    if (debug) {console.log("toSibling from ", node.prefix.toUri(), childTracker, node);}
    childTracker[childTracker.length - 1]++;

    if (!childSelector){
      if (debug) {console.log(node.prefix.toUri(), childTracker, node.parent.children[childTracker[childTracker.length - 1]].prefix.toUri());}
      return self.check(interest, callback, node.parent.children[childTracker[childTracker.length - 1]], suffixCount, childTracker, stack++);
    } else {
      if (debug) {console.log(node.prefix.toUri(), childTracker, node.parent.children[node.parent.children.length  + ~childTracker[childTracker.length - 1]].prefix.toUri());}
      return self.check(interest, callback, node.parent.children[node.parent.children.length  + ~childTracker[childTracker.length - 1]], suffixCount, childTracker, stack++);
    }
  }

  function toAncestorSibling(node, stack){
    if (debug) {console.log("toAncestorSibling from ",node.prefix.toUri(), childTracker);}
    suffixCount--;
    childTracker.pop();
    if (stack++ > 10000){
      return callback(null);
    }

    var hasParentSibling = (node.parent && node.parent.parent && node.parent.parent.children.length > childTracker[childTracker.length - 1] + 1);

    if (hasParentSibling){
      return toSibling(node.parent);
    } else if (childTracker.length >0) {
      return toAncestorSibling(node.parent, stack++);
    } else {
      return callback(null);
    }
  }

  if (childTracker.length === 1){
    if (interest.exclude.matches(node.prefix.get(-1))){
      if (hasMoreSiblings(node)){
        return toSibling(node);
      } else {
        return callback(null);
      }
    }
  }



  if (!node.prefix.size() ||(!atMaxSuffix && hasChildren)){
    return toChild(node);
  } else if (hasMoreSiblings(node)){
    return toSibling(node);
  } else if (childTracker.length > 1){
    return toAncestorSibling(node);
  } else{
    return callback(null);
  }
};

/**Insert a new entry into the contentStore
 *@constructor
 *@param {Buffer} element the raw data packet
 *@param {ndn.Data} data the ndn.Data object
 *@returns {ContentStore} - for chaining
 */
ContentStore.prototype.insert = function(element, data){
  var Entry = this.EntryClass;
  var freshness = data.getMetaInfo().getFreshnessPeriod();
  var node = this.nameTree.lookup(data.name)
  , entry = new Entry(element, data);
  node[Entry.type] = entry;
  node[Entry.type].nameTreeNode = node;
  setTimeout(function(){
    if (node[Entry.type]) {node[Entry.type].stale(node);}
  }, freshness || 20 );
  return this;
};


module.exports = ContentStore;
