
function repoEntry (element, data){
  var self = this;
  var freshnessPeriod = (data.getMetaInfo) ? data.getMetaInfo().getFreshnessPeriod() : null;
  this.name = data.name;
  this.uri = data.name.toUri();
  this.freshnessPeriod = freshnessPeriod;
  this.publisherPublicKeyDigest = (data.signedInfo) ?
    data.signedInfo.publisher.publisherPublicKeyDigest
  : undefined;

  if (freshnessPeriod){
    this.element = element;
    setTimeout(function(){
      delete self.element;
    }, freshnessPeriod);
  }

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
    repoEntry.database.getElement(this, callback);
  }
};

repoEntry.prototype.setElement = function(element){
  if (this.freshnessPeriod){
    this.element = element;
    setTimeout(function(){
      delete this.element;
    }, this.freshnessPeriod);
  }

  return this;
};

repoEntry.prototype.stale = function(node){
  if ((node.repoEntry === this) && node.repoEntry.element){
    delete node.repoEntry.element;
  }
  return this;
};

module.exports = repoEntry;
