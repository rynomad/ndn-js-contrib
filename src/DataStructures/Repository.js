/**
 *
 *@external ContentStore
 *@see http://rynomad.github.io/ndn-js-contrib/doc/ContentStore.html
 *
 */

var leveldown = require("leveldown"),
    levelup = require("levelup");
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

Repository.prototype.populateContentStoreNodes = function Repository()

Repository.Entry = function Repository_Entry(data){

};

Repository.Entry.prototype.getData = function Repository_Entry_getData(){
  return new Promise(function Repository_Entry_getData_Promise(resolve, reject){
    reject();
  })
};

Repository.Entry.prototype.setData = function Repository_Entry_setData(){
  return new Promise(function Repository_Entry_removeData_Promise(resolve, reject){
    reject();
  })
}

Repository.prototype.createNode = function Repository_createNode(){
  return new Promise(function Repository_createNode_Promsie(resolve,reject){
    reject();
  })
}

Repository.prototype.insert = function Repository_insert(data){
  return new Promise(function Repository_insert_Promise(resolve,reject){
    reject();
  })
};

Repository.prototype.remove = function Repository_remove(entry){
  return new Promise(function Repository_remove_Promise(resolve,reject){
    reject();
  })
}

Repository.prototype.lookup = function Repository_lookup(interest){
  return new Promise(function Repository_lookup_Promise(resolve,reject){
    reject();
  })
}


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

  db.createKeyStream()
    .on("data",function(key){
      self.index.insert(null, new ndn.Data(new ndn.Name(key)));
    })
    .on("error", function(err){
      callback(err);
    })
    .on("close", function(){
      self.spun = true;
      callback();
    });
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
