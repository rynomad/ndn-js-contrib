var NameTree = require("./NameTree.js")
  , Name = require("ndn-js/js/name.js"); 

function Strategy (){
  this._nameTree = new NameTree()
  this._nameTree.insert(new NameTree.Node(new Name(), this.default)
  return this;
}

Strategy.prototype.default = function Strategy_default(interest, fibEntries){
  for (var i in fibEntries)
    fibEntries[i].putData(interest);
}

Strategy.prototype.insert = function Strategy_insert(prefix, chooser){
  this._nameTree.get(prefix).setItem(chooser);
}

Strategy.prototype.lookup = function Strategy_lookup(interest){
  this._nameTree.up(interest.name)
  this.skip(function(node){
    return node.isEmpty();
  })

  for (var node of this._nameTree)
    return node.getItem();
}

module.exports = Strategy;
