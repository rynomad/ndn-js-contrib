var debug = {}; debug.debug= require("debug")("ContentStore");
var lruDebug = require("debug")("lru");
var NameTree = require("./NameTree.js")
var crypto = require("ndn-js/js/crypto.js")
var Name = require("ndn-js/js/name.js").Name;

/**A ContentStore constructor for building cache's and database indexes
 *@constructor
 *@param {NameTree} nameTree the nameTree to build upon
 *@param {constructor} entryClass a constructor class conforming to the same API as {@link csEntry}.
 *@returns {ContentStore} - a new store
 */
var ContentStore = function ContentStore(){
  this._nameTree = new NameTree();
  this._maxPackets = Infinity;
  this._packetCount = 0;
  this._stales = [];
};

ContentStore.Node = function ContentStore_Node(data, cs){
  this._data = data;
  this._stale = false;
  setTimeout( this.makeStale, data.getMetaInfo().getFreshnessPeriod(), cs );
};

ContentStore.Node.prototype.getNameWithDigest = function ContentStore_Node_getNameWithDigest(){
  var name;
  if (!this._nameWithDigest)
  this._nameWithDigest = new Name(node.getData().name)

  this._nameWithDigest.append("sha256digest=" + crypto.createHash('sha256')
                                                      .update(node.getData()
                                                                  .wireEncode()
                                                                  .buffer)
                                                      .digest());


}

ContentStore.Node.prototype.getData = function ContentStore_Node_getData(){
  return this._data;
};


ContentStore.Node.prototype.makeStale = function ContentStore_Node_makeStale(cs){
  this.stale = true;
};

ContentStore.prototype.setMaxPackets = function ContentStore_setMaxPackets(int){
  this._maxPackets = int;
}

ContentStore.prototype.getMaxPackets = function ContentStore_getMaxPackets(){
  return this._maxPackets;
}




/**check the ContentStore for data matching a given interest (including min/max suffix, exclude, publisherKey)
 *@param {ndn.Interest} interest the interest to match against
 *@param {function=} callback for asynchronous cases (like levelDB). recieves return value as only argument
 *@returns {Buffer | null}
 */
ContentStore.prototype.lookup = function(interest){

};

ContentStore.prototype._insert = function ContentStore__insert (resolve, reject){
  var node = this._toInsert;
  if (!node)
    reject(new Error("Invalid State: ContentStore._toInsert is not present"))
  this._toInsert = null;

  this._nameTree.get(node.getNameWithDigest()).setItem(node)
  this._packetCount++;
  resolve(this._packetCount)


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

ContentStore.prototype.remove = function(node){
  //this.nameTree.remove(node)
}

ContentStore.prototype.clean

module.exports = ContentStore;
