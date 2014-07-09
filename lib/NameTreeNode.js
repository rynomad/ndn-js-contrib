var FibEntry = require("./FibEntry.js")
  , PitEntry = require("./PitEntry.js")
  , MeasurementsEntry   = require("./MeasurementsEntry.js")
  , StrategyChoiceEntry = require("./strategyChoiceEntry.js")
  , binarySearch = require("./binarySearch.js")
  , ndn;

function typedToBasic (Uint8){
  var array = []
    , len   = Uint8.length

  for (var i = 0; i < len; i++){
    array[i] = Uint8[i];
  }
  return array;
}

function basicToTyped (array){
  if (!Array.isArray(array)){
    throw new TypeError("basicToTyped expected array, got " + typeof array)
  } else {
    var Uint8 = new Uint8Array(array.length);
    Uint8.set(array);
    return Uint8
  }
}



var NameTreeNode = function NameTreeNode (prefix, nameTree) {
  this.prefix     = (typeof prefix == "string") ? new ndn.Name(prefix) : (prefix || null);
  this.parent     = (nameTree) ?
                      (nameTree[prefix.getPrefix(-1).toUri()]) ?
                        nameTree[prefix.getPrefix(-1).toUri()]
                      : new node(prefix.getPrefix(-1), nameTree)
                    : null;
  this.children   = [];
  this.fibEntry   = null;
  this.pitEntries = [];
  this.measurementsEntry   = null;
  this.strategyChoiceEntry = null;
}

NameTreeNode.useNDN = function(NDN){
  ndn = NDN;
}


NameTreeNode.prototype.toJSON = function()
{ var self = this
  return ({
    prefix       : (self.prefix) ? self.prefix.toUri() : "/"
    , parent     : (self.parent) ? self.parent.prefix.toUri() : null

    , children   : (self.children.length > 0) ? (function(){
      var len = self.children.length
        , children = new Array(len)
        , i ;

      for (i = 0; i < len ; i++){
        children[i] = {
          nameComponent : typedToBasic(self.children[i].nameComponent)
          , pointer     : self.children[i].prefix.toUri()
        };
      }

      return children
    })() : []

    , fibEntry   : (self.fibEntry)               ? self.fibEntry.toJSON() : null
    , pitEntries : (self.pitEntries.length > 0)  ? (function(){
      var len = self.pitEntries.length
        , pitEntries = new Array(len)
        , i;
      for (i = 0; i < len; i++)
        pitEntries[i] = self.pitEntries[i].toJSON();

      return pitEntries;
    })() : []

    , measurementsEntry   : (self.measurementsEntry)   ? self.measurementsEntry.toJSON()   : null
    , strategyChoiceEntry : (self.strategyChoiceEntry) ? self.strategyChoiceEntry.toJSON() : null
  });
}

NameTreeNode.prototype.fromJSON = function(json, nameTree){
  var self = this;
  if (this.prefix != null){
    return;
  } else {
    this.prefix   = new ndn.Name(json.prefix);

    this.parent   = (json.parent) ?
                      (nameTree[json.parent]) ?
                        nameTree[json.parent]
                      : new node(new ndn.Name(json.parent), nameTree)
                    : this.prefix.getPrefix(-1).toUri();

    this.children = (json.children.length > 0) ? (function(){
      var len = json.children.length
        , children = new Array(len)
        , i;

      for (i = 0; i < len ; i++){
        children[i] = {
          nameComponent : basicToTyped(json.children[i].nameComponent)
          , nameTreeKey : self.children[i].nameTreeKey
        };
      }

      return children;
    })() : [];
    this.fibEntry   = (json.fibEntry) ? new FibEntry().fromJSON(json.fibEntry) : null;
    this.pitEntries = (json.pitEntries.length > 0) ? (function(){
      var len = json.pitEntries.length
        , pitEntries = new Array(len)
        , i;

      for (i = 0; i < len; i++)
        pitEntries[i] = new PitEntry.fromJSON(self.pitEntries[i]);

      return pitEntries;
    })() : [];
    this.measurementsEntry   = (json.measurementsEntry)   ? new MeasurementsEntry().fromJSON(json.measurementsEntry)     : null;
    this.strategyChoiceEntry = (json.strategyChoiceEntry) ? new StrategyChoiceEntry().fromJSON(json.strategyChoiceEntry) : null;
  };
}

NameTreeNode.prototype.addChild = function addChild(child, nameTree){
  var self  = this
    , child = (child.prefix) ? child : new node(new ndn.Name(self.prefix).append(child), nameTree)
    , index = binarySearch(this.children, child.prefix.get(-1), "prefix");

  if ( index < 0)
    this.children.splice(~index, 0, child);
  else
    console.log("node exists")
}


NameTreeNode.prototype.removeChild = function(child, nameTree){
  var index = binarySearch(this.children, nameComponent, "prefix")
  if (index < 0)
    return this;
  else{
    this.children.splice(index, 1);
    return this;
  }
}

NameTreeNode.prototype.addFibEntry = function(fibEntry){
  this.fibEntry = fibEntry;
  return this;
}

NameTreeNode.prototype.clearFibEntry = function(){
  this.fibEntry = null;
  return this;
}

NameTreeNode.prototype.addPitEntry = function(PitEntry){
  var i = binarySearch(this.pitEntries, PitEntry, "nonce")
  if (i < 0)
    PitEntry.nameTreeNode = this;
    this.pitEntries.splice(~i, 0, PitEntry)
  return ~i;

}

NameTreeNode.prototype.clearPitEntries = function(){
  this.pitEntries = null;
  return this
}

NameTreeNode.prototype.addMeasurementsEntry = function(measurementsEntry){
  this.measurementsEntry = measurementsEntry;
  return this;
}

NameTreeNode.prototype.clearMeasurementsEntry = function(){
  this.measurementsEntry = null;
  return this;
}

NameTreeNode.prototype.setStrategy = function(strategy, overwrite){
  this.strategy = strategy;
  return this;
}

NameTreeNode.prototype.clearStrategy = function(){
  this.strategy = null;
}

Name
module.exports = node
