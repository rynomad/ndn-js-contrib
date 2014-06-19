var FibEntry = require("./FibEntry.js")
  , PitEntry = require("./PitEntry.js")
  , MeasurementsEntry   = require("./MeasurementsEntry.js")
  , StrategyChoiceEntry = require("./strategyChoiceEntry.js")

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



var nameTreeNode = function nameTreeNode (parent, prefix) {
  this.prefix     = prefix || null;
  this.parent     = parent || null;
  this.children   = [];
  this.fibEntry   = null;
  this.pitEntries = [];
  this.measurementsEntry   = null;
  this.strategyChoiceEntry = null;
}


node.prototype.toJSON = function()
{ var self = this;
  return
  {
    prefix       : (self.prefix)   ? typedToBasic(self.prefix) : []
    , parent     : (self.parent)   ? self.parent : null
    , children   : (self.children.length > 0) ? (function(){
      var len = self.children.length
        , children = new Array(len)
        , i;

      for (i = 0; i < len ; i++){
        children[i] = {
          nameComponent : typedToBasic(self.children[i].nameComponent)
          , pointer     : self.children[i].pointer
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
  };
}

node.prototype.fromJSON = function(json){
  if (this.prefix != null){
    return;
  } else {
    this.prefix   = basicToTyped(json.prefix);
    this.children = (json.children.length > 0) ? (function(){
      var len = json.children.length
        , children = new Array(len)
        , i;

      for (i = 0; i < len ; i++){
        children[i] = {
          nameComponent : basicToTyped(json.children[i].nameComponent)
          , pointer     : self.children[i].pointer
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
  }
}

module.exports = node
