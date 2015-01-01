
function repoEntry (element, data, db){
  var self = this;
  var freshnessPeriod = (data.getMetaInfo) ? data.getMetaInfo().getFreshnessPeriod() : null;
  this.name = data.name;
  this.uri = data.name.toUri();
  this.database = db;
  this.freshnessPeriod = freshnessPeriod;
  this.publisherPublicKeyDigest = (data.signedInfo) ?
    data.signedInfo.publisher.publisherPublicKeyDigest
  : undefined;
  /*
  if (freshnessPeriod){
    this.element = element;
    setTimeout(function(){
      self.element = null;
    }, freshnessPeriod);
  }
  */
  return this;
}

repoEntry.installDatabase = function(db){
  repoEntry.database = db;
};


repoEntry.type = "repoEntry";

repoEntry.prototype.getElement = function(callback){
  if (this.element){
    callback(this.element);
  } else{
    this.database.getElement(this, callback);
  }
};

repoEntry.prototype.setElement = function(element){
  if (this.freshnessPeriod){
    this.element = element;
    setTimeout(function(){
      this.element = null;
    }, this.freshnessPeriod);
  }

  return this;
};

repoEntry.prototype.stale = function(node){
  if ((node.repoEntry === this) && node.repoEntry.element){
    node.repoEntry.element = null;
  }
  return this;
};

module.exports = repoEntry;
