var debug = {}; debug.debug= require("debug")("ContentStore");
var lruDebug = require("debug")("lru");
var NameTree = require("./NameTree.js")

/**A ContentStore constructor for building cache's and database indexes
 *@constructor
 *@param {NameTree} nameTree the nameTree to build upon
 *@param {constructor} entryClass a constructor class conforming to the same API as {@link csEntry}.
 *@returns {ContentStore} - a new store
 */
var ContentStore = function ContentStore(){
  this._nameTree = new NameTree();
};

ContentStore.Node = function ContentStore_Node(data){
  this._data = data;
};

ContentStore.Node.prototype.getData = function ContentStore_Node_getData(){
  return this._data;
};


/** Default EntryClass for ContentStore
 *@constructor
 *@private
 *@param {Buffer} element the raw data packet.
 *@param {Data} data the ndn.Data object
 */
function csEntry (element, data){
  var freshnessPeriod = data.getMetaInfo().getFreshnessPeriod();
  this.name = data.name;
  this.freshnessPeriod = freshnessPeriod;
  this.uri = data.name.toUri();
  this.publisherPublicKeyDigest = data.signedInfo.publisher.publisherPublicKeyDigest;
  Cache.set(data.name.toUri(), {
    entry: this,
    element: element
  });
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
  return callback(Cache.get(this.uri).element);
};

/**
 *@private
 *@param {NameTreeNode} node the node to remove this entry from
 *@returns {csEntry} entry the csEntry in case you want to do something other than throw it away
 */
csEntry.prototype.stale = function(node){
  node.csEntry = null;
  if (Cache.has(this.uri)){
    Cache.del(this.uri);
  }
  return this;
};


/**check the ContentStore for data matching a given interest (including min/max suffix, exclude, publisherKey)
 *@param {ndn.Interest} interest the interest to match against
 *@param {function=} callback for asynchronous cases (like levelDB). recieves return value as only argument
 *@returns {Buffer | null}
 */
ContentStore.prototype.lookup = function(interest){
  
};

ContentStore.prototype._insert = function ContentStore__insert (resolve, reject){
  var node = this._toInsert;



}

/**Insert a new entry into the contentStore
 *@constructor
 *@param {Buffer} element the raw data packet
 *@param {ndn.Data} data the ndn.Data object
 *@returns {ContentStore} - for chaining
 */
ContentStore.prototype.insert = function(node){
  var promise;

  if (this._toInsert)
    promise = new Promise(function(resolve,reject){reject(new Error("Invalid State: ContentStore._toInsert not null, aborting"))})
  else {
    this._toInsert = node;
    promise = new Promise(this._insert);
  }

  return promise;
};

module.exports = ContentStore;
