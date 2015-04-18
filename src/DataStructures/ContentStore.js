var debug = {}; debug.debug= require("debug")("ContentStore");
var lruDebug = require("debug")("lru");
var NameTree = require("./NameTree.js")
var crypto = require("ndn-js/js/crypto.js")
var Name = require("ndn-js/js/name.js").Name;

/** ContentStore constructor for building cache's and database indexes
 *@constructor
 *@returns {ContentStore} - a new ContentStore
 */
var ContentStore = function ContentStore(){
  this._nameTree = new NameTree();
  this._maxPackets = Infinity;
  this._packetCount = 0;
  this._stales = [];
  this._EntryClass = ContentStore.Entry;
  return this;
};

/**
 * override the default ContentStore.Entry class, see {@link Repository} for an example
 *@param {Function} clas - the constructor for the entry class to use henceforth. Must provide a compatible promise api
 *@param {Object} this - for chaining
 */
ContentStore.prototype.setEntryClass = function(clas){
  this._EntryClass = clas;
  return this;
}


ContentStore.prototype.onMaxPackets = function ContentStore_onMaxPackets(){
  //todo: impliment a basic eviction algorithm
};

ContentStore.prototype.setOnMaxPackets = function ContentStore_setOnMaxPackets(onMaxPackets){
  if (typeof onMaxPackets !== "function")
    throw new Error("ContentStore.setOnMaxPackets(onMaxPackets): must be a function")
  this.onMaxPackets = onMaxPackets.bind(this);
}
ContentStore.Entry = function ContentStore_Entry(data, cs){
  this._data = data;
  this._stale = false;
  this.cs = cs;
  var self = this;
  setTimeout( function(){
    self.makeStale(cs);
  }, data.getMetaInfo().getFreshnessPeriod() );

  return this;
};



ContentStore.Entry.prototype.getNameWithDigest = function ContentStore_Entry_getNameWithDigest(){
  if (!this._nameWithDigest){
    this._nameWithDigest = new Name(this._data.name)
    this._nameWithDigest.append("sha256digest=" + crypto.createHash('sha256')
                                                        .update(this._data
                                                                    .wireEncode()
                                                                    .buffer)
                                                        .digest()
                                                        .toString('hex'));
  }

  return this._nameWithDigest;
};

ContentStore.Entry.prototype.getData = function ContentStore_Entry_getData(){
  var self = this;
  return new Promise(function ContentStore_Entry_getData_Promise(resolve, reject){
    resolve(self._data);
  })
};

ContentStore.Entry.prototype.onDataStale = function ContentStore_Entry_onDataStale (){

};


ContentStore.Entry.prototype.makeStale = function ContentStore_Entry_makeStale(cs){
  this._stale = true;
  this.onDataStale(cs);
};

ContentStore.Entry.prototype.fulfillsInterest = function ContentStore_Entry_fulfillsInterest(interest){
  return ( interest.matchesName(this.getNameWithDigest())
      && !(interest.getMustBeFresh() && this.getStale()));
}

ContentStore.Entry.prototype.getStale = function ContentStore_Entry_getStale(){
  return this._stale;
}

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
  var self = this;
  return new Promise(function ContentStore_lookup_Promise(resolve, reject){
    if(interest.getChildSelector())
      self._nameTree.right(interest.name);
    else
      self._nameTree.left(interest.name);

    for (var node of self._nameTree){
      var entry = node.getItem();
      if (entry && entry.fulfillsInterest(interest)){
        return entry.getData()
                    .then(resolve)
                    .catch(reject);
      }
    }

    return reject(interest);
  })
};


ContentStore.prototype.createNode = function ContentStore_createNode(data, store){
  var self = this;
  return new Promise(function ContentStore_createNode_Promise(resolve,reject){
    var entry = new self._EntryClass(data, self);
    resolve(new NameTree.Node(entry.getNameWithDigest(),entry));
  })
}

/**Insert a new entry into the contentStore
 *@constructor
 *@param {Buffer} element the raw data packet
 *@param {ndn.Data} data the ndn.Data object
 *@returns {ContentStore} - for chaining
 */
ContentStore.prototype.insert = function ContentStore_insert(data, store){
  var self = this;
  store = store || self;
  return store.createNode(data, store)
              .then(function ContentStore_nameTree_insert(node){
                self._nameTree.insert(node);

                if (self._packetCount + 1 === self.getMaxPackets())
                  self.onMaxPackets();

                ++self._packetCount;

                return node.getItem();
              });

};

ContentStore.prototype.removeNode = function ContentStore_removeNode(node){
  this._nameTree.remove(node.prefix);
  this._packetCount--;
  return node.getItem();
}


module.exports = ContentStore;
