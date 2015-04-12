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
  this._nodeClass = ContentStore.Node;
};

ContentStore.prototype.setKeyChain = function ContentStore_setKeyChain(keyChain){
  this._keyChain = keyChain;
};

ContentStore.prototype.getKeyChain = function ContentStore_getKeyChain(){
  return this._keyChain || null;
};

ContentStore.prototype.onMaxPackets = function ContentStore_onMaxPackets(){

};

ContentStore.Node = function ContentStore_Node(data, cs){
  this._data = data;
  this._stale = false;
  var self = this;
  setTimeout( this.makeStale.bind(this), data.getMetaInfo().getFreshnessPeriod(), cs );
  return new Promise(function(resolve,reject){
    resolve(new NameTree.Node(self.getNameWithDigest(),self));
  });
};



ContentStore.Node.prototype.getNameWithDigest = function ContentStore_Node_getNameWithDigest(){
  if (!this._nameWithDigest){
    this._nameWithDigest = new Name(this.getData().name)
    this._nameWithDigest.append("sha256digest=" + crypto.createHash('sha256')
                                                        .update(this.getData()
                                                                  .wireEncode()
                                                                  .buffer)
                                                        .digest()
                                                        .toString('hex'));
  }

  return this._nameWithDigest;
};

ContentStore.Node.prototype.getData = function ContentStore_Node_getData(){
  return this._data;
};

ContentStore.Node.prototype.onDataStale = function ContentStore_Node_onDataStale (){

}

ContentStore.Node.prototype.makeStale = function ContentStore_Node_makeStale(cs){
  this.stale = true;
  this.onDataStale();
};

ContentStore.prototype.setMaxPackets = function ContentStore_setMaxPackets(int){
  this._maxPackets = int;
}

ContentStore.prototype.getMaxPackets = function ContentStore_getMaxPackets(){
  return this._maxPackets;
}



ContentStore.prototype._lookup = function(resolve, reject){

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
      self._nameTree.right(interest.name)
    else
      self._nameTree.left(interest.name)

    for (var node of self._nameTree){
      var item = node.getItem();
      if (item !== undefined){
        var data = item.getData();
        if (interest.matchesName(data.name))
          if(interest.getMustBeFresh()){
            if(!item.stale)
              resolve(data);
          } else {
            resolve(data);
          }

      }
    }

    reject(interest);
  })
};

ContentStore.prototype.setNodeClass = function(clas){
  this._nodeClass = clas;
}

ContentStore.prototype.createNode = function ContentStore_createNode(data){
  return new this._nodeClass(data, this);
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
    var keyChain = self.getKeyChain()
    console.log(keyChain)
      if (keyChain !== null){
        keyChain.verifyData(data, function keyChain_onVerify(){
          self.createNode(data)
              .then(function ContentStore_nameTree_insert(node){
                return self._nameTree.insert(node);
              })
              .then(function ContentStore_insert_resolve(returns){
                if (self._packetCount + 1 === self.getMaxPackets())
                  self.onMaxPackets();
                resolve(++self._packetCount)
              })
              .catch(function ContentStore_insert_reject(err){
                reject(err);
              });
        }, function keyChain_onVerifyFailed(er){
          console.log("verify failed")
          reject(er)
        })
      } else {
        self.createNode(data)
            .then(function ContentStore_nameTree_insert(node){
              return self._nameTree.insert(node);
            })
            .then(function ContentStore_insert_resolve(returns){
              if (self._packetCount + 1 === self.getMaxPackets())
                self.onMaxPackets();
              resolve(++self._packetCount)
            })
            .catch(function ContentStore_insert_reject(err){
              reject(err);
            });
      }
  });
};

ContentStore.prototype.remove = function(node){
  this.nameTree.get(node.getNameWithDigest()).setItem(null);
  this.nameTree.remove(node.getNameWithDigest());
}


module.exports = ContentStore;
