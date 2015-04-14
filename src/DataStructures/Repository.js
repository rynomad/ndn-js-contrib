/**
 *
 *@external ContentStore
 *@see http://rynomad.github.io/ndn-js-contrib/doc/ContentStore.html
 *
 */

var leveldown = require("leveldown"),
    levelup = require("levelup")
  , Name   = require("ndn-js/js/name.js")
  , NameTree = require("./NameTree.js")
  , ContentStore = require("./ContentStore.js")
  , crypto = require("ndn-js/js/crypto.js");
var debug = true;


/**NDN Repository
 *@constructor
 *@param {ContentStore} index - the in-memory {@link http://rynomad.github.io/ndn-javascript-data-structures/doc/ContentStore.html|ContentStore} to do lookups on the underlying key-value store
 *@param {Object} - policy an parameter option for deciding on policies for accepting/rejecting storage requests
 *@returns {Repository}
 */
function Repository (path){
  var self = this;
  this._dataPath = path;
  this._indexPath = path + "/.index";
  this._contentStore = new ContentStore();
  this._contentStore.setEntryClass(Repository.Entry);

  return new Promise(function Repository_Constructor_Promise(resolve,reject){
    self._dataDB  = levelup( self._dataPath
                           , {db:leveldown, valueEncoding: "json"}
                           , function Repository_Contstructor_Promise_levelup(){
                               self.populateContentStoreNodes()
                                   .then(resolve)
                                   .catch(reject);
                           });
  });
}



Repository.Entry = function Repository_Entry(data, repository){
  var self = this;
  this._repository = repository;


  return new Promise(function Repository_createNode_Promsie(resolve,reject){
    if (!data.content){                       // this is a dataShim from populateContentStoreNodes, name should
      if (!data.name.getContentDigestValue()) // already have a digest, but check anyway...
        reject(new Error("new Repository.Entry(data, contentStore) : no content to digest or digest component on name"))
      resolve(new NameTree.Node(data.name, self));
    } else {                                  // we're actually inserting new data
      var packet = data.wireEncode().buffer
        , nameWithDigest = Repository_getNameWithDigest(data.name, packet);

      self._repository
          .dataDB
          .put(nameWithDigest.toUri(), data.wireEncode().buffer, function(err){
            if (err)
              reject(err);
            else{
              this.prefix = nameWithDigest;
              resolve(new NameTree.Node(data.name, self));
            }
          });
    }
  });
};

function Repository_getNameWithDigest(name, packet){
  var name = new Name(name)
  name.append("sha256digest=" + crypto.createHash('sha256')
                                      .update(packet)
                                      .digest()
                                      .toString('hex'));
  return name;
}

Repository.Entry.prototype.getData = function Repository_Entry_getData(){
  var self = this;
  return new Promise(function Repository_Entry_getData_Promise(resolve, reject){
    reject();
  });
};

Repository.Entry.prototype.delete = function Repository_Entry_delete(){
  return new Promise(function Repository_Entry_removeData_Promise(resolve, reject){
    reject();
  });
};

Repository.Entry.prototype.fulfillsInterest = function Repository_Entry_fulfillsInterest(interest){
  return (interest.matchesName(this.prefix));
};

Repository.prototype.createNode = function Repository_createNode(data, repository){
  return this._contentStore.createNode(data, repository);
};

Repository.prototype.insert = function Repository_insert(data){
  return this._contentStore.insert(data, this);
};

Repository.prototype.remove = function Repository_remove(entry){
  var self = this;
  return new Promise(function Repository_remove_Promise(resolve,reject){
    self._contentStore.nameTree.remove(entry.prefix);
    entry.delete()
         .then(resolve)
         .catch(reject);
  });
};

Repository.prototype.lookup = function Repository_lookup(interest){
  return new Promise(function Repository_lookup_Promise(resolve,reject){
    reject();
  });
};


Repository.prototype.populateContentStoreNodes = function Repository_populateContentStoreNodes(){
  var self = this;
  return new Promise(function Repository_populateContentStoreNodes_Promise(resolve,reject){
    var proms = []
    self.dataDB
        .createKeyStream()
        .on("data",function(key){
          proms.push(self.createNode({name:new Name(key)}, self)
                         .then(function(node){
                           return self._contentStore._nameTree.insert(node);
                         }));
        })
        .on("error", function(err){
          reject(err);
        })
        .on("close", function(){
          Promise.all(proms)
                 .then(function (res){
                   resolve();
                 })
                 .catch(function(err){
                   reject(err);
                 })
        });
  });
};


/**get an element from a {RepoEntry}
 *@param {RepoEntry} repoEntry the entry for the desired element
 *@param {function} callback function receiving (err, element) as arguments, asyncronously
 *@returns {this} for chaining
 */
Repository.prototype.getElement = function(repoEntry, callback){
  this.db.get(repoEntry.uri, function(err, data){
   if (!err && !Buffer.isBuffer(data)){
     console.log("got element", data, err)
     data = new Buffer(data);
   }
   callback(data);
  });
  return this;
};

/**Insert an element into the DB and a corresponding RepoEntry into the index
 *@param {Buffer} element - raw data packet
 *@param {Object=} data - the NDN.Data object of the packet
 *@param {function=} callback - called with no arguments on success, with err if fail
 *@returns {this} for chaining
 */
Repository.prototype.insert = function(element, data, callback){
  var db = this.db,
      self = this;
  callback = callback || function(){};

  if (typeof data == "function"){
    callback = data
    data = new ndn.Data()
    data.wireDecode(element);
  }

  db.put(data.name.toUri(), element, function(err){
    self.index.insert(element,data, self);
    callback(err);
  });

  return this;
};

/**Populate the index with keys from the db, called once on startup
 *@private
 *@param {function} callback called with err if one occurs
 */
Repository.prototype.populateNameTree = function(callback){
  var self = this
    , db = self.db;


};

/**Check the Repository for data matching an interest
 *@param {Object} interest and NDN.Interest object
 *@param {function} callback recieves (err, element) err is null if everything is OK, element is a Buffer with the raw data packet
 *@returns {this} for chaining
 */
Repository.prototype.check = function(interest, callback, db) {
  db = db || this;
  if (!db.spun){
    setTimeout(db.check, 200, interest, callback, db);
  } else {
    db.index.check(interest, callback);
  }
  return this;
};

module.exports = Repository;
