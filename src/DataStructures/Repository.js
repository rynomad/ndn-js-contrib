/**
 *
 *@external ContentStore
 *@see http://rynomad.github.io/ndn-js-contrib/doc/ContentStore.html
 *
 */

var leveldown = require("leveldown"),
    levelup = require("levelup"),
    path = (process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH || "") + "/.NDN-Repo",
    ndn;
var debug = true;

/**NDN Repository
 *@constructor
 *@param {ContentStore} index - the in-memory {@link http://rynomad.github.io/ndn-javascript-data-structures/doc/ContentStore.html|ContentStore} to do lookups on the underlying key-value store
 *@param {Object} - policy an parameter option for deciding on policies for accepting/rejecting storage requests
 *@returns {Repository}
 */
function Repository (index, policy, onopen){
  var self = this;
  this.index = index;
  this.nameTree = index.nameTree;
  this.ndn = index.ndn;
  this.db = levelup(policy.path || path, {db: leveldown,
                                          valueEncoding: "json"
                                         }, function(){
    self.populateNameTree(onopen);
  });
  return this;
}

/** Install the NDN-lib Object
 *@param {Object} NDN NDN-lib as object
 */
Repository.installNDN = function(NDN){
  ndn = NDN;
  return this;
};

/**get an element from a {RepoEntry}
 *@param {RepoEntry} repoEntry the entry for the desired element
 *@param {function} callback function receiving (err, element) as arguments, asyncronously
 *@returns {this} for chaining
 */
Repository.prototype.getElement = function(repoEntry, callback){
  this.db.get(repoEntry.uri, function(err, data){
   if (!Buffer.isBuffer(data)){
     data = new Buffer(data);
   }
   callback(err, data);
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
    self.index.insert(element,data);
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
  callback = callback || function(){return;};

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
