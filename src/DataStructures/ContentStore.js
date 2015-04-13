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
  this._EntryClass = ContentStore.Entry;
};

ContentStore.prototype.onMaxPackets = function ContentStore_onMaxPackets(){

};

ContentStore.Entry = function ContentStore_Entry(data, cs){
  this._data = data;
  this._stale = false;
  this.cs = cs;
  var self = this;
  setTimeout( function(){
    console.log("timeout?")
    self.makeStale(cs);
  }, data.getMetaInfo().getFreshnessPeriod() );

  return new Promise(function(resolve,reject){
    resolve(new NameTree.Node(self.getNameWithDigest(),self));
  });
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
    if( interest.getChildSelector())
      self._nameTree.right(interest.name);
    else
      self._nameTree.left(interest.name);

    for (var node of self._nameTree){
      var item = node.getItem();
      if (item !== undefined){

        if(interest.matchesName(item.getNameWithDigest()) && !(interest.getMustBeFresh() && item.getStale()))
          return item.getData()
                     .then(resolve)
                     .catch(reject);
      }
    }

    return reject(null);
  })
};

ContentStore.prototype.setEntryClass = function(clas){
  this._EntryClass = clas;
}

ContentStore.prototype.createNode = function ContentStore_createNode(data, store){
  return new this._EntryClass(data, store);
}

/**Insert a new entry into the contentStore
 *@constructor
 *@param {Buffer} element the raw data packet
 *@param {ndn.Data} data the ndn.Data object
 *@returns {ContentStore} - for chaining
 */
ContentStore.prototype.insert = function ContentStore_insert(data){
  var self = this;
  return new Promise(function ContentStore_insert_Promise (resolve, reject){
    self.createNode(data, self)
        .then(function ContentStore_nameTree_insert(node){
          self._nameTree.insert(node);

          if (self._packetCount + 1 === self.getMaxPackets())
            self.onMaxPackets();

          ++self._packetCount;

          resolve(node.getItem())
        })
        .catch(function ContentStore_insert_reject(err){
          reject(err);
        });
  });
};

ContentStore.prototype.removeNode = function ContentStore_removeNode(node){
  this._nameTree.remove(node.prefix);
  this._packetCount--;
  return node.getItem();
}


module.exports = ContentStore;
