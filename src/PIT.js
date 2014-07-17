var binarySearch = require("./binarySearch.js")
  , PIT = function(nameTree){this.nameTree = nameTree; return this;}


function pubKeyMatch (ar1, ar2){
  if (!ar1)
    return true

  for(var i = 0; i < ar1.length; i++ ){
    if (ar1[i] != ar2[i])
      return false
  }

  return true;

}

function PitEntry (element, interest, faceIDorCallback){
  this.nonce = interest.nonce;
  this.uri = interest.name.toUri();
  this.interest = interest;
  this.element = element;
  if (typeof faceIDorCallback == "function" )
    this.callback = faceIDorCallback
  else
    this.faceID

}

PitEntry.prototype.matches = function(data){
  if (this.interest.matchesName(data.name)
     && pubKeyMatch(this.interest.publisherPublicKeyDigest, data.signedInfo.publisher.publisherPublicKeyDigest)
     ){
    return true
  } else{
    return false
  }
}

PitEntry.prototype.consume = function() {
  if (this.nameTreeNode){
    var i = binarySearch(this.nameTreeNode.pitEntries, this, "nonce")
    if (i < 0)
      return this
    else
      return this.nameTreeNode.pitEntries.splice(~i, 1)[0];
  } else {
    return this;
  }
}


PIT.Entry = PitEntry

PIT.prototype.useNameTree = function(nameTree){
  this.nameTree = nameTree;
  return this;
}

PIT.prototype.insertPitEntry = function(pitEntry){
  setTimeout(function(){
    pitEntry.consume();
  }, pitEntry.interest.getInterestLifetimeMilliseconds() || 10);
  var node = this.nameTree.lookup(pitEntry.interest.name)
  var i = binarySearch(node.pitEntries, pitEntry, "nonce")
  if (i < 0)
    pitEntry.nameTreeNode = node;
    node.pitEntries.splice(~i, 0 ,pitEntry);
  return this;
}

PIT.prototype.lookup = function(data, name, matches, faceFlag){
  var faceFlag = faceFlag || 0
    , name = name || data.name
    , matches = matches || []
    , pitEntries = this.nameTree.lookup(name).pitEntries

  for (var i = 0; i < pitEntries.length; i++){
    if (pitEntries[i].matches(data)){
      matches.push(pitEntries[i])
      faceFlag = faceFlag | (1 << pitEntries[i].faceID)
    }
  }

  if (name.size() > 0)
    return this.lookup(data, name.getPrefix(-1), matches, faceFlag);
  else
    return {pitEntries : matches, faces : faceFlag};
}

module.exports = PIT;
