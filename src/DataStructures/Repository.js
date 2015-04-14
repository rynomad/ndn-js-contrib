/**
 *
 *@external ContentStore
 *@see http://rynomad.github.io/ndn-js-contrib/doc/ContentStore.html
 *
 */

var leveldown = require("leveldown")
  , levelup = require("levelup")
  , Name   = require("ndn-js/js/name.js").Name
  , crypto = require("ndn-js/js/crypto.js")
  , Data   = require("ndn-js/js/data.js").Data
  , NameTree = require("./NameTree.js")
  , ContentStore = require("./ContentStore.js")


function Repository (path){
  var self = this;
  this._dataPath = path;
  this._indexPath = path + "/.index";
  this._contentStore = new ContentStore();
  this._contentStore.setEntryClass(Repository.Entry);

  return new Promise(function Repository_Constructor_Promise(resolve,reject){
    levelup( self._dataPath
           , {db:leveldown, valueEncoding: "json"}
           , function Repository_Contstructor_Promise_levelup(err, db){
             if (err)
               return reject(err);

             self._dataDB = db;
             self.populateContentStoreNodes()
                 .then(function(){
                   resolve(self)
                 })
                 .catch(reject);

           });
  });
}


Repository.Open = function Repository_Open(path){
  return new Repository(path);
};



Repository.Entry = function Repository_Entry(data, repository){
  var self = this;
  this._repository = repository;
  console.log("!!!!!!!!!!!!!", data)

  return new Promise(function Repository_createNode_Promise(resolve,reject){
    console.log(">>>>",!data.content)
    if (!data.content){                       // this is a dataShim from populateContentStoreNodes, name should
      if (data.name.get(-1).toEscapedString().substr(0, 12) !== "sha256digest") // already have a digest, but check anyway...
        reject(new Error("new Repository.Entry(data, contentStore) : no content to digest or digest component on name" + data.name.toUri()))
      resolve(new NameTree.Node(data.name, self));
    } else {                                  // we're actually inserting new data
      var packet = data.wireEncode().buffer
        , nameWithDigest = Repository_getNameWithDigest(data.name, packet);

      console.log("new Repository_Entry")
      self._repository
          ._dataDB
          .put(nameWithDigest.toUri(), data.wireEncode().buffer, function(err){
            if (err)
              reject(err);
            else{
              self.prefix = nameWithDigest;
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
    self._repository
        ._dataDB
        .get(self.prefix.toUri(), function(err, packet){
          if (err)
            return reject(err);

          var data = new Data()
          data.wireDecode(new Buffer(packet));
          resolve(data);
        });
  });
};

Repository.Entry.prototype.delete = function Repository_Entry_delete(){
  var self = this;
  return new Promise(function Repository_Entry_delete_Promise(resolve, reject){
    self._repository
        ._dataDB
        .del(self.prefix.toUri(), function(err){
          if (err)
            return reject(err);
          resolve();
        });
  });
};

Repository.Entry.prototype.fulfillsInterest = function Repository_Entry_fulfillsInterest(interest){

  return (!!this.prefix && interest.matchesName(this.prefix));
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
  return this._contentStore.lookup(interest);
};


Repository.prototype.populateContentStoreNodes = function Repository_populateContentStoreNodes(){
  var self = this;
  return new Promise(function Repository_populateContentStoreNodes_Promise(resolve,reject){
    var proms = [];
    self._dataDB
        .createKeyStream()
        .on("data",function(key){
          console.log("dat", key)
          proms.push(self.createNode({name:new Name(key)}, self)
                         .then(function(node){
                           return self._contentStore._nameTree.insert(node);
                         }))
        })
        .on("error", function(err){
          console.log("err!!!!!!!!!!")
          reject(err);
        })
        .on("close", function(){
          console.log("key stream complete")

        })
        .on("end", function(){
          console.log("end")
          Promise.all(proms)
                 .then(resolve)
                 .catch(function(err){
                   self.close()
                       .then(function(){
                         console.log('err?!')
                         reject(err);
                       })
                 })
        });
  });
};

Repository.prototype.close = function Repository_close(){
  var self = this;
  return new Promise(function Repository_close_Promise(resolve,reject){
    self._dataDB.close(function Repository_close_Promise_level(err){
      if (err)
        return reject(err)
      resolve();
    });
  })
}
module.exports = Repository;
